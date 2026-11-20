// Personal finance of the player: cash wallet, piggy bank, savings goals,
// goods, transaction history and net worth. Transfers never create money.
import type { State } from './state';
import { atPlace, PLACE_NAMES, type Place } from './places';

export type TxKind = 'income' | 'expense' | 'transfer';
export type Move = { acc: string; amount: number };
export type Tx = { id: number; day: number; minutes: number; label: string; kind: TxKind; party: string; moves: Move[]; cash: number; piggy: number };

export const GOODS = {
  ball: { name: 'Quả bóng nhựa', price: 40000, seller: 'shop' as Place, minAge: 3, happiness: 6, use: 'Đá bóng cùng bạn vui hơn, quan hệ tăng thêm.' },
  picturebook: { name: 'Sách tranh', price: 25000, seller: 'shop' as Place, minAge: 3, happiness: 3, use: 'Mở hoạt động đọc sách tại nhà (Trí tuệ +).' },
  blocks: { name: 'Bộ xếp hình', price: 60000, seller: 'shop' as Place, minAge: 3, happiness: 8, use: 'Mở hoạt động chơi xếp hình tại nhà (Sáng tạo +).' },
  backpack: { name: 'Ba lô to', price: 120000, seller: 'shop' as Place, minAge: 3, happiness: 3, use: 'Nhặt ve chai mang được 16 món thay vì 8.' },
  watch: { name: 'Đồng hồ đeo tay', price: 250000, seller: 'market' as Place, minAge: 3, happiness: 4, use: 'Mỗi chuyến giao hàng có thêm 20 phút.' },
  balancebike: { name: 'Xe chòi chân', price: 300000, seller: 'market' as Place, minAge: 3, happiness: 8, speed: 1.12, use: 'Đi ngoài phố nhanh hơn 12%.' },
  scooter: { name: 'Xe trượt scooter', price: 550000, seller: 'market' as Place, minAge: 3, happiness: 10, speed: 1.2, use: 'Đi ngoài phố nhanh hơn 20%.' },
  bike: { name: 'Xe đạp trẻ em', price: 1000000, seller: 'market' as Place, minAge: 3, happiness: 15, speed: 1.3, use: 'Đi lại ngoài phố nhanh hơn 30%.' },
  phone: { name: 'Điện thoại', price: 3000000, seller: 'market' as Place, minAge: 10, happiness: 10, use: 'Liên lạc, tìm việc (mở ở tuổi thiếu niên).' },
  mtb: { name: 'Xe đạp địa hình', price: 2500000, seller: 'market' as Place, minAge: 10, happiness: 14, speed: 1.4, use: 'Đi ngoài phố nhanh hơn 40%.' },
  ebike: { name: 'Xe đạp điện', price: 9000000, seller: 'market' as Place, minAge: 14, happiness: 16, speed: 1.6, use: 'Đi ngoài phố nhanh hơn 60%.' },
  motorbike: { name: 'Xe máy', price: 25000000, seller: 'market' as Place, minAge: 18, happiness: 12, speed: 1.8, use: 'Đi làm xa, nhanh hơn 80% (mở khi trưởng thành).' },
} as const;
export type GoodId = keyof typeof GOODS;
export const GOAL_IDS = ['ball', 'blocks', 'backpack', 'watch', 'balancebike', 'scooter', 'bike', 'phone', 'mtb', 'ebike', 'motorbike', 'land'] as const;
/** Speed multiplier of the fastest vehicle the player owns (1 = on foot). */
export function vehicleSpeed(s: State) {
  let best = 1;
  for (const id of Object.keys(GOODS) as GoodId[]) { const g = GOODS[id] as { speed?: number }; if (g.speed && s.finance.owned[id] > 0) best = Math.max(best, g.speed); }
  return best;
}
export function vehicleName(s: State) {
  let best: GoodId | null = null;
  for (const id of Object.keys(GOODS) as GoodId[]) { const g = GOODS[id] as { speed?: number }; if (g.speed && s.finance.owned[id] > 0 && (!best || g.speed > ((GOODS[best] as { speed?: number }).speed ?? 1))) best = id; }
  return best ? GOODS[best].name : null;
}
export type GoalId = typeof GOAL_IDS[number];
export const goalInfo = (id: GoalId) =>
  id === 'land' ? { name: 'Mua đất ở Quảng Yên', price: 300000000, minAge: 22, seller: null } : { ...GOODS[id], seller: GOODS[id].seller as Place | null };
