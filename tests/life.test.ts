import {CHAPTERS} from '../src/progression';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, start, state, sleep, save, load, requestAllowance, moveJar, acceptShopping, buy } from '../src/state';
import { canSleep, sleepRefusal, BEDTIME_NOTICE, WAKE_TIME, slotAt } from '../src/clock';
import { tickLife, rollMidnight, suggestions, entries, entriesAt, perform, accept, decline, generateDay, takeNotice, schoolLock, dailyLock, dailyTask, markHomeReturn } from '../src/activities';
import { earn, buyGood, depositPiggy, withdrawPiggy, startGoal, fundGoal, buyWithGoal, cancelGoal, netWorth, goalProgress } from '../src/finance';
import { placePoint, atPlace, type Place } from '../src/places';
import { beginSchool, answerSchool } from '../src/educationActions';
import { currentLesson, SUBJECT_NAMES } from '../src/education';
import { minCoins, scoreCoins, scoreMemory, memoryChallenge, sortChallenge, scoreSort, coinChallenge } from '../src/minigames';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: { setItem: (k: string, v: string) => storage.set(k, v), getItem: (k: string) => storage.get(k) ?? null }, configurable: true });
beforeEach(() => { storage.clear(); start(fresh('Bé An')); });

const goTo = (place: Place) => {
  if (place === 'home' || place === 'mom') { state.inside = true; state.room = 'home'; return; }
  if (place === 'classroom') { state.inside = true; state.room = 'classroom'; return; }
  const p = placePoint(place); state.inside = false; state.x = p.x; state.y = p.y;
};
/** Marks today's lessons as finished so after-school activities are unlocked. */
const schoolDone = () => { if (!state.education.attended.includes(state.day)) state.education.attended.push(state.day); state.life.returnedHomeDay = state.day; state.story.completed=Object.fromEntries(CHAPTERS.map(c=>[c.id,state.day])); };
const offer = (id: string, status: 'offered' | 'accepted' = 'offered') => { schoolDone(); state.life.generatedDay = state.day; state.life.offers.push({ id, day: state.day, status }); };
const notices = () => { const out: string[] = []; let n; while ((n = takeNotice(state))) out.push(n); return out; };

// 1–2. Sleep rules
test('cannot sleep before 21:00; the refusal names the in-game time', () => {
  for (const m of [0, 7 * 60 + 30, 12 * 60, 20 * 60 + 59]) { state.minutes = m; assert.equal(canSleep(m), false); assert.equal(sleep(), false); }
  assert.equal(state.day, 1);
  assert.equal(sleepRefusal(20 * 60 + 59), 'Chưa đến giờ ngủ đâu! Bây giờ mới là 20:59. Có thể sinh hoạt cùng gia đình đến 21:00, rồi đi ngủ.');
});
test('sleeping from 21:00 moves to 06:30 the next day and restores energy', () => {
  state.minutes = 21 * 60; state.energy = 12;
  assert.equal(sleep(), true);
  assert.equal(state.day, 2); assert.equal(state.minutes, WAKE_TIME); assert.equal(state.minutes, 6 * 60 + 30); assert.equal(state.energy, 100);
  state.minutes = 23 * 60 + 59; assert.equal(sleep(), true); assert.equal(state.day, 3);
});
test('staying up past midnight starts the next day tired and still blocks sleep until 21:00', () => {
  state.minutes = 24 * 60 + 15; state.energy = 50;
  assert.equal(rollMidnight(state), true);
  assert.equal(state.day, 2); assert.equal(state.minutes, 15); assert.equal(state.energy, 30);
  assert.equal(sleep(), false);
  assert.ok(notices().some(n => n.includes('quá nửa đêm')));
});
test('the 21:00 bedtime notice appears exactly once per day', () => {
  state.minutes = 21 * 60 - 1; tickLife(state); assert.ok(!notices().includes(BEDTIME_NOTICE));
  state.minutes = 21 * 60; tickLife(state); tickLife(state);
  assert.equal(notices().filter(n => n === BEDTIME_NOTICE).length, 1);
});
test('daily schedule follows the school-day timetable and switches on days off', () => {
  assert.equal(slotAt(1, 8 * 60 + 30).current?.label, 'Học: Toán · Anh · Văn · Sử · Địa');
  assert.equal(slotAt(1, 16 * 60 + 30).current?.label, 'Hoạt động tự do sau giờ học');
  assert.equal(slotAt(1, 21 * 60).current?.label, 'Có thể về nhà đi ngủ');
  assert.equal(slotAt(7, 8 * 60).current?.activity, 'cleanup');
});

