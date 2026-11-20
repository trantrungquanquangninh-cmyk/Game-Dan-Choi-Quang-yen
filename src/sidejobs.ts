// Side jobs ("việc vặt") to earn pocket money for bigger purchases.
// Every coin is earned by walking the town: take a job at the neighbourhood
// board, pick the goods up, carry them along the sidewalks and hand them over.
// Jobs carry real risk: running with fragile goods breaks them (you pay half
// back), arriving late halves the pay, and scrap prices change every day.
import type { State } from './state';
import { rand } from './minigames';
import { earn, spendCash, spendable } from './finance';
import { activityLock, notify } from './activities';
import { atPlace, placePoint, type Place } from './places';
import { buildings } from './data';
import { doorOf } from './navigation';
import { landmarks, roads } from './mapLayout';
import { SPOTS, KERB, KERB_GAP, SIDEWALK, onWalkway, walkGrid } from './walkways';
import { collisionOf } from './buildingLayout';
import { clock } from './clock';

export type JobKind = 'delivery' | 'flyers';
export type Job = {
  key: string; kind: JobKind; title: string; giver: string; item: string;
  from: string; stops: string[]; done: string[]; pay: number; perStop: number;
  fragile: boolean; picked: boolean; limit: number; deadline: number; sprint: number;
};
export type Jobs = {
  day: number; taken: string[]; active: Job | null;
  bag: number; scrapDay: number; scrapTaken: number[];
  completed: number; earned: number; broken: number; late: number;
};
export type Result = { ok: boolean; message: string };

export const freshJobs = (): Jobs => ({ day: 0, taken: [], active: null, bag: 0, scrapDay: 0, scrapTaken: [], completed: 0, earned: 0, broken: 0, late: 0 });
export function restoreJobs(raw: unknown): Jobs {
  const base = freshJobs();
  if (!raw || typeof raw !== 'object') return base;
  const v = raw as Partial<Jobs>, n = (x: unknown) => (Number.isSafeInteger(x) && (x as number) >= 0 ? (x as number) : 0);
  const a = v.active as Job | null | undefined;
  const active = a && typeof a.key === 'string' && Array.isArray(a.stops) && Array.isArray(a.done) && Number.isSafeInteger(a.pay) ? { ...a } : null;
  return {
    day: n(v.day), taken: Array.isArray(v.taken) ? v.taken.filter(k => typeof k === 'string') : [], active,
    bag: n(v.bag), scrapDay: n(v.scrapDay), scrapTaken: Array.isArray(v.scrapTaken) ? v.scrapTaken.filter(i => Number.isSafeInteger(i)) : [],
    completed: n(v.completed), earned: n(v.earned), broken: n(v.broken), late: n(v.late),
  };
}

// ---------------- Points in the world ----------------
const OPEN = 6 * 60 + 30, LAST_TAKE = 19 * 60 + 30, MARKET_OPEN = 6 * 60, MARKET_CLOSE = 18 * 60;
const NAMES: Record<string, string> = {
  shop: 'Tạp hóa cô Lan', cafe: 'Cà phê anh Tú', neighbor: 'Nhà cô Hằng', market: 'Chợ Rừng (bà Tư)',
  school: 'Cổng trường Hoa Nắng', binh: 'Vườn bác Bình', oms: 'Tiệm bánh Om’s Cake', home: 'Nhà mình', board: 'Bảng việc vặt',
};
export function jobPoint(id: string): { x: number; y: number } {
  if (id === 'oms') { const p = landmarks.find(p => p.id === 'oms-cake')!; return { x: p.x, y: p.y }; }
  if (id === 'board') return { x: SPOTS.board.x, y: SPOTS.board.y };
  if (id === 'home') return doorOf('home');
  if (id.startsWith('house:')) return doorOf(id.slice(6));
  return placePoint(id as Place);
}
export const pointName = (id: string) => NAMES[id] ?? (id.startsWith('house:') ? 'Nhà số ' + (buildings.findIndex(b => b.id === id.slice(6)) + 1) : id);
export const JOB_REACH = 110;
const near = (s: State, id: string, r = JOB_REACH) => { if (s.inside) return false; const p = jobPoint(id); return Math.hypot(s.x - p.x, s.y - p.y) <= r; };
export const atBoard = (s: State) => near(s, 'board', 90);
const now = (s: State) => s.day * 1440 + Math.floor(s.minutes);

