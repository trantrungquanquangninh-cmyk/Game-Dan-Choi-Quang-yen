// Pure challenge generators and scoring for activity mini-games.
// Scores are always 0..3 and scale the activity reward.

/** Deterministic pseudo-random number in [0,1) from a string seed. */
export function rand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
const pick = <T,>(list: readonly T[], seed: string) => list[Math.floor(rand(seed) * list.length)];
function shuffle<T>(list: readonly T[], seed: string) {
  return list.map((v, i) => ({ v, k: rand(seed + ':' + i) })).sort((a, b) => a.k - b.k).map(x => x.v);
}
const clampScore = (n: number) => Math.max(0, Math.min(3, Math.round(n)));

// ---- Coins: pay or give change with exact coins/notes ----
export const COINS = [1000, 2000, 5000, 10000] as const;
export function minCoins(amount: number) {
  let left = amount, count = 0;
  for (const c of [...COINS].reverse()) { count += Math.floor(left / c); left %= c; }
  return left === 0 ? count : Infinity;
}
export function coinChallenge(seed: string) {
  const price = (3 + Math.floor(rand(seed + 'p') * 15)) * 1000; // 3.000 – 17.000
  const paid = price <= 10000 ? (price < 5000 ? 5000 : 10000) : 20000;
  return { price, paid, change: paid - price };
}
/** fails = number of wrong submissions before the exact amount. */
export const scoreCoins = (exact: boolean, fails: number) => (exact ? clampScore(3 - fails) : 0);

// ---- Memory: remember a short list, then pick it ----
export const MEMORY_ITEMS = ['Rau muống', 'Trứng gà', 'Đậu phụ', 'Cà chua', 'Hành lá', 'Cá rô', 'Bí xanh', 'Chuối'] as const;
export function memoryChallenge(seed: string) {
  const order = shuffle(MEMORY_ITEMS, seed);
  return { list: order.slice(0, 3), options: shuffle(MEMORY_ITEMS, seed + 'o') };
}
export function scoreMemory(list: readonly string[], picked: readonly string[]) {
  const right = picked.filter(p => list.includes(p)).length, wrong = picked.length - right;
  return clampScore(right - wrong);
}

// ---- Sort: put each item into the right bin ----
export const SORT_SETS = {
  laundry: { bins: ['Đồ màu sáng', 'Đồ màu tối'], items: [['Áo trắng', 0], ['Khăn kem', 0], ['Tất trắng', 0], ['Quần đen', 1], ['Áo xanh đậm', 1], ['Khăn nâu', 1]] },
  weeds: { bins: ['Rau giữ lại', 'Cỏ dại nhổ đi'], items: [['Rau cải', 0], ['Rau muống', 0], ['Hành lá', 0], ['Cỏ gà', 1], ['Cỏ lá tre', 1], ['Dây leo dại', 1]] },
  trash: { bins: ['Giấy', 'Nhựa / lon'], items: [['Báo cũ', 0], ['Hộp giấy', 0], ['Vỏ hộp sữa giấy', 0], ['Chai nước', 1], ['Lon nước ngọt', 1], ['Túi nilon', 1]] },
  shelves: { bins: ['Kệ đồ ăn', 'Kệ đồ dùng'], items: [['Mì gói', 0], ['Bánh quy', 0], ['Nước mắm', 0], ['Xà phòng', 1], ['Bàn chải', 1], ['Giấy vệ sinh', 1]] },
  shapes: { bins: ['Hình tròn', 'Hình vuông'], items: [['Đồng hồ', 0], ['Bánh xe', 0], ['Đồng xu', 0], ['Ô cửa sổ', 1], ['Viên gạch', 1], ['Hộp quà', 1]] },
} as const;
export type SortSet = keyof typeof SORT_SETS;
export function sortChallenge(set: SortSet, seed: string) {
  const data = SORT_SETS[set];
  const items = data.items as readonly (readonly [string, number])[];
  return { bins: data.bins as readonly string[], items: shuffle(items, seed).map(([label, bin]) => ({ label, bin })) };
}
export const scoreSort = (correct: number, total: number) => clampScore((correct / Math.max(1, total)) * 3);

// ---- Timing: hits out of five tries ----
export const TIMING_TRIES = 5;
export const scoreTiming = (hits: number) => clampScore(hits);

export { pick };