// 3. Activities after school
test('after school there are at least three activities and at least two dynamic events', () => {
  schoolDone();
  state.minutes = 16 * 60; state.money = 20000; tickLife(state);
  assert.ok(suggestions(state).length >= 3);
  const dynamic = state.life.offers.filter(o => o.day === 1);
  assert.ok(dynamic.length >= 2, 'expected two or more dynamic events');
  assert.ok(entries(state).some(e => e.def.kind === 'free' || e.def.kind === 'scheduled'));
  const count = state.life.offers.length; generateDay(state); assert.equal(state.life.offers.length, count, 'no duplicate generation');
});

// 4–5. NPC opportunities, earning money at the right place
test('an NPC offer pays only when performed at the real place, once, and records the transaction', () => {
  offer('neighbor-carry'); state.minutes = 16 * 60;
  goTo('shop'); assert.equal(perform(state, 'neighbor-carry', 3).ok, false);
  goTo('neighbor');
  assert.ok(entriesAt(state, 'neighbor').some(e => e.def.id === 'neighbor-carry'));
  const r = perform(state, 'neighbor-carry', 3);
  assert.equal(r.ok, true, r.message);
  assert.equal(state.money, 5000); assert.equal(state.relationships.hang, 3);
  assert.equal(state.finance.tx[0].kind, 'income'); assert.equal(state.finance.tx[0].moves[0].amount, 5000);
  assert.equal(perform(state, 'neighbor-carry', 3).ok, false);
});
test('rewards scale with the mini-game score', () => {
  offer('binh-weeds'); state.minutes = 16 * 60; goTo('binh');
  assert.equal(perform(state, 'binh-weeds', 1).ok, true);
  assert.equal(state.money, 2000); assert.equal(state.relationships.binh, 1);
});
test('an errand is accepted from mum at home and carried out at the market with real family costs', () => {
  offer('mom-errand'); state.minutes = 15 * 60 + 30; const before = state.family.cash;
  goTo('market'); assert.equal(perform(state, 'mom-errand', 3).ok, false, 'must accept first');
  goTo('home'); assert.equal(accept(state, 'mom-errand').ok, true);
  assert.equal(perform(state, 'mom-errand', 2).ok, false, 'must be at the market');
  goTo('market'); assert.equal(perform(state, 'mom-errand', 2).ok, true);
  assert.equal(state.family.cash, before - 30000, 'one wrong item costs the family 5.000đ more');
  assert.equal(state.relationships.mom, 2);
});

// 5. Spending
test('buying goods requires money and being at the seller; purchases are logged', () => {
  assert.equal(buyGood(state, 'ball'), false);
  earn(state, 40000, 'Test', 'Test');
  goTo('home'); assert.equal(buyGood(state, 'ball'), false);
  goTo('shop'); assert.equal(buyGood(state, 'ball'), true);
  assert.equal(state.money, 0); assert.equal(state.finance.owned.ball, 1);
  assert.equal(state.finance.tx[0].kind, 'expense'); assert.equal(state.finance.tx[0].label, 'Mua Quả bóng nhựa');
});

