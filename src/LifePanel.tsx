import React, { useMemo, useRef, useState } from 'react';
import { state, money } from './state';
import { scene } from './game';
import { HOME_DOOR } from './navigation';
import { clock, scheduleFor, slotAt, isSchoolDay } from './clock';
import { entries, entriesAt, suggestions, perform, accept, decline, doneToday, dailyTask, type ActivityDef, type Suggestion } from './activities';
import { GOODS, GOAL_IDS, ACCOUNT_UNLOCK, goalInfo, goalProgress, netWorth, spendable, depositPiggy, withdrawPiggy, startGoal, fundGoal, cancelGoal, buyGood, buyWithGoal, atHome, type GoodId, type GoalId } from './finance';
import { atPlace, placePoint, PEOPLE, PLACE_NAMES, type Place } from './places';
import { coinChallenge, scoreCoins, memoryChallenge, scoreMemory, sortChallenge, scoreSort, scoreTiming, TIMING_TRIES } from './minigames';
import './life.css';

type Props = { onAction: (fn: () => void) => void; notice: (message: string) => void };
const vnd = (n: number) => (n > 0 ? '+' : '') + money(n);

/** Marks the destination on the map for a place (or the house for indoor places). */
export function guide(place: Place | 'bed' | null, notice: Props['notice']) {
  if (!place) { notice('Đi dạo quanh khu phố, đến gần người hoặc cửa hàng và nhấn E.'); return; }
  if (place === 'bed' || place === 'home' || place === 'mom') {
    if (state.inside && state.room === 'home') notice(place === 'bed' ? 'Giường ở góc trái căn nhà.' : 'Bạn đang ở nhà. Đến bàn ăn hoặc gặp mẹ và nhấn E.');
    else { scene?.setDestination(HOME_DOOR.x, HOME_DOOR.y); notice('Đã đánh dấu đường về nhà. Đi theo mũi tên vàng dưới chân.'); }
    return;
  }
  if (atPlace(state, place)) { notice('Bạn đang ở ' + PLACE_NAMES[place] + '. Nhấn E để tương tác.'); return; }
  const p = placePoint(place);
  scene?.setDestination(p.x, p.y);
  notice('Đã đánh dấu ' + PLACE_NAMES[place] + (state.inside ? '. Đi theo mũi tên vàng dưới chân (trong nhà mũi tên chỉ ra cửa).' : '. Đi theo mũi tên vàng dưới chân nhân vật.'));
}

