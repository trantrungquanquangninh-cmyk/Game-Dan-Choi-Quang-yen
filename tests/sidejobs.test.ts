import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, start, state, save, load } from '../src/state';
import { CHAPTERS } from '../src/progression';
import { buildings, npcData } from '../src/data';
import { collisionOf } from '../src/buildingLayout';
import { trees } from '../src/mapLayout';
import { canWalk, STREET_SPAWN } from '../src/navigation';
import { routeField, routeLength, SPOTS } from '../src/walkways';
import { vehicleSpeed, GOODS, GOAL_IDS, startGoal } from '../src/finance';
import {
  offersFor, jobOffers, acceptJob, jobInteract, jobTick, jobPoint, jobTargets, abandonJob, DELIVERIES,
  scrapSpots, collectScrap, sellScrap, scrapPrice, scrapCapacity, restoreJobs, SPRINT_BREAK,
} from '../src/sidejobs';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: { setItem: (k: string, v: string) => storage.set(k, v), getItem: (k: string) => storage.get(k) ?? null }, configurable: true });
beforeEach(() => {
  storage.clear(); start(fresh('Bé An'));
  // A holiday morning with the story done, so nothing else locks side jobs.
  state.day = 7; state.minutes = 9 * 60; state.inside = false;
  state.story.completed = Object.fromEntries(CHAPTERS.map(c => [c.id, 1]));
});
const stand = (id: string) => { const p = jobPoint(id); state.inside = false; state.x = p.x; state.y = p.y; };
const delivery = () => jobOffers(state).find(j => j.kind === 'delivery' && !j.fragile) ?? jobOffers(state).find(j => j.kind === 'delivery')!;

test('the board offers three deliveries and one flyer round, the same after reload', () => {
  const a = offersFor(state.day), b = offersFor(state.day);
  assert.deepEqual(a, b);
  assert.equal(a.filter(j => j.kind === 'delivery').length, 3); assert.equal(a.filter(j => j.kind === 'flyers').length, 1);
  for (const j of a) { assert.ok(j.pay >= 5000 && j.pay <= 25000, j.title + ' pay ' + j.pay); assert.ok(j.limit >= 20); }
  assert.notDeepEqual(offersFor(8).map(j => j.key), a.map(j => j.key));
});

test('jobs are taken only at the board, picked up at the source and paid once at the destination', () => {
  const job = delivery();
  stand('home');
  assert.equal(acceptJob(state, job.key).ok, false, 'must be at the board');
  stand('board');
  assert.ok(acceptJob(state, job.key).ok);
  assert.equal(acceptJob(state, jobOffers(state)[0].key).ok, false, 'one job at a time');
  assert.equal(jobInteract(state, 'stop:' + job.stops[0]).ok, false, 'cannot deliver before pick-up');
  assert.equal(jobInteract(state, 'pickup').ok, false, 'must stand at the source');
  stand(job.from); assert.ok(jobInteract(state, 'pickup').ok);
  assert.deepEqual(jobTargets(state).map(t => t.id), ['stop:' + job.stops[0]]);
  stand(job.stops[0]);
  const before = state.money, tx = state.finance.tx.length;
  assert.ok(jobInteract(state, 'stop:' + job.stops[0]).ok);
  assert.equal(state.money - before, job.pay);
  assert.equal(state.finance.tx.length, tx + 1); assert.equal(state.finance.tx[0].kind, 'income');
  assert.equal(state.jobs.active, null); assert.equal(state.jobs.completed, 1);
  assert.equal(jobInteract(state, 'stop:' + job.stops[0]).ok, false, 'no double pay');
  assert.ok(!jobOffers(state).some(j => j.key === job.key), 'a finished job leaves the board');
});

test('late deliveries pay half and abandoning a job hurts the relationship', () => {
  const job = delivery();
  stand('board'); acceptJob(state, job.key); stand(job.from); jobInteract(state, 'pickup');
  state.minutes += job.limit + 5; stand(job.stops[0]);
  const before = state.money; jobInteract(state, 'stop:' + job.stops[0]);
  assert.equal(state.money - before, Math.round(job.pay / 2000) * 1000); assert.equal(state.jobs.late, 1);
  const next = jobOffers(state).find(j => j.kind === 'delivery')!;
  stand('board'); acceptJob(state, next.key);
  assert.ok(abandonJob(state).ok); assert.equal(state.jobs.active, null);
  assert.ok(Object.values(state.relationships).some(v => v < 0));
});