export type Goal = { id: GoalId; saved: number; status: 'active' | 'bought' };

export type Finance = {
  piggyOwned: boolean; piggy: number; goals: Goal[]; owned: Record<GoodId, number>;
  tx: Tx[]; nextTx: number; investments: number; business: number; liabilities: number;
};
export const ACCOUNT_UNLOCK = { bank: 15, investment: 18, business: 18 };
export const freshFinance = (): Finance => ({
  piggyOwned: false, piggy: 0, goals: [], owned: Object.fromEntries(Object.keys(GOODS).map(id => [id, 0])) as Record<GoodId, number>,
  tx: [], nextTx: 1, investments: 0, business: 0, liabilities: 0,
});

const goalOf = (s: State, id: string) => s.finance.goals.find(g => g.id === id && g.status === 'active');
function balance(s: State, acc: string) {
  if (acc === 'cash') return s.money;
  if (acc === 'piggy') return s.finance.piggy;
  if (acc === 'jar:save' || acc === 'jar:share') return s.family.jars[acc.slice(4) as 'save' | 'share'];
  if (acc.startsWith('goal:')) return goalOf(s, acc.slice(5))?.saved ?? 0;
  return 0;
}
function adjust(s: State, acc: string, amount: number) {
  if (acc === 'cash') s.money += amount;
  else if (acc === 'piggy') s.finance.piggy += amount;
  else if (acc === 'jar:save' || acc === 'jar:share') s.family.jars[acc.slice(4) as 'save' | 'share'] += amount;
  else if (acc.startsWith('goal:')) { const g = goalOf(s, acc.slice(5)); if (g) g.saved += amount; }
}

/** Applies all legs of a transaction atomically and records it. Fails if any account would go negative. */
export function transact(s: State, label: string, kind: TxKind, party: string, moves: Move[]) {
  if (!moves.length || moves.some(m => !Number.isSafeInteger(m.amount) || m.amount === 0)) return false;
  if (moves.some(m => balance(s, m.acc) + m.amount < 0)) return false;
  for (const m of moves) adjust(s, m.acc, m.amount);
  const f = s.finance;
  f.tx.unshift({ id: f.nextTx++, day: s.day, minutes: Math.floor(s.minutes), label, kind, party, moves: moves.map(m => ({ ...m })), cash: s.money, piggy: f.piggy });
  f.tx = f.tx.slice(0, 150);
  return true;
}
export const earn = (s: State, amount: number, label: string, party: string) => amount > 0 && transact(s, label, 'income', party, [{ acc: 'cash', amount }]);
export const spendCash = (s: State, amount: number, label: string, party: string) => amount > 0 && spendable(s) >= amount && transact(s, label, 'expense', party, [{ acc: 'cash', amount: -amount }]);
/** Cash the child may freely use: errand money from mum is reserved. */
export const spendable = (s: State) => s.money - (s.family.advance - s.family.advanceSpent);

export const atHome = (s: State) => atPlace(s, 'home');

export function depositPiggy(s: State, amount: number) {
  if (!s.finance.piggyOwned || !atHome(s) || !Number.isSafeInteger(amount) || amount <= 0 || spendable(s) < amount) return false;
  return transact(s, 'Bỏ ống heo', 'transfer', 'Ống heo', [{ acc: 'cash', amount: -amount }, { acc: 'piggy', amount }]);
}
export function withdrawPiggy(s: State, amount: number) {
  if (!s.finance.piggyOwned || !atHome(s) || !Number.isSafeInteger(amount) || amount <= 0 || s.finance.piggy < amount) return false;
  return transact(s, 'Lấy tiền từ ống heo', 'transfer', 'Ống heo', [{ acc: 'piggy', amount: -amount }, { acc: 'cash', amount }]);
}