// ---------------- Mini-games ----------------
function TimingGame({ onDone }: { onDone: (score: number) => void }) {
  const [tries, setTries] = useState(0), [hits, setHits] = useState(0), box = useRef<HTMLDivElement>(null);
  const tap = () => {
    const b = box.current, dot = b?.querySelector('i'); if (!b || !dot) return;
    const r = dot.getBoundingClientRect(), o = b.getBoundingClientRect();
    const hit = Math.abs(r.x + r.width / 2 - (o.x + o.width / 2)) < o.width * 0.19;
    const t = tries + 1, hh = hits + (hit ? 1 : 0); setTries(t); setHits(hh);
    if (hh >= 3 || t >= TIMING_TRIES) onDone(scoreTiming(hh));
  };
  return <div className="mini-game"><div className="rhythm" ref={box}><i /></div><p>Trúng nhịp {hits}/3 · Lượt {tries}/{TIMING_TRIES}</p><button className="primary" onClick={tap}>Bấm khi chấm vàng ở vùng xanh!</button></div>;
}
function CoinsGame({ seed, onDone }: { seed: string; onDone: (score: number) => void }) {
  const c = useMemo(() => coinChallenge(seed), [seed]);
  const [sum, setSum] = useState(0), [fails, setFails] = useState(0), [msg, setMsg] = useState('');
  const submit = () => {
    if (sum === c.change) { onDone(scoreCoins(true, fails)); return; }
    const f = fails + 1; setFails(f); setSum(0);
    if (f >= 3) onDone(0); else setMsg(sum > c.change ? 'Trả thừa rồi! Đếm lại nhé.' : 'Còn thiếu, khách chưa nhận đủ tiền thừa.');
  };
  return <div className="mini-game"><p className="mini-question">Khách mua món giá <b>{money(c.price)}</b>, đưa <b>{money(c.paid)}</b>. Con trả lại bao nhiêu?</p>
    <div className="coin-row">{[1000, 2000, 5000, 10000].map(v => <button key={v} className="coin" onClick={() => setSum(sum + v)}>{v / 1000}k</button>)}</div>
    <p>Đang cầm trả: <b>{money(sum)}</b> · Sai {fails}/3</p>{msg && <p role="status" className="mini-feedback">{msg}</p>}
    <div className="mini-actions"><button onClick={() => setSum(0)}>Đếm lại</button><button className="primary" onClick={submit}>Trả tiền thừa</button></div></div>;
}
function MemoryGame({ seed, onDone }: { seed: string; onDone: (score: number) => void }) {
  const c = useMemo(() => memoryChallenge(seed), [seed]);
  const [phase, setPhase] = useState<'show' | 'pick'>('show'), [picked, setPicked] = useState<string[]>([]);
  if (phase === 'show') return <div className="mini-game"><p className="mini-question">Ghi nhớ danh sách mẹ dặn:</p><ul className="memory-list">{c.list.map(i => <li key={i}>{i}</li>)}</ul><button className="primary" onClick={() => setPhase('pick')}>Con nhớ rồi, ra quầy chọn đồ</button></div>;
  return <div className="mini-game"><p className="mini-question">Chọn đúng các món mẹ dặn (mua thừa cũng tốn tiền):</p>
    <div className="memory-grid">{c.options.map(o => <button key={o} className={picked.includes(o) ? 'picked' : ''} onClick={() => setPicked(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o])}>{o}</button>)}</div>
    <button className="primary wide" disabled={!picked.length} onClick={() => onDone(scoreMemory(c.list, picked))}>Mua những món đã chọn</button></div>;
}
function SortGame({ def, seed, onDone }: { def: ActivityDef; seed: string; onDone: (score: number) => void }) {
  const c = useMemo(() => sortChallenge(def.sortSet ?? 'shapes', seed), [def.sortSet, seed]);
  const [index, setIndex] = useState(0), [correct, setCorrect] = useState(0), [last, setLast] = useState('');
  const item = c.items[index];
  const choose = (bin: number) => {
    const ok = bin === item.bin, n = correct + (ok ? 1 : 0); setCorrect(n); setLast(ok ? 'Đúng rồi!' : `“${item.label}” thuộc nhóm ${c.bins[item.bin]}.`);
    if (index + 1 >= c.items.length) onDone(scoreSort(n, c.items.length)); else setIndex(index + 1);
  };
  return <div className="mini-game"><p className="mini-question">Đặt <b>{item.label}</b> vào đâu? ({index + 1}/{c.items.length})</p>
    <div className="mini-actions">{c.bins.map((b, i) => <button key={b} onClick={() => choose(i)}>{b}</button>)}</div>
    {last && <p role="status" className="mini-feedback">{last}</p>}<p className="muted">Đúng {correct} món</p></div>;
}
function ActivityGame({ def, onDone }: { def: ActivityDef; onDone: (score: number) => void }) {
  const seed = state.day + ':' + def.id + ':' + doneToday(state, def.id) + ':' + state.name;
  if (def.game === 'timing') return <TimingGame onDone={onDone} />;
  if (def.game === 'coins') return <CoinsGame seed={seed} onDone={onDone} />;
  if (def.game === 'memory') return <MemoryGame seed={seed} onDone={onDone} />;
  if (def.game === 'sort') return <SortGame def={def} seed={seed} onDone={onDone} />;
  return null;
}