// 6. Piggy bank
test('piggy bank comes from parents, works only at home and conserves net worth', () => {
  earn(state, 20000, 'Test', 'Test'); goTo('home');
  assert.equal(depositPiggy(state, 5000), false, 'no piggy bank yet');
  offer('piggy-gift'); state.minutes = 8 * 60;
  assert.equal(perform(state, 'piggy-gift', 3, 0).ok, true);
  assert.equal(state.finance.piggyOwned, true);
  const worth = netWorth(state).netWorth;
  assert.equal(depositPiggy(state, 15000), true);
  assert.equal(state.money, 5000); assert.equal(state.finance.piggy, 15000);
  assert.equal(netWorth(state).netWorth, worth, 'moving money does not change net worth');
  assert.equal(depositPiggy(state, 10000), false, 'cannot deposit more than held');
  goTo('shop'); assert.equal(withdrawPiggy(state, 5000), false, 'piggy bank stays at home');
  goTo('home'); assert.equal(withdrawPiggy(state, 5000), true); assert.equal(state.money, 10000);
  assert.deepEqual(state.finance.tx[0].moves, [{ acc: 'piggy', amount: -5000 }, { acc: 'cash', amount: 5000 }]);
});

// 7. Savings goals
test('savings goals track progress and are bought at the seller with saved funds', () => {
  assert.equal(startGoal(state, 'phone'), false, 'phone unlocks at age 10');
  assert.equal(startGoal(state, 'bike'), true); assert.equal(startGoal(state, 'bike'), false);
  earn(state, 1200000, 'Test', 'Test'); goTo('home');
  assert.equal(fundGoal(state, 'bike', 400000, 'cash'), true);
  assert.equal(goalProgress(state.finance.goals[0]), 0.4);
  assert.equal(buyWithGoal(state, 'bike'), false);
  assert.equal(fundGoal(state, 'bike', 900000, 'cash'), true, 'contribution is capped at the target');
  assert.equal(state.finance.goals[0].saved, 1000000); assert.equal(state.money, 200000);
  assert.equal(buyWithGoal(state, 'bike'), false, 'must be at the market');
  goTo('market'); assert.equal(buyWithGoal(state, 'bike'), true);
  assert.equal(state.finance.owned.bike, 1); assert.equal(state.finance.goals[0].status, 'bought');
  startGoal(state, 'ball'); goTo('home'); fundGoal(state, 'ball', 10000, 'cash'); assert.equal(cancelGoal(state, 'ball'), true);
  assert.equal(state.money, 200000, 'without a piggy bank cancelled funds return to the wallet');
});

// 8. Transactions
test('existing money actions now write to the transaction history', () => {
  requestAllowance();
  assert.equal(state.finance.tx[0].label, 'Tiền tiêu vặt hằng ngày'); assert.equal(state.finance.tx[0].cash, 10000);
  moveJar('save', 5000);
  assert.equal(state.finance.tx[0].moves.reduce((n, m) => n + m.amount, 0), 0, 'a transfer creates no money');
  acceptShopping(); buy('milk');
  assert.equal(state.finance.tx[0].kind, 'expense');
  assert.equal(state.finance.tx.length, 4);
});

