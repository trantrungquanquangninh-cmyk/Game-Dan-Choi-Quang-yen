import React from 'react';
import { state, money } from './state';
import { scene } from './game';
import { clock } from './clock';
import { GOODS, GOAL_IDS, goalInfo, spendable, vehicleName, type GoodId } from './finance';
import { PLACE_NAMES } from './places';
import { SPOTS } from './walkways';
import {
  jobOffers, acceptJob, abandonJob, jobLock, atBoard, nextTarget, minutesLeft, pointName,
  scrapLeft, scrapPrice, scrapCapacity, sellScrap, SPRINT_BREAK, type Job,
} from './sidejobs';
import { atPlace } from './places';

type Props = { onAction: (fn: () => void) => void; notice: (message: string) => void };

/** Marks the next hand-over point (or the board) on the map. */
export function guideJob(notice: Props['notice']) {
  const t = nextTarget(state);
  if (!t) { scene?.setDestination(SPOTS.board.x, SPOTS.board.y); notice('Đã đánh dấu Bảng việc vặt khu phố. Đi theo vỉa hè và mũi tên vàng.'); return; }
  scene?.setDestination(t.x, t.y); notice('Đã đánh dấu: ' + t.label + '.');
}

function JobCard({ job, children }: { job: Job; children?: React.ReactNode }) {
  return <article className={'activity-card job-card ' + job.kind}>
    <small>{job.kind === 'flyers' ? 'PHÁT TỜ RƠI' : 'GIAO HÀNG'} · {job.giver}{job.fragile ? ' · DỄ VỠ' : ''}</small>
    <h4>{job.title}</h4>
    <p>{job.kind === 'flyers'
      ? `Lấy ${job.item} ở ${pointName(job.from)}, nhét vào ${job.stops.length} nhà được đánh dấu xanh.`
      : `Lấy ở ${pointName(job.from)} → giao đến ${pointName(job.stops[0])}.`}</p>
    <p className="activity-meta">💰 {money(job.pay)}{job.kind === 'flyers' ? ` (2.000đ/nhà + thưởng ${money(job.pay - job.perStop * job.stops.length)} nếu đúng hạn)` : ''} · ⏱ {job.limit}{state.finance.owned.watch > 0 ? '+20' : ''} phút sau khi nhận hàng</p>
    {children}
  </article>;
}

export function JobBoard({ onAction, notice }: Props) {
  const here = atBoard(state), j = state.jobs.active, lock = jobLock(state), offers = jobOffers(state);
  const left = minutesLeft(state);
  const run = (fn: () => { ok: boolean; message: string }, guide = false) => onAction(() => { const r = fn(); notice(r.message); if (r.ok && guide) window.setTimeout(() => guideJob(() => {}), 0); });
  const vehicle = vehicleName(state);
  return <div className="life-panel">
    <p className="family-intro">Làm việc vặt để tích góp mua xe, đồ dùng. Mọi việc đều phải <b>đi bộ trên vỉa hè</b>: nhận việc ở bảng, đến lấy hàng, mang đến nơi rồi nhấn <kbd>E</kbd> ở vòng tròn xanh.</p>
    {j && <JobCard job={j}>
      <p className="learning-note">{!j.picked ? 'Bước 1: đến ' + pointName(j.from) + ' nhận hàng.' : `Bước 2: còn ${j.stops.length - j.done.length} điểm giao · ${left !== null && left >= 0 ? 'còn ' + left + ' phút (hạn ' + clock(j.deadline % 1440) + ')' : 'ĐÃ TRỄ HẠN – tiền công giảm một nửa'}`}{j.fragile && j.picked ? ` · Hàng dễ vỡ: chạy quá ${SPRINT_BREAK} giây là vỡ, phải đền nửa tiền công.` : ''}</p>
      <div className="mini-actions"><button className="primary" onClick={() => guideJob(notice)}>Chỉ đường</button><button onClick={() => run(() => abandonJob(state))}>Bỏ việc</button></div>
    </JobCard>}
    {!here && !j && <p className="finance-alert">Đến Bảng việc vặt (cạnh nhà mình) để nhận việc. <button onClick={() => guideJob(notice)}>Chỉ đường</button></p>}
    <h3>Việc hôm nay ({offers.length})</h3>
    {offers.length ? offers.map(o => <JobCard job={o} key={o.key}>
      <div className="mini-actions"><button className="primary" disabled={!here || !!lock} onClick={() => run(() => acceptJob(state, o.key), true)}>Nhận việc</button></div>
    </JobCard>) : <p className="muted">Hết việc hôm nay. Sáng mai bảng sẽ có việc mới.</p>}
    {lock && !j && <p className="finance-alert">{lock}</p>}
    <h3>Nhặt ve chai</h3>
    <div className="finance-row"><span>Ve chai còn trên vỉa hè hôm nay</span><b>{scrapLeft(state).length}</b></div>
    <div className="finance-row"><span>Trong túi</span><b>{state.jobs.bag}/{scrapCapacity(state)}</b></div>
    <div className="finance-row"><span>Giá bà Tư thu hôm nay (thay đổi mỗi ngày)</span><b>{money(scrapPrice(state.day))}/món</b></div>
    <p className="learning-note">Đi ngang qua chai nhựa, lon trên vỉa hè (06:00–20:00) là tự nhặt. Bán ở Chợ Rừng 06:00–18:00. Giá hôm nay thấp? Có thể giữ lại chờ giá cao, nhưng ngày mai có thể còn thấp hơn.</p>
    <h3>Thành tích</h3>
    <div className="finance-row"><span>Việc đã xong · trễ · làm vỡ</span><b>{state.jobs.completed} · {state.jobs.late} · {state.jobs.broken}</b></div>
    <div className="finance-row"><span>Tổng tiền kiếm từ việc vặt</span><b>{money(state.jobs.earned)}</b></div>
    <div className="finance-row"><span>Phương tiện đang dùng</span><b>{vehicle ?? 'Đi bộ'}</b></div>
    <SavingsHint />
  </div>;
}