// ---------------- Activities at a place ----------------
const KIND_LABEL = { scheduled: 'THEO LỊCH', dynamic: 'SỰ KIỆN', free: 'TỰ DO' };
function rewardText(def: ActivityDef) {
  const r = def.reward; if (!r) return def.choices ? 'Kết quả tùy lựa chọn' : '';
  const parts: string[] = [];
  if (r.money) parts.push('đến ' + money(r.money) + (r.payer === 'family' ? ' từ gia đình' : ''));
  const names: Record<string, string> = { energy: 'Năng lượng', health: 'Sức khỏe', happiness: 'Hạnh phúc', intelligence: 'Trí tuệ', social: 'Giao tiếp', discipline: 'Kỷ luật', creativity: 'Sáng tạo', reputation: 'Danh tiếng', xp: 'Kinh nghiệm' };
  for (const [k, v] of Object.entries(r.stats ?? {})) parts.push(names[k] + ' ' + (v! > 0 ? '+' : '') + v);
  for (const [k, v] of Object.entries(r.rel ?? {})) parts.push((PEOPLE[k] ?? k) + ' ' + (v > 0 ? '+' : '') + v);
  return parts.join(' · ');
}
export function PlaceActivities({ place, onAction, notice }: Props & { place: Place }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const list = entriesAt(state, place), here = atPlace(state, place);
  const goods = (Object.keys(GOODS) as GoodId[]).filter(id => GOODS[id].seller === place && GOODS[id].minAge <= state.age);
  if (!list.length && !goods.length) return null;
  const run = (fn: () => { ok: boolean; message: string }) => onAction(() => { const r = fn(); notice(r.message); setPlaying(null); });
  return <section className="place-activities"><h3>Việc có thể làm ở đây</h3>{!here && <p className="finance-alert">Hãy đến gần {PLACE_NAMES[place]} để bắt đầu.</p>}
    {list.map(({ def, status, reason }) => {
      const acceptHere = status === 'offered' && def.acceptAt === place && def.place !== place;
      const lowEnergy = state.energy < def.energy;
      return <article className={'activity-card ' + def.kind} key={def.id}>
        <small>{KIND_LABEL[def.kind]} · {PEOPLE[def.giver] ?? def.giver} · đến {clock(def.window[1])}{status === 'accepted' ? ' · ĐÃ NHẬN LỜI' : ''}</small>
        <h4>{def.title}</h4><p>{def.text}</p>
        <p className="activity-meta">⏱ {def.duration} phút · ⚡ {def.energy} năng lượng{rewardText(def) ? ' · ' + rewardText(def) : ''}</p>
        {reason && <p className="finance-alert">{reason}</p>}
        {acceptHere ? <div className="mini-actions"><button className="primary" disabled={!here} onClick={() => run(() => accept(state, def.id))}>Nhận lời</button><button disabled={!here} onClick={() => run(() => decline(state, def.id))}>Từ chối</button></div>
          : playing === def.id ? <ActivityGame def={def} onDone={score => run(() => perform(state, def.id, score))} />
          : def.choices ? <div className="choices">{def.choices.map((c, i) => { const why = c.requires?.(state); return <button key={c.label} disabled={!here || !!why || !!reason || lowEnergy} onClick={() => run(() => perform(state, def.id, 3, i))}>{c.label}{(why || c.hint) && <small className="choice-hint">{why ?? c.hint}</small>}</button>; })}</div>
          : <div className="mini-actions"><button className="primary" disabled={!here || !!reason || lowEnergy} onClick={() => def.game === 'none' ? run(() => perform(state, def.id)) : setPlaying(def.id)}>{lowEnergy ? 'Cần nghỉ thêm' : 'Bắt đầu'}</button>{def.kind === 'dynamic' && status === 'offered' && <button disabled={!here} onClick={() => run(() => decline(state, def.id))}>Từ chối</button>}</div>}
      </article>;
    })}
    {goods.length > 0 && <><h3>Hàng bày bán</h3>{goods.map(id => {
      const g = GOODS[id], goal = state.finance.goals.find(x => x.id === id && x.status === 'active');
      return <div className="shop-item" key={id}><span className="item-art goods">{g.name.split(' ')[0].toUpperCase()}</span><div><strong>{g.name}</strong><small>{g.use} · Đang có {state.finance.owned[id]}</small>{goal && <small>Quỹ mục tiêu: {money(goal.saved)} / {money(g.price)}</small>}</div>
        <div className="buy-buttons"><button disabled={!here || spendable(state) < g.price} onClick={() => onAction(() => notice(buyGood(state, id) ? 'Đã mua ' + g.name + '!' : 'Chưa đủ tiền mặt.'))}>{money(g.price)}</button>
          {goal && <button className="primary" disabled={!here || goal.saved < g.price} onClick={() => onAction(() => notice(buyWithGoal(state, id as GoalId) ? 'Mục tiêu hoàn thành! Đã mua ' + g.name + ' bằng tiền tiết kiệm.' : 'Quỹ chưa đủ.'))}>Dùng quỹ mục tiêu</button>}</div></div>;
    })}<p className="muted">Tiền mặt dùng được: {money(spendable(state))}</p></>}
  </section>;
}