// 9. Stats & relationships, decisions and consequences
test('completed activities change stats; declining and broken promises change relationships', () => {
  schoolDone(); state.minutes = 10 * 60; goTo('park'); const health = state.health, happy = state.happiness = 50;
  assert.equal(perform(state, 'park-play').ok, true);
  assert.ok(state.health >= health); assert.equal(state.happiness, happy + 5);
  offer('nam-football'); state.minutes = 16 * 60;
  assert.equal(decline(state, 'nam-football').ok, true); assert.equal(state.relationships.nam, -1);
  offer('neighbor-carry', 'accepted'); state.minutes = 19 * 60; tickLife(state);
  assert.equal(state.relationships.hang, -2);
  assert.equal(state.life.offers.find(o => o.id === 'neighbor-carry')!.status, 'expired');
});
test('missing school, breakfast and being late have consequences', () => {
  state.minutes = 9 * 60; const energy = state.energy; tickLife(state);
  assert.equal(state.energy, energy - 10);
  goTo('classroom'); assert.equal(beginSchool(), true); assert.equal(state.discipline, 9, 'late after 08:30');
  start(fresh()); state.minutes = 16 * 60; tickLife(state);
  assert.equal(state.discipline, 7); assert.equal(state.relationships.teacher, -2);
  tickLife(state); assert.equal(state.discipline, 7, 'applied once');
});
test('lucky money choices have different real outcomes', () => {
  state.day = 2; offer('lixi'); goTo('home'); state.minutes = 9 * 60;
  assert.equal(perform(state, 'lixi', 3, 1).ok, true);
  assert.equal(state.family.jars.save, 50000); assert.equal(state.money, 0);
  start(fresh()); state.day = 2; offer('lixi'); goTo('home'); state.minutes = 9 * 60;
  assert.equal(perform(state, 'lixi', 3, 0).ok, true);
  assert.equal(state.finance.owned.blocks, 1); assert.equal(state.money, 0);
  assert.ok(entriesAt(state, 'home').some(e => e.def.id === 'blocks-play'), 'a toy unlocks a play activity');
});
test('the school fair can make a profit or a loss depending on price and demand', () => {
  const results: number[] = [];
  for (let day = 5; day < 5 + 7 * 12; day += 7) {
    start(fresh('Bé An')); state.day = day; earn(state, 20000, 'Test', 'Test'); offer('school-fair'); state.minutes = 15 * 60; goTo('school');
    assert.equal(perform(state, 'school-fair', 3, 2).ok, true);
    results.push(state.money - 20000);
  }
  assert.ok(results.some(p => p < 0), 'a high price sometimes loses money');
  assert.ok(results.some(p => p > 0), 'and sometimes earns a profit');
  start(fresh()); state.day = 5; offer('school-fair'); state.minutes = 15 * 60; goTo('school');
  assert.equal(perform(state, 'school-fair', 3, 0).ok, false, 'needs 20.000đ capital');
});
test('location checks use the actual map position', () => {
  goTo('cafe'); assert.equal(atPlace(state, 'cafe'), true); assert.equal(atPlace(state, 'market'), false);
  state.x += 400; assert.equal(atPlace(state, 'cafe'), false);
});

// 10. Persistence
test('life, finance, goals, offers and history survive save/load exactly', () => {
  earn(state, 50000, 'Test', 'Test'); goTo('home'); offer('piggy-gift'); state.minutes = 8 * 60;
  perform(state, 'piggy-gift', 3, 0); depositPiggy(state, 20000); startGoal(state, 'bike'); fundGoal(state, 'bike', 10000, 'cash');
  state.minutes = 16 * 60; tickLife(state);
  assert.equal(save(), true);
  const loaded = load()!;
  assert.deepEqual(loaded, state);
  start(loaded);
  assert.equal(state.finance.piggy, 20000); assert.equal(state.finance.goals[0].saved, 10000); assert.ok(state.life.history.length > 0);
  const legacy = { ...fresh(), day: 3 } as Partial<ReturnType<typeof fresh>>; delete legacy.life; delete legacy.finance;
  storage.set('quang-yen-save-v1', JSON.stringify(legacy));
  const upgraded = load()!; assert.equal(upgraded.finance.piggy, 0); assert.deepEqual(upgraded.life.offers, []);
});

test('mini-game scoring helpers', () => {
  assert.equal(minCoins(8000), 3); assert.equal(minCoins(13000), 3);
  assert.equal(scoreCoins(true, 0), 3); assert.equal(scoreCoins(true, 2), 1); assert.equal(scoreCoins(false, 0), 0);
  const c = coinChallenge('x'); assert.equal(c.paid - c.price, c.change); assert.ok(c.change > 0);
  const m = memoryChallenge('seed'); assert.equal(m.list.length, 3); assert.equal(scoreMemory(m.list, m.list), 3); assert.equal(scoreMemory(m.list, [...m.list, ...m.options.filter(o => !m.list.includes(o)).slice(0, 2)]), 1);
  assert.equal(sortChallenge('trash', 'a').items.length, 6); assert.equal(scoreSort(4, 6), 2);
});