export function startGoal(s: State, id: GoalId) {
  const info = goalInfo(id);
  if (s.age < info.minAge || goalOf(s, id) || s.finance.goals.filter(g => g.status === 'active').length >= 3) return false;
  s.finance.goals.push({ id, saved: 0, status: 'active' });
  return true;
}
export function fundGoal(s: State, id: GoalId, amount: number, from: 'cash' | 'piggy') {
  const g = goalOf(s, id);
  if (!g || !atHome(s) || !Number.isSafeInteger(amount) || amount <= 0) return false;
  const room = goalInfo(id).price - g.saved; amount = Math.min(amount, room);
  if (amount <= 0 || (from === 'cash' ? spendable(s) : s.finance.piggy) < amount) return false;
  return transact(s, 'Để dành cho: ' + goalInfo(id).name, 'transfer', 'Mục tiêu tiết kiệm', [{ acc: from, amount: -amount }, { acc: 'goal:' + id, amount }]);
}
export function cancelGoal(s: State, id: GoalId) {
  const g = goalOf(s, id); if (!g) return false;
  if (g.saved > 0) {
    if (!atHome(s)) return false;
    const to = s.finance.piggyOwned ? 'piggy' : 'cash';
    transact(s, 'Hủy mục tiêu, trả tiền về ' + (to === 'piggy' ? 'ống heo' : 'ví'), 'transfer', 'Mục tiêu tiết kiệm', [{ acc: 'goal:' + id, amount: -g.saved }, { acc: to, amount: g.saved }]);
  }
  s.finance.goals = s.finance.goals.filter(x => x !== g);
  return true;
}
export const goalProgress = (g: Goal) => Math.min(1, g.saved / goalInfo(g.id).price);

function receive(s: State, id: GoodId) {
  s.finance.owned[id]++;
  s.happiness = Math.min(100, s.happiness + GOODS[id].happiness);
}
/** Pays at the seller with goal funds once the goal is complete. */
export function buyWithGoal(s: State, id: GoalId) {
  const g = goalOf(s, id); if (!g || id === 'land') return false;
  const good = GOODS[id];
  if (g.saved < good.price || !atPlace(s, good.seller)) return false;
  if (!transact(s, 'Mua ' + good.name + ' bằng tiền tiết kiệm', 'expense', PLACE_NAMES[good.seller], [{ acc: 'goal:' + id, amount: -good.price }])) return false;
  g.status = 'bought'; receive(s, id);
  return true;
}
/** Buys directly with cash at the seller. */
export function buyGood(s: State, id: GoodId, price: number = GOODS[id].price, checkPlace = true) {
  const good = GOODS[id];
  if (s.age < good.minAge || (checkPlace && !atPlace(s, good.seller))) return false;
  if (!spendCash(s, price, 'Mua ' + good.name, PLACE_NAMES[good.seller])) return false;
  receive(s, id);
  return true;
}

export const RESALE = 0.5;
export function netWorth(s: State) {
  const f = s.finance;
  const cash = s.money;
  const savings = f.piggy + f.goals.reduce((n, g) => n + (g.status === 'active' ? g.saved : 0), 0) + s.family.jars.save + s.family.jars.share + s.bank;
  const goods = (Object.keys(f.owned) as GoodId[]).reduce((n, id) => n + f.owned[id] * Math.round(GOODS[id].price * RESALE), 0);
  const assets = cash + savings + f.investments + f.business + goods + s.assets;
  const liabilities = f.liabilities + (s.family.advance - s.family.advanceSpent);
  return { cash, savings, investments: f.investments, business: f.business, goods, assets, liabilities, netWorth: assets - liabilities };
}

export function restoreFinance(raw: unknown): Finance {
  const base = freshFinance();
  if (!raw || typeof raw !== 'object') return base;
  const v = raw as Finance;
  const n = (x: unknown) => (Number.isSafeInteger(x) && (x as number) >= 0 ? (x as number) : 0);
  const owned = { ...base.owned };
  for (const id of Object.keys(owned) as GoodId[]) owned[id] = n(v.owned?.[id]);
  return {
    ...base, ...v,
    piggyOwned: !!v.piggyOwned, piggy: n(v.piggy), investments: n(v.investments), business: n(v.business), liabilities: n(v.liabilities), nextTx: Math.max(1, n(v.nextTx)),
    owned,
    goals: Array.isArray(v.goals) ? v.goals.filter(g => (GOAL_IDS as readonly string[]).includes(g?.id) && Number.isSafeInteger(g.saved) && g.saved >= 0 && (g.status === 'active' || g.status === 'bought')) : [],
    tx: Array.isArray(v.tx) ? v.tx.filter(t => typeof t?.label === 'string' && Array.isArray(t.moves)).slice(0, 150) : [],
  };
}