// ---------------- Activities panel ----------------
function SuggestionRow({ s, notice }: { s: Suggestion; notice: Props['notice'] }) {
  return <button className="suggestion" onClick={() => guide(s.place, notice)}><small>{s.status}</small><b>{s.title}</b><span>{s.detail}</span></button>;
}
export function ActivityPanel({ notice }: Props) {
  const [tab, setTab] = useState('now');
  const list = suggestions(state, 3), all = entries(state).filter(e => !e.reason && e.status !== 'upcoming'), slot = slotAt(state.day, state.minutes), task = dailyTask(state);
  return <div className="life-panel">
    <p className="family-intro">Ngày {state.day} · {clock(state.minutes)} · {isSchoolDay(state.day) ? 'Ngày đi học' : 'Ngày nghỉ'}. Hoàn thành bước hiện tại để mở bước tiếp theo.</p>
    <div className="daily-steps">{(isSchoolDay(state.day)?['Đi học','Về nhà','Tự do / giúp bố mẹ']:['Ngày nghỉ','Tự do / giúp bố mẹ']).map((label,i)=><span key={label} className={isSchoolDay(state.day)&&(i===0&&task.key==='slot:school'||i===1&&task.key==='slot:home'||i===2&&!['slot:school','slot:home'].includes(task.key))?'current':''}>{i+1}. {label}</span>)}</div>
    <nav className="finance-tabs">{[['now', 'Gợi ý'], ['schedule', 'Lịch hôm nay'], ['people', 'Quan hệ'], ['history', 'Nhật ký']].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === 'now' && <><div className="suggestion-list">{list.map(s => <SuggestionRow key={s.key} s={s} notice={notice} />)}</div>
      <details><summary>Các hoạt động có thể làm ({all.length})</summary>{all.map(e => <div className="finance-row" key={e.def.id}><span>{e.def.title}<br /><small className="muted-inline">{PLACE_NAMES[e.status === 'offered' && e.def.acceptAt ? e.def.acceptAt : e.def.place]} · đến {clock(e.def.window[1])}</small></span><button onClick={() => guide(e.status === 'offered' && e.def.acceptAt ? e.def.acceptAt : e.def.place, notice)}>Chỉ đường</button></div>)}</details>
      <p className="learning-note">Nhấn “Chỉ đường” để đánh dấu điểm đến, đi tới nơi đó rồi nhấn E. Sự kiện có hạn giờ; đã nhận lời mà không làm sẽ làm người khác thất vọng.</p></>}
    {tab === 'schedule' && <>{scheduleFor(state.day).map(s => {
      const now = slot.current === s, done = s.activity ? doneToday(state, s.activity) > 0 || (s.activity === 'lunch' && doneToday(state, 'lunch-home') > 0) : s.place === 'classroom' && s.label.includes('sáng') ? state.education.attended.includes(state.day) : false;
      return <div className={'schedule-row' + (now ? ' now' : '') + (state.minutes >= s.end ? ' past' : '')} key={s.label}><b>{clock(s.start)}–{clock(s.end)}</b><span>{s.label}{s.note && <small>{s.note}</small>}</span><i>{done ? '✓' : now ? 'Bây giờ' : ''}</i></div>;
    })}<p className="muted">Bỏ bữa sáng (sau 09:00), nghỉ học (sau 16:00), không về ăn tối (sau 19:30), đi học muộn (sau 08:30) hoặc quên bài tập buổi tối đều có hậu quả. Giờ ngủ từ 21:00.</p></>}
    {tab === 'people' && <>{Object.entries(PEOPLE).map(([id, name]) => { const v = state.relationships[id] || 0; return <div className="finance-row" key={id}><span>{name}{!state.life.met.includes(id) && !['mom', 'dad'].includes(id) && <small className="muted-inline"> · chưa gặp</small>}</span><span className="rel-bar"><i style={{ width: Math.min(100, Math.abs(v) * 3) + '%', background: v < 0 ? '#c98a7a' : '#7da383' }} /></span><b>{v}</b></div>; })}<p className="muted">Quan hệ tăng khi giúp đỡ, chơi cùng, giữ lời hứa; giảm khi từ chối, thất hứa hoặc bỏ bữa cùng gia đình.</p></>}
    {tab === 'history' && <>{state.life.history.length ? state.life.history.map((h, i) => <article className="ledger-entry" key={i}><div><small>NGÀY {h.day} · {clock(h.minutes)}</small><p>{h.title}</p><span>{h.outcome}</span></div></article>) : <p className="muted">Chưa có hoạt động nào. Hãy bắt đầu từ gợi ý!</p>}</>}
  </div>;
}