// School comes first
test('on a school day activities stay locked until all five school subjects are finished', () => {
  state.minutes = 9 * 60; goTo('park');
  assert.ok(schoolLock(state));
  const r = perform(state, 'park-play'); assert.equal(r.ok, false); assert.match(r.message, /đi học trước/i);
  state.life.generatedDay = 1; state.life.offers.push({ id: 'neighbor-carry', day: 1, status: 'offered' }); state.minutes = 14 * 60; goTo('neighbor');
  assert.equal(perform(state, 'neighbor-carry', 3).ok, false);
  const top = suggestions(state)[0]; assert.equal(top.key, 'slot:school');
  assert.ok(!suggestions(state).some(x => x.key === 'park-play' || x.key === 'neighbor-carry'), 'locked activities are not suggested');
  state.minutes = 6 * 60 + 45; goTo('home'); assert.equal(perform(state, 'breakfast', 3, 1).ok, true, 'morning routine is allowed');
});
test('a school session includes five sequential subjects and unlocks activities when finished', () => {
  assert.deepEqual([0, 1, 2].map(i => SUBJECT_NAMES[currentLesson(1, i).subject]), ['Toán', 'Tiếng Anh', 'Văn']);
  goTo('classroom'); state.minutes = 8 * 60; assert.equal(beginSchool(), true);
  assert.equal(answerSchool(currentLesson(1, 0).answer), 'next'); assert.match(schoolLock(state)!, /1\/5/);
  answerSchool(currentLesson(1, 1).answer);
  assert.equal(answerSchool(currentLesson(1, 2).answer), 'next');
  assert.equal(answerSchool(currentLesson(1, 3).answer), 'next');
  assert.equal(answerSchool(currentLesson(1, 4).answer), 'done');
  assert.equal(state.minutes, 11 * 60 + 30, 'the five subjects fill the morning');
  assert.equal(schoolLock(state), null);
  assert.ok(dailyLock(state));
  assert.equal(dailyTask(state).key, 'slot:home');
  goTo('park'); assert.equal(perform(state, 'park-play').ok, false, 'must return home after class');
  goTo('home'); markHomeReturn(state);
  assert.equal(dailyLock(state), null);
  goTo('park'); assert.equal(perform(state, 'park-play').ok, true);
});
test('skipping school does not unlock the next daily step when school hours end', () => {
  state.minutes = 15 * 60 + 59; assert.ok(schoolLock(state));
  state.minutes = 16 * 60; assert.ok(schoolLock(state));
  tickLife(state); assert.equal(state.discipline, 7);
  assert.equal(schoolLock({ ...state, day: 7 } as typeof state), null, 'no lock on days off');
});

test('an accepted task must finish before another can be accepted or performed', () => {
  offer('mom-errand'); offer('neighbor-carry'); state.minutes = 14 * 60; goTo('mom');
  assert.equal(accept(state, 'mom-errand').ok, true);
  goTo('neighbor'); assert.equal(accept(state, 'neighbor-carry').ok, false);
  assert.equal(perform(state, 'neighbor-carry').ok, false);
  assert.deepEqual(suggestions(state).map(s => s.key), ['mom-errand']);
  goTo('market'); assert.equal(perform(state, 'mom-errand', 3).ok, true);
  goTo('neighbor'); assert.equal(accept(state, 'neighbor-carry').ok, true);
});

test('returning home persists and resets for a new school day; days off allow free play', () => {
  state.education.attended.push(state.day); goTo('home'); markHomeReturn(state); save(); start(load()!);
  goTo('park'); assert.equal(dailyLock(state), null);
  state.day++; assert.equal(dailyTask(state).key, 'slot:school');
  state.education.attended.push(state.day); assert.equal(dailyTask(state).key, 'slot:home');
  state.day=7; state.story.completed=Object.fromEntries(CHAPTERS.map(c=>[c.id,1])); assert.equal(dailyTask(state).key, 'slot:free');
});
