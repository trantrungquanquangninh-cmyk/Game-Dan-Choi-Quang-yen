// Ambient town life: pedestrians stroll along the sidewalks, motorbikes and
// cars drive in the right-hand lane. Vehicles stop when the player (or anyone)
// is on the road ahead of them, i.e. waiting on a zebra crossing.
import { roads, type Road, type Point } from './mapLayout';
import { SIDEWALK, KERB, KERB_GAP } from './walkways';
import { rand } from './minigames';

export type Lane = { pts: Point[]; cum: number[]; len: number };
export type MoverKind = 'walker' | 'moto' | 'car';
export type Mover = { id: number; kind: MoverKind; road: Road; lanes: [Lane, Lane]; s: number; dir: 1 | -1; speed: number; color: number; hair: number; waiting: number };

/** Polyline offset sideways by `offset` (positive = right of travel direction). */
export function laneOf(points: Point[], offset: number): Lane {
  const n = points.length, pts: Point[] = [];
  const normal = (a: Point, b: Point): Point => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; };
  for (let i = 0; i < n; i++) {
    const a = i > 0 ? normal(points[i - 1], points[i]) : normal(points[0], points[1]);
    const b = i < n - 1 ? normal(points[i], points[i + 1]) : a;
    let nx = a[0] + b[0], ny = a[1] + b[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const cos = Math.max(.5, nx * b[0] + ny * b[1]);
    pts.push([points[i][0] + nx * offset / cos, points[i][1] + ny * offset / cos]);
  }
  const cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[n - 1] };
}
/** Point and heading at arclength s along a lane. */
export function along(lane: Lane, s: number) {
  s = Math.max(0, Math.min(lane.len, s));
  let i = 1; while (i < lane.cum.length - 1 && lane.cum[i] < s) i++;
  const a = lane.pts[i - 1], b = lane.pts[i], seg = lane.cum[i] - lane.cum[i - 1] || 1, t = (s - lane.cum[i - 1]) / seg;
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
const roadLen = (r: Road) => r.points.slice(1).reduce((n, p, i) => n + Math.hypot(p[0] - r.points[i][0], p[1] - r.points[i][1]), 0);

const SHIRTS = [0xc8746b, 0x6b8fad, 0xe2ae56, 0x7aa37e, 0x9b7bb0, 0xd08f5a, 0x5e8a8f, 0xb85c7a];
const PAINT = [0xd9573f, 0x3f88c5, 0xf2f0e6, 0x2f4858, 0xe3b04b, 0x6a994e];

/** Creates the town's moving people and vehicles (deterministic). */
export function makeTraffic(walkers = 22, vehicles = 18): Mover[] {
  const list: Mover[] = []; let id = 0;
  const long = roads.filter(r => roadLen(r) > 280);
  // Pedestrians: middle of either sidewalk, walking back and forth.
  const walkRoads = long.map((r, i) => ({ r, k: rand('walk-road:' + i) })).sort((a, b) => a.k - b.k).map(x => x.r);
  for (let i = 0; i < walkers; i++) {
    const road = walkRoads[i % walkRoads.length], off = road.width / 2 + (KERB + KERB_GAP + SIDEWALK) / 2, side = rand('walk-side:' + i) < .5 ? 1 : -1;
    const lane = laneOf(road.points, off * side);
    list.push({ id: id++, kind: 'walker', road, lanes: [lane, lane], s: rand('walk-s:' + i) * lane.len, dir: rand('walk-dir:' + i) < .5 ? 1 : -1, speed: 34 + rand('walk-v:' + i) * 22, color: SHIRTS[i % SHIRTS.length], hair: [0x3e302d, 0x79563b, 0x262b2c, 0xb9b2a6][i % 4], waiting: 0 });
  }
  // Vehicles: wider streets only, right-hand lane, U-turn at the ends.
  const driveRoads = long.filter(r => r.width >= 40).map((r, i) => ({ r, k: rand('drive-road:' + i) })).sort((a, b) => a.k - b.k).map(x => x.r);
  for (let i = 0; i < vehicles && driveRoads.length; i++) {
    const road = driveRoads[i % driveRoads.length], q = road.width / 4;
    const forward = laneOf(road.points, q), back = laneOf([...road.points].reverse(), q);
    const car = rand('car:' + i) < .3;
    list.push({ id: id++, kind: car ? 'car' : 'moto', road, lanes: [forward, back], s: rand('drive-s:' + i) * forward.len, dir: rand('drive-dir:' + i) < .5 ? 1 : -1, speed: car ? 95 + rand('v:' + i) * 30 : 110 + rand('v:' + i) * 45, color: PAINT[i % PAINT.length], hair: 0x3e302d, waiting: 0 });
  }
  return list;
}

/** Current position of a mover. */
export function moverPos(m: Mover) {
  if (m.kind === 'walker') { const p = along(m.lanes[0], m.s); return { ...p, angle: m.dir > 0 ? p.angle : p.angle + Math.PI }; }
  const lane = m.dir > 0 ? m.lanes[0] : m.lanes[1];
  return along(lane, m.dir > 0 ? m.s : lane.len - m.s);
}

/** Advances one mover. `blocked(x,y)` says whether someone stands on the road at that point. */
export function stepMover(m: Mover, dt: number, blocked: (x: number, y: number) => boolean) {
  if (m.kind !== 'walker') {
    const p = moverPos(m), look = m.kind === 'car' ? 70 : 55;
    const ax = p.x + Math.cos(p.angle) * look, ay = p.y + Math.sin(p.angle) * look, mx = p.x + Math.cos(p.angle) * look / 2, my = p.y + Math.sin(p.angle) * look / 2;
    if (blocked(ax, ay) || blocked(mx, my)) { m.waiting += dt; return false; }
    m.waiting = 0;
  }
  const len = m.lanes[0].len;
  m.s += m.dir * m.speed * dt;
  if (m.s > len) { m.s = len - (m.s - len); m.dir = -1; }
  if (m.s < 0) { m.s = -m.s; m.dir = 1; }
  return true;
}