// ---------------- Wallet ----------------
export function WalletPanel({ onAction, notice }: Props) {
  const [tab, setTab] = useState('overview');
  const f = state.finance, w = netWorth(state), home = atHome(state), cash = spendable(state);
  const run = (ok: boolean, msg: string) => notice(ok ? msg : home ? 'Chưa thực hiện được: kiểm tra số tiền nhé.' : 'Ống heo để ở nhà. Về nhà rồi mở Ví (V) nhé.');
  const locked = (age: number) => state.age < age ? <small className="muted-inline"> · mở khóa ở tuổi {age}</small> : null;
  return <div className="life-panel">
    <div className="finance-summary"><div><small>TIỀN MẶT</small><strong>{money(w.cash)}</strong></div><div><small>GIÁ TRỊ TÀI SẢN RÒNG</small><strong>{money(w.netWorth)}</strong></div></div>
    <nav className="finance-tabs">{[['overview', 'Tổng quan'], ['piggy', 'Ống heo'], ['goals', 'Mục tiêu'], ['history', 'Giao dịch']].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === 'overview' && <>
      <div className="finance-row"><span>Ví tiền mặt</span><b>{money(state.money)}</b></div>
      <div className="finance-row"><span>Ống heo{!f.piggyOwned && <small className="muted-inline"> · chưa có</small>}</span><b>{money(f.piggy)}</b></div>
      <div className="finance-row"><span>Quỹ mục tiêu tiết kiệm</span><b>{money(f.goals.reduce((n, g) => n + (g.status === 'active' ? g.saved : 0), 0))}</b></div>
      <div className="finance-row"><span>Hũ tiết kiệm / chia sẻ (sổ gia đình)</span><b>{money(state.family.jars.save + state.family.jars.share)}</b></div>
      <div className="finance-row"><span>Tài khoản tiết kiệm ngân hàng{locked(ACCOUNT_UNLOCK.bank)}</span><b>{money(state.bank)}</b></div>
      <div className="finance-row"><span>Danh mục đầu tư{locked(ACCOUNT_UNLOCK.investment)}</span><b>{money(w.investments)}</b></div>
      <div className="finance-row"><span>Tài khoản kinh doanh{locked(ACCOUNT_UNLOCK.business)}</span><b>{money(w.business)}</b></div>
      <div className="finance-row"><span>Đồ dùng sở hữu (ước giá bán lại 50%)</span><b>{money(w.goods)}</b></div>
      <div className="finance-row"><span>Tổng tài sản</span><b>{money(w.assets)}</b></div>
      <div className="finance-row"><span>Nợ phải trả{state.family.advance > state.family.advanceSpent && <small className="muted-inline"> · tiền mẹ tạm ứng cần trả lại</small>}</span><b className="negative">−{money(w.liabilities)}</b></div>
      <div className="cashflow-result"><span>Tài sản ròng = Tài sản − Nợ</span><strong>{money(w.netWorth)}</strong></div>
      <p className="learning-note">Bỏ tiền vào ống heo hay quỹ mục tiêu không làm tài sản ròng thay đổi: tiền chỉ chuyển chỗ. Chỉ thu nhập mới làm tăng, chi tiêu mới làm giảm.</p></>}
    {tab === 'piggy' && (!f.piggyOwned ? <p className="learning-note">Bố mẹ sắp tặng con một chú lợn đất. Hãy ở nhà và gặp mẹ hoặc đến bàn ăn để nhận.</p> : <>
      <div className="piggy"><span className="piggy-art" /><div><small>ỐNG HEO Ở NHÀ</small><strong>{money(f.piggy)}</strong><span>Tiền mặt có thể bỏ vào: {money(cash)}</span></div></div>
      {!home && <p className="finance-alert">Ống heo để ở nhà. Về nhà để bỏ hoặc lấy tiền.</p>}
      <div className="mini-actions">{[5000, 10000].map(v => <button key={v} disabled={!home || cash < v} onClick={() => onAction(() => run(depositPiggy(state, v), 'Leng keng! Đã bỏ ' + money(v) + ' vào ống heo.'))}>Bỏ {money(v)}</button>)}<button className="primary" disabled={!home || cash <= 0} onClick={() => onAction(() => run(depositPiggy(state, cash), 'Đã bỏ toàn bộ tiền mặt vào ống heo.'))}>Bỏ tất cả</button></div>
      <div className="mini-actions"><button disabled={!home || f.piggy < 5000} onClick={() => onAction(() => run(withdrawPiggy(state, 5000), 'Đã lấy 5.000đ ra ví.'))}>Lấy 5.000đ</button><button disabled={!home || f.piggy <= 0} onClick={() => onAction(() => run(withdrawPiggy(state, f.piggy), 'Đã lấy hết tiền trong ống heo.'))}>Lấy tất cả</button></div>
      <p className="learning-note">Tiền trong ống heo an toàn hơn tiền cầm theo người và không bị tiêu lặt vặt. Dùng nó để góp vào các mục tiêu lớn.</p></>)}
    {tab === 'goals' && <>
      {f.goals.filter(g => g.status === 'active').map(g => { const info = goalInfo(g.id); return <article className="goal-card" key={g.id}><div className="goal-head"><b>{info.name}</b><span>{money(g.saved)} / {money(info.price)}</span></div><progress max={1} value={goalProgress(g)} /><small>{Math.round(goalProgress(g) * 100)}% · còn {money(Math.max(0, info.price - g.saved))}{info.seller ? ' · mua tại ' + PLACE_NAMES[info.seller] : ''}</small>
        <div className="mini-actions">{[5000, 10000, 50000].map(v => <button key={v} disabled={!home || cash < Math.min(v, info.price - g.saved) || g.saved >= info.price} onClick={() => onAction(() => run(fundGoal(state, g.id, v, 'cash'), 'Đã góp ' + money(v) + ' từ ví.'))}>+{v / 1000}k ví</button>)}{f.piggyOwned && <button disabled={!home || f.piggy <= 0 || g.saved >= info.price} onClick={() => onAction(() => run(fundGoal(state, g.id, f.piggy, 'piggy'), 'Đã chuyển tiền ống heo vào mục tiêu.'))}>Từ ống heo</button>}<button disabled={g.saved > 0 && !home} onClick={() => onAction(() => notice(cancelGoal(state, g.id) ? 'Đã hủy mục tiêu, tiền được trả lại.' : 'Về nhà để rút tiền ra.'))}>Hủy</button></div>
        {g.saved >= info.price && info.seller && <p className="learning-note">Đủ tiền rồi! Đến {PLACE_NAMES[info.seller]} để mua.</p>}</article>; })}
      <h3>Đặt mục tiêu mới</h3>{GOAL_IDS.filter(id => !f.goals.some(g => g.id === id && g.status === 'active')).map(id => { const info = goalInfo(id); const bought = f.goals.some(g => g.id === id && g.status === 'bought'); return <div className="finance-row" key={id}><span>{info.name} · {money(info.price)}{state.age < info.minAge && <small className="muted-inline"> · mở khóa ở tuổi {info.minAge}</small>}{bought && <small className="muted-inline"> · đã mua</small>}</span><button disabled={state.age < info.minAge || f.goals.filter(g => g.status === 'active').length >= 3} onClick={() => onAction(() => notice(startGoal(state, id) ? 'Đã đặt mục tiêu: ' + info.name : 'Tối đa 3 mục tiêu cùng lúc.'))}>Đặt mục tiêu</button></div>; })}
      <p className="muted">Mục tiêu ngắn hạn (bóng, xếp hình), trung hạn (xe đạp), dài hạn (điện thoại, xe máy, đất). Góp tiền khi ở nhà, mua tại đúng cửa hàng.</p></>}
    {tab === 'history' && <>{f.tx.length ? f.tx.map(t => { const cashLeg = t.moves.find(m => m.acc === 'cash'); const amount = cashLeg ? cashLeg.amount : t.moves[0].amount; return <article className="ledger-entry" key={t.id}><div><small>NGÀY {t.day} · {clock(t.minutes)} · {({ income: 'THU', expense: 'CHI', transfer: 'CHUYỂN' })[t.kind]} · {t.party}</small><p>{t.label}</p><span>Ví sau giao dịch: {money(t.cash)} · Ống heo: {money(t.piggy)}</span></div><strong className={amount >= 0 ? 'positive' : 'negative'}>{vnd(amount)}</strong></article>; }) : <p className="muted">Chưa có giao dịch. Xin tiền tiêu vặt, giúp việc hoặc mua đồ để bắt đầu sổ.</p>}</>}
  </div>;
}

// ---------------- HUD ----------------
export function LifeHud({ notice, onOpen }: { notice: Props['notice']; onOpen: () => void }) {
  const task = dailyTask(state);
  const downtimeHere=atPlace(state,'home')&&['slot:evening','slot:leisure'].includes(task.key);
  return <aside className="life-hud"><button className="life-hud-head" onClick={onOpen}><small>{task.status} <kbd>H</kbd></small><b>{task.title}</b><span>{task.detail}</span></button><button className="daily-guide" onClick={()=>downtimeHere?onOpen():task.place?guide(task.place,notice):onOpen()}>{downtimeHere?'Chọn sinh hoạt':task.place?'Chỉ đường':'Chọn hoạt động'} →</button></aside>;
}