// ---------------- Daily offers ----------------
type Template = { id: string; giver: string; from: string; to: string; item: string; fragile: boolean };
export const DELIVERIES: Template[] = [
  { id: 'rice', giver: 'Cô Lan', from: 'shop', to: 'neighbor', item: 'túi gạo 2 kg', fragile: false },
  { id: 'cake', giver: 'Om’s Cake', from: 'oms', to: 'cafe', item: 'hộp bánh kem', fragile: true },
  { id: 'seeds', giver: 'Bà Tư', from: 'market', to: 'binh', item: 'gói hạt giống', fragile: false },
  { id: 'tea', giver: 'Anh Tú', from: 'cafe', to: 'school', item: 'bình trà đá cho cô Mai', fragile: true },
  { id: 'veg', giver: 'Bác Bình', from: 'binh', to: 'shop', item: 'rổ rau sạch', fragile: false },
  { id: 'eggs', giver: 'Cô Lan', from: 'shop', to: 'oms', item: 'khay trứng gà', fragile: true },
  { id: 'cloth', giver: 'Cô Hằng', from: 'neighbor', to: 'market', item: 'túi quần áo nhờ sửa', fragile: false },
  { id: 'bread', giver: 'Om’s Cake', from: 'oms', to: 'neighbor', item: 'túi bánh mì ngọt', fragile: false },
];
const dist = (a: string, b: string) => { const p = jobPoint(a), q = jobPoint(b); return Math.hypot(p.x - q.x, p.y - q.y); };
/** Pay grows with distance; fragile goods pay a little more. */
export const deliveryPay = (t: Template) => Math.min(25000, Math.max(5000, Math.round((4000 + dist(t.from, t.to) * 8) / 1000) * 1000 + (t.fragile ? 2000 : 0)));
/** In-game minutes allowed after pick-up (walking ~0.012 min/px, 2.5× slack). */
export const deliveryLimit = (t: Template) => Math.round(20 + dist(t.from, t.to) * 0.03);

function flyerHouses(day: number) {
  const cafe = jobPoint('cafe');
  const homes = buildings.filter(b => b.id.startsWith('block')).map(b => ({ id: b.id, d: Math.hypot(doorOf(b.id).x - cafe.x, doorOf(b.id).y - cafe.y) })).sort((a, b) => a.d - b.d).slice(0, 14);
  return homes.map((h, i) => ({ ...h, k: rand('flyer:' + day + ':' + i) })).sort((a, b) => a.k - b.k).slice(0, 5).map(h => 'house:' + h.id);
}

/** Today's offers on the board (deterministic per day, so reloads match). */
export function offersFor(day: number): Job[] {
  const list: Job[] = DELIVERIES.map((t, i) => ({ t, k: rand('job:' + day + ':' + i) })).sort((a, b) => a.k - b.k).slice(0, 3).map(({ t }): Job => {
    const pay = deliveryPay(t);
    return { key: 'd:' + day + ':' + t.id, kind: 'delivery' as const, title: 'Giao ' + t.item, giver: t.giver, item: t.item, from: t.from, stops: [t.to], done: [], pay, perStop: pay, fragile: t.fragile, picked: false, limit: deliveryLimit(t), deadline: 0, sprint: 0 };
  });
  const houses = flyerHouses(day);
  list.push({ key: 'f:' + day, kind: 'flyers', title: 'Phát tờ rơi quán cà phê', giver: 'Anh Tú', item: '5 tờ rơi khai trương món mới', from: 'cafe', stops: houses, done: [], pay: houses.length * 2000 + 4000, perStop: 2000, fragile: false, picked: false, limit: 90, deadline: 0, sprint: 0 });
  return list;
}
function syncDay(s: State) { if (s.jobs.day !== s.day) { s.jobs.day = s.day; s.jobs.taken = []; } }
export function jobOffers(s: State) { syncDay(s); return offersFor(s.day).filter(j => !s.jobs.taken.includes(j.key)); }