test('running with fragile goods breaks them and the child pays half back', () => {
  let day = 7; while (!offersFor(day).some(j => j.fragile)) day++;
  state.day = day; const job = offersFor(day).find(j => j.fragile)!;
  stand('board'); assert.ok(acceptJob(state, job.key).ok); stand(job.from); jobInteract(state, 'pickup');
  state.money = 50000;
  assert.equal(jobTick(state, 1, false), null, 'walking is safe');
  assert.equal(jobTick(state, SPRINT_BREAK - 1, true), null);
  const msg = jobTick(state, 1.5, true); assert.ok(msg && msg.includes('vỡ'));
  assert.equal(state.money, 50000 - Math.round(job.pay / 2000) * 1000); assert.equal(state.jobs.broken, 1); assert.equal(state.jobs.active, null);
});

test('flyers pay per house plus an on-time bonus', () => {
  const job = jobOffers(state).find(j => j.kind === 'flyers')!;
  stand('board'); acceptJob(state, job.key); stand(job.from); jobInteract(state, 'pickup');
  const before = state.money;
  for (const h of job.stops) { stand(h); assert.ok(jobInteract(state, 'stop:' + h).ok, h); }
  assert.equal(state.money - before, job.pay); assert.equal(state.jobs.active, null);
});

test('scrap is picked up by walking past it, limited by the bag and sold at the market at the daily price', () => {
  const spots = scrapSpots(state.day); assert.equal(spots.length, 14);
  state.x = spots[0].x; state.y = spots[0].y; assert.equal(collectScrap(state), 1); assert.equal(collectScrap(state), 0, 'once per bottle');
  state.jobs.bag = scrapCapacity(state); state.x = spots[1].x; state.y = spots[1].y; assert.equal(collectScrap(state), 0, 'bag full');
  stand('home'); assert.equal(sellScrap(state).ok, false, 'only at the market');
  stand('market'); state.minutes = 19 * 60; assert.equal(sellScrap(state).ok, false, 'market closed');
  state.minutes = 10 * 60; const before = state.money, n = state.jobs.bag;
  assert.ok(sellScrap(state).ok); assert.equal(state.money - before, n * scrapPrice(state.day)); assert.equal(state.jobs.bag, 0);
  const prices = new Set(Array.from({ length: 20 }, (_, d) => scrapPrice(d))); assert.ok(prices.size > 3, 'prices move day to day');
  for (const p of prices) assert.ok(p >= 500 && p <= 1500);
  state.finance.owned.backpack = 1; assert.equal(scrapCapacity(state), 16);
});

test('vehicles and gear can be saved for and the fastest vehicle sets the speed', () => {
  assert.equal(vehicleSpeed(state), 1);
  state.finance.owned.scooter = 1; assert.equal(vehicleSpeed(state), 1.2);
  state.finance.owned.bike = 1; assert.equal(vehicleSpeed(state), 1.3);
  for (const id of ['balancebike', 'scooter', 'backpack', 'watch', 'mtb', 'ebike'] as const) { assert.ok(GOAL_IDS.includes(id)); assert.ok(GOODS[id].price > 0); }
  assert.ok(startGoal(state, 'scooter'));
});

test('side-job progress survives save and load; broken saves restore safely', () => {
  const job = delivery(); stand('board'); acceptJob(state, job.key); state.jobs.bag = 3;
  save(); const loaded = load()!;
  assert.equal(loaded.jobs.active?.key, job.key); assert.equal(loaded.jobs.bag, 3);
  assert.deepEqual(restoreJobs({ bag: -2, active: { nope: 1 }, taken: 'x' }), { ...restoreJobs(null) });
});

test('every job point, flyer house and bottle is reachable along the sidewalks', () => {
  const obstacles = [...buildings.map(collisionOf), ...trees.map(([x, y]) => ({ x: x - 12, y: y - 12, w: 24, h: 22 }))];
  const walk = (x: number, y: number) => canWalk(false, x, y, obstacles);
  const field = routeField(STREET_SPAWN.x, STREET_SPAWN.y, walk)!;
  const ids = new Set<string>(['board', ...DELIVERIES.flatMap(d => [d.from, d.to])]);
  for (let d = 1; d < 15; d++) for (const j of offersFor(d)) j.stops.forEach(s => ids.add(s));
  for (const id of ids) { const p = jobPoint(id); assert.ok(routeLength(field, p.x, p.y) >= 0, 'unreachable ' + id); }
  for (let d = 1; d < 6; d++) for (const p of scrapSpots(d)) assert.ok(routeLength(field, p.x, p.y) >= 0, `bottle ${p.x|0},${p.y|0}`);
  assert.ok(npcData.length && SPOTS.board);
});