/** What the current cash could buy, to motivate saving up. */
function SavingsHint() {
  const cash = spendable(state) + state.finance.piggy;
  const next = GOAL_IDS.filter(id => id !== 'land' && state.age >= goalInfo(id).minAge && !(state.finance.owned[id as GoodId] > 0)).map(id => ({ id: id as GoodId, ...GOODS[id as GoodId] })).sort((a, b) => a.price - b.price).slice(0, 4);
  if (!next.length) return null;
  return <><h3>Tích góp để mua</h3>{next.map(g => <div className="goal-card" key={g.id}><div className="goal-head"><b>{g.name}</b><span>{money(Math.min(cash, g.price))} / {money(g.price)}</span></div><progress max={1} value={Math.min(1, cash / g.price)} /><small>{g.use} · bán tại {PLACE_NAMES[g.seller]}</small></div>)}
    <p className="muted">Tính cả tiền mặt và ống heo. Đặt mục tiêu trong Ví (V) để để dành riêng.</p></>;
}

export function JobHud({ onOpen }: { onOpen: () => void }) {
  const j = state.jobs.active, bag = state.jobs.bag;
  if (!j && !bag) return null;
  const left = minutesLeft(state), t = nextTarget(state);
  return <button className="job-hud" onClick={onOpen}>
    <small>VIỆC VẶT <kbd>K</kbd></small>
    {j && <><b>{j.title}</b><span>{!j.picked ? 'Lấy hàng: ' + pointName(j.from) : (t ? t.label : '')}</span>{left !== null && <span className={left < 0 ? 'late' : left < 10 ? 'soon' : ''}>{left >= 0 ? '⏱ còn ' + left + ' phút' : '⏱ trễ hạn'}{j.fragile ? ' · dễ vỡ, đừng chạy' : ''}</span>}</>}
    {bag > 0 && <span>♻ Ve chai {bag}/{scrapCapacity(state)}</span>}
  </button>;
}

/** Bà Tư's scrap stall at Chợ Rừng. */
export function ScrapStall({ onAction, notice }: Props) {
  const here = atPlace(state, 'market'), bag = state.jobs.bag, price = scrapPrice(state.day), yesterday = scrapPrice(state.day - 1);
  return <section className="place-activities"><h3>Bà Tư thu mua ve chai</h3>
    <p>Giá hôm nay <b>{money(price)}</b>/món {price > yesterday ? '▲' : price < yesterday ? '▼' : '='} (hôm qua {money(yesterday)}). Trong túi: {bag} món ≈ {money(bag * price)}.</p>
    <button className="primary" disabled={!here || !bag} onClick={() => onAction(() => notice(sellScrap(state).message))}>Bán hết ve chai</button>
  </section>;
}