const watchBonus = (s: State) => (s.finance.owned.watch > 0 ? 20 : 0);
export function jobLock(s: State): string | null {
  if (s.jobs.active) return 'Đang làm “' + s.jobs.active.title + '”. Làm xong hoặc bỏ việc trước.';
  if (s.minutes < OPEN || s.minutes > LAST_TAKE) return 'Bảng việc chỉ nhận việc từ 06:30 đến 19:30.';
  if (s.energy < 10) return 'Con mệt rồi, nghỉ cho lại sức đã.';
  return activityLock(s);
}
export function acceptJob(s: State, key: string): Result {
  const job = jobOffers(s).find(j => j.key === key);
  if (!job) return { ok: false, message: 'Việc này đã có người nhận.' };
  if (!atBoard(s)) return { ok: false, message: 'Hãy đến Bảng việc vặt khu phố để nhận việc.' };
  const lock = jobLock(s); if (lock) return { ok: false, message: lock };
  s.jobs.taken.push(key); s.jobs.active = { ...job, stops: [...job.stops], done: [] };
  return { ok: true, message: 'Đã nhận việc! Đến ' + pointName(job.from) + ' để lấy ' + job.item + '.' };
}
export function abandonJob(s: State): Result {
  const j = s.jobs.active; if (!j) return { ok: false, message: 'Không có việc nào đang làm.' };
  s.jobs.active = null; s.relationships[giverId(j.giver)] = (s.relationships[giverId(j.giver)] || 0) - 2;
  return { ok: true, message: 'Đã bỏ việc. ' + j.giver + ' hơi buồn (quan hệ −2).' };
}
const giverId = (g: string) => ({ 'Cô Lan': 'lan', 'Anh Tú': 'tu', 'Bà Tư': 'ba-tu', 'Bác Bình': 'binh', 'Cô Hằng': 'hang', 'Om’s Cake': 'oms' } as Record<string, string>)[g] ?? g;

// ---------------- Doing the job ----------------
export type Target = { id: string; x: number; y: number; label: string };
/** Points where pressing E advances the active job. */
export function jobTargets(s: State): Target[] {
  const j = s.jobs.active; if (!j) return [];
  if (!j.picked) return [{ id: 'pickup', ...jobPoint(j.from), label: 'Nhận ' + j.item + ' · ' + pointName(j.from) }];
  return j.stops.filter(id => !j.done.includes(id)).map(id => ({ id: 'stop:' + id, ...jobPoint(id), label: (j.kind === 'flyers' ? 'Nhét tờ rơi · ' : 'Giao hàng · ') + pointName(id) }));
}
/** Next place to walk to (nearest remaining stop). */
export function nextTarget(s: State): Target | null {
  const t = jobTargets(s); if (!t.length) return null;
  return t.reduce((a, b) => (Math.hypot(a.x - s.x, a.y - s.y) <= Math.hypot(b.x - s.x, b.y - s.y) ? a : b));
}
export function minutesLeft(s: State) { const j = s.jobs.active; return j && j.picked ? j.deadline - now(s) : null; }

export function jobInteract(s: State, target: string): Result {
  const j = s.jobs.active; if (!j) return { ok: false, message: 'Không có việc nào đang làm.' };
  if (target === 'pickup') {
    if (j.picked) return { ok: false, message: 'Đã nhận hàng rồi.' };
    if (!near(s, j.from)) return { ok: false, message: 'Hãy đến ' + pointName(j.from) + ' để nhận hàng.' };
    j.picked = true; j.deadline = now(s) + j.limit + watchBonus(s); s.minutes += 2;
    return { ok: true, message: j.giver + ' đưa con ' + j.item + '. Hạn chót ' + clock(j.deadline % 1440) + (j.fragile ? '. Hàng dễ vỡ: đừng chạy (Shift)!' : '.') };
  }
  const stop = target.replace(/^stop:/, '');
  if (!j.picked || !j.stops.includes(stop) || j.done.includes(stop)) return { ok: false, message: 'Điểm này không có trong việc hiện tại.' };
  if (!near(s, stop)) return { ok: false, message: 'Hãy đến gần ' + pointName(stop) + '.' };
  j.done.push(stop); s.minutes += 2; s.energy = Math.max(0, s.energy - 2);
  const late = now(s) > j.deadline;
  if (j.kind === 'flyers') {
    earn(s, j.perStop, 'Phát tờ rơi cho ' + pointName(stop), j.giver); s.jobs.earned += j.perStop;
    if (j.done.length < j.stops.length) return { ok: true, message: 'Đã nhét tờ rơi (+2.000đ). Còn ' + (j.stops.length - j.done.length) + ' nhà.' };
    const bonus = late ? 0 : j.pay - j.perStop * j.stops.length;
    if (bonus > 0) { earn(s, bonus, 'Thưởng phát tờ rơi đúng hạn', j.giver); s.jobs.earned += bonus; }
    return finish(s, j, late, late ? 'Phát xong nhưng trễ hạn: không có thưởng.' : 'Phát xong đúng hạn! Thưởng thêm ' + bonus.toLocaleString('vi-VN') + 'đ.');
  }
  const pay = late ? Math.round(j.pay / 2000) * 1000 : j.pay;
  earn(s, pay, 'Giao ' + j.item + ' đến ' + pointName(stop), j.giver); s.jobs.earned += pay;
  return finish(s, j, late, late ? 'Giao trễ hạn, chỉ nhận một nửa tiền công: ' + pay.toLocaleString('vi-VN') + 'đ.' : 'Giao đúng hạn! Nhận ' + pay.toLocaleString('vi-VN') + 'đ tiền công.');
}
function finish(s: State, j: Job, late: boolean, message: string): Result {
  s.jobs.active = null; s.jobs.completed++; if (late) s.jobs.late++;
  const id = giverId(j.giver); s.relationships[id] = (s.relationships[id] || 0) + (late ? 0 : 2);
  s.xp += late ? 3 : 8; s.discipline = Math.min(100, s.discipline + (late ? 0 : 1)); s.reputation = Math.min(100, s.reputation + (late ? 0 : 1));
  return { ok: true, message };
}

/** Called every frame outdoors: running with fragile goods breaks them. */
export const SPRINT_BREAK = 4;
export function jobTick(s: State, dt: number, sprinting: boolean): string | null {
  const j = s.jobs.active; if (!j) return null;
  const takenDay = Number(j.key.split(':')[1]) || s.day;
  if ((j.picked && now(s) - j.deadline > 6 * 60) || (!j.picked && takenDay < s.day)) {
    s.jobs.active = null; const id = giverId(j.giver); s.relationships[id] = (s.relationships[id] || 0) - 3;
    return 'Bỏ dở “' + j.title + '” quá lâu. ' + j.giver + ' thất vọng (quan hệ −3).';
  }
  if (!j.fragile || !j.picked || !sprinting) return null;
  j.sprint += dt; if (j.sprint < SPRINT_BREAK) return null;
  s.jobs.active = null; s.jobs.broken++;
  const fine = Math.round(j.pay / 2000) * 1000, id = giverId(j.giver);
  if (spendable(s) >= fine && spendCash(s, fine, 'Đền ' + j.item + ' bị vỡ', j.giver)) return 'Choang! ' + j.item + ' vỡ vì chạy quá nhanh. Con đền ' + fine.toLocaleString('vi-VN') + 'đ.';
  s.relationships[id] = (s.relationships[id] || 0) - 4;
  return 'Choang! ' + j.item + ' vỡ vì chạy quá nhanh. Không đủ tiền đền, ' + j.giver + ' rất buồn (quan hệ −4).';
}

// ---------------- Scrap collecting ----------------
export const SCRAP_PER_DAY = 14, SCRAP_REACH = 26;
export const scrapCapacity = (s: State) => (s.finance.owned.backpack > 0 ? 16 : 8);
/** Price per item at bà Tư's, 500–1.500đ, changes every day. */
export const scrapPrice = (day: number) => 500 + Math.floor(rand('scrap-price:' + day) * 11) * 100;
let candidates: { x: number; y: number }[] | undefined;
function scrapCandidates() {
  if (candidates) return candidates;
  const solid = buildings.map(collisionOf); walkGrid();
  const list: { x: number; y: number }[] = [];
  for (const road of roads) for (let i = 1; i < road.points.length; i++) {
    const a = road.points[i - 1], b = road.points[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!len) continue;
    const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len, off = road.width / 2 + (KERB + KERB_GAP + SIDEWALK) / 2;
    for (let d = 60; d < len - 60; d += 150) for (const side of [1, -1]) {
      const x = a[0] + ux * d - uy * off * side, y = a[1] + uy * d + ux * off * side;
      if (onWalkway(x, y) && !solid.some(r => x + 12 > r.x && x - 12 < r.x + r.w && y + 12 > r.y && y - 12 < r.y + r.h)) list.push({ x, y });
    }
  }
  return candidates = list;
}
/** Today's bottles and cans lying on the sidewalks. */
export function scrapSpots(day: number) {
  const c = scrapCandidates();
  return c.map((p, i) => ({ p, i, k: rand('scrap:' + day + ':' + i) })).sort((a, b) => a.k - b.k).slice(0, SCRAP_PER_DAY).map(({ p, i }) => ({ ...p, id: i }));
}
export function scrapLeft(s: State) {
  if (s.jobs.scrapDay !== s.day) return scrapSpots(s.day);
  return scrapSpots(s.day).filter(p => !s.jobs.scrapTaken.includes(p.id));
}
/** Picks up nearby bottles while walking (daytime only). Returns how many. */
export function collectScrap(s: State): number {
  if (s.inside || s.minutes < 6 * 60 || s.minutes > 20 * 60) return 0;
  if (s.jobs.scrapDay !== s.day) { s.jobs.scrapDay = s.day; s.jobs.scrapTaken = []; }
  let got = 0;
  for (const p of scrapSpots(s.day)) {
    if (s.jobs.scrapTaken.includes(p.id) || Math.hypot(p.x - s.x, p.y - s.y) > SCRAP_REACH) continue;
    if (s.jobs.bag >= scrapCapacity(s)) { notify(s, 'Túi ve chai đầy rồi (' + s.jobs.bag + ' món). Mang ra Chợ Rừng bán cho bà Tư.'); s.jobs.scrapTaken.push(p.id); break; }
    s.jobs.scrapTaken.push(p.id); s.jobs.bag++; got++;
  }
  return got;
}
export function sellScrap(s: State): Result {
  if (!atPlace(s, 'market')) return { ok: false, message: 'Bà Tư thu mua ve chai ở Chợ Rừng.' };
  if (s.minutes < MARKET_OPEN || s.minutes >= MARKET_CLOSE) return { ok: false, message: 'Bà Tư chỉ thu mua từ 06:00 đến 18:00.' };
  if (s.jobs.bag <= 0) return { ok: false, message: 'Túi chưa có ve chai nào.' };
  const n = s.jobs.bag, amount = n * scrapPrice(s.day);
  earn(s, amount, 'Bán ' + n + ' ve chai cho bà Tư', 'Bà Tư (chợ)'); s.jobs.bag = 0; s.jobs.earned += amount;
  s.relationships['ba-tu'] = (s.relationships['ba-tu'] || 0) + 1; s.minutes += 3;
  return { ok: true, message: 'Bán ' + n + ' ve chai × ' + scrapPrice(s.day).toLocaleString('vi-VN') + 'đ = ' + amount.toLocaleString('vi-VN') + 'đ.' };
}
