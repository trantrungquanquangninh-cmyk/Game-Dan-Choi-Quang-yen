// ActivityDirector: proposes scheduled, dynamic and free activities from the
// player's age, clock, location, stats, money, relationships and history.
// All rewards and consequences are applied here, so the UI only reports a score.
import type { State } from './state';
import {SUBJECTS,SUBJECT_MINUTES} from './education';
import {syncStory,currentChapter,chapterPlace,archiveDay} from './progression';
import { record } from './family';
import { atPlace, PEOPLE, PLACE_NAMES, type Place } from './places';
import { canSleep, clock, DAY_MINUTES, isSchoolDay, BEDTIME_NOTICE } from './clock';
import { earn, spendCash, spendable, transact, buyGood, GOODS, goalInfo, type GoalId } from './finance';
import { rand, type SortSet } from './minigames';

type Stat = 'energy' | 'health' | 'happiness' | 'intelligence' | 'social' | 'discipline' | 'creativity' | 'reputation' | 'xp';
export type GameKind = 'none' | 'timing' | 'coins' | 'memory' | 'sort';
export type Effect = { stats?: Partial<Record<Stat, number>>; rel?: Record<string, number>; money?: number; payer?: 'family' | 'external' };
export type Choice = { label: string; hint?: string; requires?: (s: State) => string | null; apply: (s: State) => string };
export type ActivityKind = 'scheduled' | 'dynamic' | 'free';
export interface ActivityDef {
  id: string; kind: ActivityKind; title: string; giver: string; place: Place; acceptAt?: Place; text: string;
  window: [number, number]; days?: 'school' | 'off'; minAge?: number; maxAge?: number;
  chance?: number; cooldown?: number; once?: boolean; perDay?: number;
  requires?: (s: State) => boolean; blocked?: (s: State) => string | null;
  duration: number; energy: number; game: GameKind; sortSet?: SortSet;
  reward?: Effect; decline?: Effect; expire?: Effect; choices?: Choice[]; after?: (s: State, score: number) => string;
}

const h = (hh: number, mm = 0) => hh * 60 + mm;
const owns = (s: State, id: keyof typeof GOODS) => s.finance.owned[id] > 0;

export const ACTIVITIES: ActivityDef[] = [
  // ---------- Scheduled ----------
  { id: 'wake', kind: 'scheduled', title: 'Thức dậy, gấp chăn, đánh răng', giver: 'mom', place: 'home', window: [h(6, 30), h(8)], duration: 10, energy: 0, game: 'none',
    text: 'Bắt đầu ngày mới gọn gàng.', reward: { stats: { discipline: 1, health: 1 }, rel: { mom: 1 } } },
  { id: 'breakfast', kind: 'scheduled', title: 'Ăn sáng cùng gia đình', giver: 'mom', place: 'home', window: [h(6, 30), h(8, 30)], duration: 0, energy: 0, game: 'none',
    text: 'Ăn sáng giúp có sức đi học. Bỏ bữa sáng sẽ đói bụng giữa buổi.',
    choices: [
      { label: 'Ăn chậm, trò chuyện với mẹ (30 phút)', apply: s => { passTime(s, 30); applyEffect(s, { stats: { energy: 22, happiness: 3 }, rel: { mom: 2 } }); return 'Bữa sáng ấm áp. Năng lượng +22, quan hệ với mẹ +2.'; } },
      { label: 'Ăn nhanh cho kịp giờ (10 phút)', apply: s => { passTime(s, 10); applyEffect(s, { stats: { energy: 15 } }); return 'Ăn nhanh gọn. Năng lượng +15.'; } },
    ] },
  { id: 'lunch', kind: 'scheduled', title: 'Ăn trưa và nghỉ ngơi', giver: 'teacher', place: 'classroom', window: [h(11, 30), h(13)], days: 'school', duration: 40, energy: 0, game: 'none',
    requires: s => doneToday(s, 'lunch-home') === 0, text: 'Bữa trưa ở lớp cùng các bạn.', reward: { stats: { energy: 20, social: 1 }, rel: { nam: 1 } } },
  { id: 'lunch-home', kind: 'scheduled', title: 'Ăn trưa ở nhà', giver: 'mom', place: 'home', window: [h(11, 30), h(13)], duration: 40, energy: 0, game: 'none',
    requires: s => doneToday(s, 'lunch') === 0, text: 'Ăn trưa và ngủ trưa một chút.', reward: { stats: { energy: 22, health: 1 }, rel: { mom: 1 } } },
  { id: 'chores', kind: 'scheduled', title: 'Giúp mẹ phân loại quần áo', giver: 'mom', place: 'home', window: [h(14), h(18, 30)], duration: 25, energy: 6, game: 'sort', sortSet: 'laundry',
    text: 'Mẹ cần chia quần áo sáng/tối trước khi giặt. Mẹ thưởng tiền tiêu vặt nếu con làm cẩn thận.',
    reward: { money: 6000, payer: 'family', stats: { discipline: 2, xp: 5 }, rel: { mom: 2 } } },
  { id: 'dinner', kind: 'scheduled', title: 'Ăn tối, kể chuyện trong ngày', giver: 'mom', place: 'home', window: [h(18), h(19, 30)], duration: 40, energy: 0, game: 'none',
    text: 'Cả nhà quây quần. Không về ăn tối, bố mẹ sẽ lo lắng.', reward: { stats: { energy: 25, happiness: 4 }, rel: { mom: 2, dad: 2 } } },
  { id: 'homework', kind: 'scheduled', title: 'Bài tập buổi tối: đếm tiền trả lại', giver: 'dad', place: 'home', window: [h(19), h(21, 30)], duration: 30, energy: 5, game: 'coins',
    text: 'Bố đóng vai người bán hàng. Con tính tiền thừa trả lại cho khách.',
    reward: { stats: { intelligence: 3, discipline: 1, xp: 6 }, rel: { dad: 2 } },
    after: s => owns(s, 'picturebook') ? (applyEffect(s, { stats: { intelligence: 1 } }), 'Đọc thêm sách tranh: Trí tuệ +1.') : '' },
  { id: 'cleanup', kind: 'scheduled', title: 'Sinh hoạt cộng đồng: dọn công viên', giver: 'binh', place: 'park', window: [h(7, 30), h(11)], days: 'off', duration: 60, energy: 10, game: 'sort', sortSet: 'trash',
    text: 'Ngày nghỉ, cả khu phố cùng nhặt rác và phân loại tái chế ở công viên.',
    reward: { stats: { reputation: 4, social: 2, health: 1, xp: 10 }, rel: { binh: 2, hang: 1 } } },

  // ---------- Dynamic events ----------
  { id: 'piggy-gift', kind: 'dynamic', title: 'Bố mẹ tặng con lợn đất', giver: 'mom', place: 'home', window: [h(6), h(21)], minAge: 3, maxAge: 5, chance: 1, once: true, duration: 10, energy: 0, game: 'none',
    text: '“Con lớn rồi, bố mẹ tặng con một chú lợn đất. Tiền bỏ vào đây là tiền để dành của con.”',
    choices: [
      { label: 'Nhận lợn đất, đặt lên kệ', apply: s => { s.finance.piggyOwned = true; applyEffect(s, { stats: { happiness: 4 }, rel: { mom: 2, dad: 1 } }); return 'Đã có ống heo! Mở Ví (V) khi ở nhà để bỏ tiền vào.'; } },
      { label: 'Nhận và bỏ ngay 5.000đ đầu tiên', requires: s => (spendable(s) < 5000 ? 'Cần 5.000đ tiền mặt.' : null),
        apply: s => { s.finance.piggyOwned = true; transact(s, 'Bỏ ống heo lần đầu', 'transfer', 'Ống heo', [{ acc: 'cash', amount: -5000 }, { acc: 'piggy', amount: 5000 }]); applyEffect(s, { stats: { happiness: 4, discipline: 2 }, rel: { mom: 2, dad: 2 } }); return 'Leng keng! 5.000đ đầu tiên đã nằm trong ống heo.'; } },
    ] },
  { id: 'lixi', kind: 'dynamic', title: 'Ông bà gửi tiền mừng tuổi 50.000đ', giver: 'ong-ba', place: 'home', window: [h(6, 30), h(21)], requires: s => s.day >= 2, chance: 1, once: true, duration: 15, energy: 0, game: 'none',
    text: 'Ông bà ở quê gửi lên 50.000đ mừng tuổi. Con muốn dùng thế nào?',
    choices: [
      { label: 'Nhờ bố mẹ mua bộ xếp hình (50.000đ)', hint: 'Vui ngay, mở trò chơi xếp hình ở nhà', apply: s => {
        earn(s, 50000, 'Tiền mừng tuổi của ông bà', PEOPLE['ong-ba']); buyGood(s, 'blocks', 50000, false);
        return 'Có bộ xếp hình mới! Hạnh phúc tăng, mở hoạt động “Chơi xếp hình” ở nhà.'; } },
      { label: 'Tiết kiệm toàn bộ', hint: 'Đến gần mục tiêu lớn hơn', apply: s => {
        earn(s, 50000, 'Tiền mừng tuổi của ông bà', PEOPLE['ong-ba']); const to = s.finance.piggyOwned ? 'piggy' : 'jar:save';
        transact(s, 'Cất tiền mừng tuổi', 'transfer', to === 'piggy' ? 'Ống heo' : 'Hũ tiết kiệm', [{ acc: 'cash', amount: -50000 }, { acc: to, amount: 50000 }]);
        applyEffect(s, { stats: { discipline: 3 }, rel: { 'ong-ba': 2 } }); return 'Đã cất 50.000đ vào ' + (to === 'piggy' ? 'ống heo' : 'hũ tiết kiệm') + '. Mục tiêu xe đạp gần thêm một chút.'; } },
      { label: 'Mua sách tranh 25.000đ, cất 25.000đ', hint: 'Vừa có đồ mới vừa để dành', apply: s => {
        earn(s, 50000, 'Tiền mừng tuổi của ông bà', PEOPLE['ong-ba']); buyGood(s, 'picturebook', 25000, false); const to = s.finance.piggyOwned ? 'piggy' : 'jar:save';
        transact(s, 'Cất một nửa tiền mừng tuổi', 'transfer', 'Tiết kiệm', [{ acc: 'cash', amount: -25000 }, { acc: to, amount: 25000 }]);
        applyEffect(s, { stats: { discipline: 1 }, rel: { 'ong-ba': 1 } }); return 'Có sách tranh mới và còn 25.000đ để dành.'; } },
    ] },
  { id: 'neighbor-carry', kind: 'dynamic', title: 'Cô Hằng nhờ mang giúp túi rau', giver: 'hang', place: 'neighbor', window: [h(13, 30), h(19)], chance: 0.6, cooldown: 2, duration: 20, energy: 8, game: 'timing',
    text: 'Cô Hằng vừa đi chợ về, tay xách nhiều đồ. Nhấn đúng nhịp để bước đều, không làm rơi túi.',
    reward: { money: 5000, payer: 'external', stats: { reputation: 2, social: 1, xp: 4 }, rel: { hang: 3 } }, decline: { rel: { hang: -1 } }, expire: { rel: { hang: -2 } } },
  { id: 'nam-football', kind: 'dynamic', title: 'Nam rủ ra sân đá bóng', giver: 'nam', place: 'nam', window: [h(14), h(18, 30)], chance: 0.7, cooldown: 1, duration: 45, energy: 12, game: 'timing',
    text: 'Các bạn đang thiếu người. Sút đúng nhịp để ghi bàn!', reward: { stats: { social: 3, health: 2, happiness: 5, xp: 5 }, rel: { nam: 3 } },
    after: s => owns(s, 'ball') ? (applyEffect(s, { stats: { happiness: 3 }, rel: { nam: 2 } }), 'Con mang quả bóng của mình: cả nhóm vui hơn (+2 quan hệ).') : '',
    decline: { rel: { nam: -1 } }, expire: { rel: { nam: -2 }, stats: { happiness: -2 } } },
  { id: 'mom-errand', kind: 'dynamic', title: 'Mẹ nhờ ra chợ mua đồ nấu tối', giver: 'mom', place: 'market', acceptAt: 'mom', window: [h(13, 30), h(18)], chance: 0.55, cooldown: 2, duration: 30, energy: 6, game: 'memory',
    text: 'Nhận lời ở nhà, nhớ danh sách mẹ dặn, rồi ra Chợ Rừng mua đúng món. Mua sai món thì ví gia đình tốn thêm.',
    reward: { stats: { discipline: 2, intelligence: 1, xp: 6 }, rel: { mom: 3, 'ba-tu': 1 } }, decline: { rel: { mom: -1 } }, expire: { rel: { mom: -3 }, stats: { happiness: -2 } },
    after: (s, score) => {
      const cost = 25000 + (3 - score) * 5000; const paid = Math.min(cost, s.family.cash);
      if (paid) record(s.family, s.day, 'Con đi chợ giúp mẹ: rau, trứng, đậu' + (score < 3 ? ' (có món mua nhầm)' : ''), -paid, 'expense');
      const tip = score === 3 ? 3000 : 0;
      if (tip && s.family.cash >= tip) { record(s.family, s.day, 'Mẹ thưởng con đi chợ giỏi', -tip, 'transfer'); earn(s, tip, 'Mẹ thưởng đi chợ đúng món', 'Mẹ'); }
      return `Ví gia đình chi ${paid.toLocaleString('vi-VN')}đ.` + (tip ? ' Mẹ thưởng 3.000đ.' : ' Lần sau nhớ kỹ danh sách nhé.');
    } },
  { id: 'binh-weeds', kind: 'dynamic', title: 'Bác Bình nhờ nhổ cỏ luống rau', giver: 'binh', place: 'binh', window: [h(13, 30), h(18, 30)], chance: 0.5, cooldown: 2, duration: 30, energy: 8, game: 'sort', sortSet: 'weeds',
    text: 'Phân biệt rau và cỏ dại. Nhổ nhầm rau thì bác buồn lắm!', reward: { money: 6000, payer: 'external', stats: { health: 2, xp: 4 }, rel: { binh: 3 } },
    decline: { rel: { binh: -1 } }, expire: { rel: { binh: -1 } } },
  { id: 'cafe-help', kind: 'dynamic', title: 'Anh Tú cần người phụ tính tiền', giver: 'tu', place: 'cafe', window: [h(13, 30), h(19)], minAge: 4, chance: 0.5, cooldown: 2, duration: 30, energy: 6, game: 'coins',
    text: 'Quán đông khách. Anh Tú nhờ con đếm tiền thừa trả khách (anh đứng cạnh kiểm tra).',
    reward: { money: 7000, payer: 'external', stats: { intelligence: 2, social: 1, xp: 5 }, rel: { tu: 3 } }, decline: { rel: { tu: -1 } } },
  { id: 'lan-intro', kind: 'dynamic', title: 'Cô Lan giới thiệu việc phụ xếp kệ', giver: 'lan', place: 'shop', window: [h(9), h(19)], chance: 0.6, cooldown: 3,
    requires: s => !s.life.unlocked.includes('shelf-job') && ((s.relationships.lan || 0) >= 2 || s.quests.shopping === 2), duration: 10, energy: 0, game: 'none',
    text: '“Chiều nào rảnh con ghé phụ cô xếp hàng lên kệ nhé. Cô trả công, có cô trông, không ảnh hưởng giờ học.”',
    choices: [
      { label: 'Nhận lời, chiều rảnh sẽ ghé', apply: s => { s.life.unlocked.push('shelf-job'); applyEffect(s, { rel: { lan: 2 }, stats: { reputation: 1 } }); return 'Mở việc mới: “Phụ cô Lan xếp kệ” mỗi chiều 13:00–19:00.'; } },
      { label: 'Để sau, con muốn chơi nhiều hơn', apply: () => 'Cô Lan cười: “Lúc nào muốn thì cứ nói cô.”' },
    ] },
  { id: 'lan-promo', kind: 'dynamic', title: 'Tạp hóa khuyến mãi cuối ngày', giver: 'lan', place: 'shop', window: [h(13), h(19, 30)], chance: 0.4, cooldown: 3, duration: 10, energy: 0, game: 'none',
    text: 'Cô Lan giảm giá: quả bóng 28.000đ (giá gốc 40.000đ), combo 3 bánh gạo 12.000đ.',
    choices: [
      { label: 'Mua quả bóng giảm giá 28.000đ', requires: s => (owns(s, 'ball') ? 'Con đã có bóng rồi.' : spendable(s) < 28000 ? 'Chưa đủ 28.000đ.' : null),
        apply: s => { buyGood(s, 'ball', 28000, false); return 'Tiết kiệm được 12.000đ so với giá gốc. Đá bóng với Nam sẽ vui hơn.'; } },
      { label: 'Mua combo 3 bánh gạo 12.000đ', requires: s => (spendable(s) < 12000 ? 'Chưa đủ 12.000đ.' : null),
        apply: s => { spendCash(s, 12000, 'Combo 3 bánh gạo', PLACE_NAMES.shop); s.inventory.snack += 3; return 'Có 3 bánh gạo trong túi đồ để hồi năng lượng.'; } },
      { label: 'Không mua, giữ tiền', apply: s => { applyEffect(s, { stats: { discipline: 1 } }); return 'Giữ tiền cho mục tiêu khác. Khuyến mãi chỉ có lợi khi mình thật sự cần.'; } },
    ] },
  { id: 'school-fair', kind: 'dynamic', title: 'Hội chợ trường: bán vòng tay tự làm', giver: 'teacher', place: 'school', window: [h(13), h(18)], requires: s => s.day % 7 === 5, chance: 1, cooldown: 6, duration: 90, energy: 12, game: 'none',
    blocked: s => (spendable(s) < 20000 ? 'Cần 20.000đ mua hạt và dây làm 5 vòng tay.' : null),
    text: 'Bỏ 20.000đ mua nguyên liệu làm 5 chiếc vòng, rồi tự đặt giá bán. Giá cao lời nhiều mỗi chiếc nhưng ít người mua. Có thể lỗ!',
    choices: [8000, 12000, 18000].map(price => ({
      label: `Bán ${price.toLocaleString('vi-VN')}đ một chiếc`,
      apply: (s: State) => fairSale(s, price),
    })) },
  { id: 'nam-birthday', kind: 'dynamic', title: 'Sinh nhật bạn Nam', giver: 'nam', place: 'nam', window: [h(14), h(19)], requires: s => (s.relationships.nam || 0) >= 5 || s.quests.friend === 2, chance: 0.35, once: true, duration: 40, energy: 5, game: 'none',
    text: 'Nam mời con đến sinh nhật. Con chuẩn bị quà thế nào?',
    choices: [
      { label: 'Mua quà ở tạp hóa 15.000đ', requires: s => (spendable(s) < 15000 ? 'Chưa đủ 15.000đ.' : null),
        apply: s => { spendCash(s, 15000, 'Quà sinh nhật Nam', PLACE_NAMES.shop); applyEffect(s, { stats: { social: 3, happiness: 3 }, rel: { nam: 6 } }); return 'Nam rất thích món quà. Quan hệ +6.'; } },
      { label: 'Tự vẽ một tấm thiệp (thêm 20 phút)', apply: s => { passTime(s, 20); applyEffect(s, { stats: { creativity: 3, social: 2 }, rel: { nam: 5 } }); return 'Tấm thiệp tự làm khiến Nam cảm động. Không tốn tiền, Sáng tạo +3.'; } },
      { label: 'Không đến', apply: s => { applyEffect(s, { rel: { nam: -3 } }); return 'Nam hơi buồn vì con không đến.'; } },
    ] },

  // ---------- Free, player-initiated ----------
  { id: 'park-play', kind: 'free', title: 'Chạy nhảy ở công viên', giver: 'binh', place: 'park', window: [h(6), h(19, 30)], perDay: 2, duration: 30, energy: 6, game: 'none',
    text: 'Không kiếm tiền, nhưng tốt cho sức khỏe và tâm trạng.', reward: { stats: { health: 2, happiness: 5 } } },
  { id: 'shelf-job', kind: 'free', title: 'Phụ cô Lan xếp hàng lên kệ', giver: 'lan', place: 'shop', window: [h(13), h(19)], requires: s => s.life.unlocked.includes('shelf-job'), perDay: 1, duration: 40, energy: 10, game: 'sort', sortSet: 'shelves',
    text: 'Xếp đúng kệ để khách dễ tìm. Tiền công phụ thuộc độ chính xác.', reward: { money: 8000, payer: 'external', stats: { discipline: 1, xp: 5 }, rel: { lan: 1 } } },
  { id: 'market-explore', kind: 'free', title: 'Hỏi giá cùng bà Tư ở chợ', giver: 'ba-tu', place: 'market', window: [h(6), h(18)], perDay: 1, duration: 20, energy: 3, game: 'coins',
    text: 'Bà Tư bán rau dạy con tính tiền. Biết giá cả giúp tiêu tiền khôn hơn.', reward: { stats: { intelligence: 2, xp: 3 }, rel: { 'ba-tu': 2 } } },
  { id: 'blocks-play', kind: 'free', title: 'Chơi bộ xếp hình', giver: 'mom', place: 'home', window: [h(6, 30), h(21)], requires: s => owns(s, 'blocks'), perDay: 1, duration: 30, energy: 2, game: 'none',
    text: 'Món đồ chơi đã mua mở ra trò chơi mới.', reward: { stats: { creativity: 3, happiness: 4 } } },
  { id: 'read-book', kind: 'free', title: 'Đọc sách tranh', giver: 'dad', place: 'home', window: [h(6, 30), h(21, 30)], requires: s => owns(s, 'picturebook'), perDay: 1, duration: 25, energy: 2, game: 'none',
    text: 'Đọc truyện cùng bố.', reward: { stats: { intelligence: 3, happiness: 2 }, rel: { dad: 1 } } },
  {id:'garden',kind:'free',title:'Chăm vườn nhỏ cùng bác Bình',giver:'binh',place:'binh',window:[h(7),h(19)],requires:s=>s.life.unlocked.includes('garden'),perDay:1,duration:25,energy:4,game:'sort',sortSet:'weeds',text:'Hạt giống sinh nhật đã nảy mầm. Nhận biết rau và cỏ dại để chăm vườn.',reward:{stats:{creativity:2,health:1,happiness:4,xp:5},rel:{binh:2}}},
];
export const activity = (id: string) => ACTIVITIES.find(a => a.id === id);

// ---------------- Life state ----------------
export type OfferStatus = 'offered' | 'accepted' | 'done' | 'declined' | 'expired' | 'postponed';
export type Offer = { id: string; day: number; status: OfferStatus };
export type HistoryEntry = { day: number; minutes: number; title: string; outcome: string };
export type Life = {
  returnedHomeDay: number; generatedDay: number; offers: Offer[]; lastDone: Record<string, number>; today: { day: number; counts: Record<string, number> };
  lastOffered: Record<string, number>; unlocked: string[]; met: string[]; checks: { day: number; done: string[] };
  notices: string[]; bedtimeNotice: number; history: HistoryEntry[];
};
export const freshLife = (): Life => ({
  returnedHomeDay: 0, generatedDay: 0, offers: [], lastDone: {}, today: { day: 0, counts: {} }, lastOffered: {}, unlocked: [], met: [],
  checks: { day: 0, done: [] }, notices: [], bedtimeNotice: 0, history: [],
});
export function restoreLife(raw: unknown): Life {
  const base = freshLife();
  if (!raw || typeof raw !== 'object') return base;
  const v = raw as Life;
  const rec = (x: unknown) => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, number>) : {});
  const strs = (x: unknown) => (Array.isArray(x) ? x.filter(i => typeof i === 'string') : []);
  return {
    ...base, ...v,
    returnedHomeDay: Number.isSafeInteger(v.returnedHomeDay) ? v.returnedHomeDay : 0,
    generatedDay: Number.isSafeInteger(v.generatedDay) ? v.generatedDay : 0,
    offers: Array.isArray(v.offers) ? v.offers.filter(o => activity(o?.id) && Number.isSafeInteger(o.day)).slice(-40) : [],
    lastDone: rec(v.lastDone), lastOffered: rec(v.lastOffered),
    today: { day: Number(v.today?.day) || 0, counts: rec(v.today?.counts) },
    checks: { day: Number(v.checks?.day) || 0, done: strs(v.checks?.done) },
    unlocked: strs(v.unlocked), met: strs(v.met), notices: strs(v.notices).slice(-10),
    bedtimeNotice: Number(v.bedtimeNotice) || 0,
    history: Array.isArray(v.history) ? v.history.filter(e => typeof e?.title === 'string').slice(0, 40) : [],
  };
}

const log = (s: State, message: string) => { s.log.unshift(message); s.log = s.log.slice(0, 30); };
export const notify = (s: State, message: string) => { s.life.notices.push(message); s.life.notices = s.life.notices.slice(-10); };
export function takeNotice(s: State) { return s.life.notices.shift(); }

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
export function applyEffect(s: State, e: Effect, scale = 1, label = '', party = '') {
  for (const [k, v] of Object.entries(e.stats ?? {}) as [Stat, number][]) {
    const n = v > 0 ? Math.round(v * scale) : v;
    s[k] = k === 'xp' ? Math.max(0, s[k] + n) : clamp(s[k] + n);
  }
  for (const [k, v] of Object.entries(e.rel ?? {})) {
    const n = v > 0 ? Math.round(v * scale) : v;
    if (n) s.relationships[k] = clamp((s.relationships[k] || 0) + n, -100, 100);
  }
  const money = Math.round(((e.money ?? 0) * scale) / 1000) * 1000;
  if (money > 0) {
    if (e.payer === 'family') {
      const paid = Math.min(money, s.family.cash);
      if (paid) { record(s.family, s.day, 'Thưởng con: ' + label, -paid, 'transfer'); earn(s, paid, label, party); }
      return paid;
    }
    earn(s, money, label, party);
  }
  return money;
}

/** Advances the in-game clock. Crossing midnight without sleeping starts the next day tired. */
export function passTime(s: State, minutes: number) {
  s.minutes += Math.max(0, minutes);
  while (s.minutes >= DAY_MINUTES) rollMidnight(s);
}
export function rollMidnight(s: State) {
  if (s.minutes < DAY_MINUTES) return false;
  archiveDay(s);
  s.minutes -= DAY_MINUTES; s.day++;
  syncStory(s);
  s.energy = clamp(s.energy - 20); s.health = clamp(s.health - 4); s.happiness = clamp(s.happiness - 4);
  notify(s, 'Đã quá nửa đêm mà chưa ngủ! Năng lượng −20, sức khỏe −4. Phải chờ đến 21:00 tối nay mới ngủ được.');
  log(s, 'Thức qua nửa đêm, ngày ' + s.day + ' bắt đầu trong mệt mỏi.');
  return true;
}

// ---------------- School comes first ----------------
/** Routines allowed before school is finished on a school day. */
export const BEFORE_SCHOOL = ['wake', 'breakfast', 'lunch'];
export const SCHOOL_END = h(16);
/** School stays required until completed or a parent/teacher agrees to defer. */
export function schoolLock(s: State): string | null {
  if (!isSchoolDay(s.day) || s.education.attended.includes(s.day) || s.education.deferredDay===s.day || s.education.safety.status === 'abducted') return null;
  const e = s.education, step = e.lessonDay === s.day ? e.step : 0;
  return step > 0 ? `Đang học dở (${step}/${SUBJECTS.length} môn). Học xong Toán, Anh, Văn, Sử và Địa rồi mới được về.` : 'Phải đi học trước! Hoàn thành Toán, Anh, Văn, Sử và Địa rồi về nhà trước khi tham gia hoạt động khác.';
}

/** The child may not walk out of class before lessons are done (unless school hours for starting are over). */
export const canLeaveSchool = (s: State) => !(s.inside && s.room === 'classroom' && schoolLock(s) && s.minutes < h(15) && s.energy>=10);

/** Visiting home after class completes the second daily step, saved per day. */
export function markHomeReturn(s: State) {
  if (s.inside && s.room === 'home' && (s.education.attended.includes(s.day)||s.education.deferredDay===s.day)) s.life.returnedHomeDay = s.day;
}
export function dailyLock(s: State): string | null {
  markHomeReturn(s);
  return schoolLock(s) ?? (isSchoolDay(s.day) && s.life.returnedHomeDay !== s.day ? 'Học xong rồi! Về nhà gặp bố mẹ trước khi tham gia hoạt động khác.' : null);
}
export function activityLock(s: State, id?: string): string | null {
  const required = dailyLock(s);
  if (required && !(id && BEFORE_SCHOOL.includes(id))) return required;
  const promised = s.life.offers.find(o => o.day === s.day && o.status === 'accepted' && o.id !== id && activity(o.id)!.window[1] > s.minutes);
  if (promised) return 'Làm xong “' + activity(promised.id)!.title + '” trước khi nhận việc khác.';
  if (s.quests.shopping === 1 && !doneToday(s,'shopping-postponed') && id !== 'shopping') return 'Mang đủ sữa, bánh mì và tiền thừa về cho mẹ trước khi làm việc khác, hoặc gặp mẹ xin tiếp tục vào sáng mai.';
  return null;
}
export function dailyTask(s: State): Suggestion {
  if (canSleep(s.minutes)) return { key: 'bed', title: 'Về nhà đi ngủ', detail: 'Ngủ để bắt đầu lịch ngày mai lúc 06:30.', place: 'bed', status: 'KẾT THÚC NGÀY' };
  if (schoolLock(s)) {
    if(s.energy<10)return {key:'slot:recover',title:atPlace(s,'home')?'Ăn nhẹ và nghỉ trước khi đi học':'Về nhà nghỉ lấy sức',detail:'Ở nhà mở “Cần nghỉ hoặc xin hoãn?” để hồi 30 năng lượng miễn phí.',place:'home',status:'CẦN NGHỈ'};
    const remaining=(SUBJECTS.length-(s.education.lessonDay===s.day?s.education.step:0))*SUBJECT_MINUTES;
    const tooLate=s.minutes+remaining>=h(21);
    return { key: 'slot:school', title: tooLate?'Báo người lớn để xin học bù':s.inside && s.room === 'classroom' ? 'Học Toán · Anh · Văn · Sử · Địa' : 'Đến trường đi học', detail: tooLate?'Không còn đủ giờ. Gặp mẹ hoặc cô Mai để xin học bù ngày mai.':s.inside && s.room === 'classroom' ? 'Gặp cô Mai hoặc đến góc học tập, nhấn E.' : 'Gặp mẹ để được đưa đến trường, hoặc đi theo chỉ đường.', place: s.inside && s.room === 'classroom' ? 'classroom' : tooLate?'home':'school', status: 'BƯỚC 1 · ĐI HỌC' };
  }
  if (dailyLock(s)) return { key: 'slot:home', title: 'Về nhà sau giờ học', detail: 'Vào nhà gặp bố mẹ. Sau đó mở hoạt động tự do và giúp việc.', place: 'home', status: 'BƯỚC 2 · VỀ NHÀ' };
  if (s.quests.shopping === 1 && !doneToday(s,'shopping-postponed')) return { key: 'shopping', title: 'Giúp mẹ mua sữa và bánh mì', detail: s.inventory.milk && s.inventory.bread ? 'Mang đồ và tiền thừa về cho mẹ.' : s.minutes>=h(20)?'Tạp hóa đã đóng cửa. Về gặp mẹ xin tiếp tục vào sáng mai.':'Đến tạp hóa cô Lan mua đủ đồ mẹ dặn.', place: s.inventory.milk && s.inventory.bread || s.minutes>=h(20) ? 'mom' : 'shop', status: 'ĐANG LÀM · GIÚP MẸ' };
  const promised = s.life.offers.find(o => o.day === s.day && o.status === 'accepted' && activity(o.id)!.window[1] > s.minutes);
  if (promised) { const a = activity(promised.id)!; return { key: a.id, title: a.title, detail: 'Hoàn thành việc đã nhận trước khi chọn việc khác.', place: a.place, status: 'ĐANG LÀM' }; }
  const chapter=currentChapter(s);
  if(chapter&&s.day>=chapter.day&&s.education.deferredDay!==s.day&&!(chapter.id==='first-errand'&&doneToday(s,'shopping-postponed')))return {key:'story:'+chapter.id,title:chapter.title,detail:chapter.text,place:chapterPlace(s,chapter),status:'CHƯƠNG TUỔI THƠ · '+chapter.day+'/7'};
  if(s.minutes>=h(18)) {
    const dinner=activity('dinner')!,homework=activity('homework')!;
    if(inWindow(dinner,s.minutes)&&!doneToday(s,'dinner'))return {key:'slot:evening',title:'Ăn tối cùng gia đình',detail:'Đến bàn ăn hoặc gặp mẹ, nhấn E. Ăn xong có thể làm bài tập và sinh hoạt đến giờ ngủ.',place:'home',status:'BUỔI TỐI'};
    if(inWindow(homework,s.minutes)&&!doneToday(s,'homework')&&s.energy>=homework.energy)return {key:'slot:evening',title:'Làm bài tập buổi tối',detail:'Mở bàn ăn hoặc gặp mẹ, làm bài đếm tiền. Xong rồi có thể sinh hoạt cùng gia đình đến 21:00.',place:'home',status:'BUỔI TỐI'};
    return {key:'slot:evening',title:'Sinh hoạt cùng gia đình đến giờ ngủ',detail:'Còn '+Math.ceil(h(21)-s.minutes)+' phút. Mở Hoạt động (H) để nghe kể chuyện, vẽ hoặc sinh hoạt đến 21:00.',place:'home',status:'ĐÃ RẢNH · NGHỈ NGƠI'};
  }
  const available=entries(s).filter(e=>!e.reason&&e.status!=='upcoming'&&s.energy>=e.def.energy);
  if(!available.length)return {key:'slot:leisure',title:'Đã xong việc, dành thời gian cho mình',detail:'Về nhà nghe kể chuyện, vẽ hoặc chơi tự do. Những hoạt động này luôn có thể lặp lại đến giờ ngủ.',place:'home',status:'THỜI GIAN RẢNH'};
  return { key: 'slot:free', title: 'Còn '+available.length+' hoạt động có thể làm', detail: 'Mở Hoạt động (H) để chọn; cũng có thể về nhà chơi tự do và nghỉ ngơi.', place: null, status: isSchoolDay(s.day) ? 'BƯỚC 3 · TỰ DO' : 'NGÀY NGHỈ · TỰ DO' };
}

export const PASTIMES = [
  {id:'tell-story',title:'Nghe bố mẹ kể chuyện',minutes:30,text:'Cả nhà kể một chuyện vui trong ngày rồi cùng trò chuyện.'},
  {id:'draw',title:'Vẽ tự do ở nhà',minutes:20,text:'Con vẽ lại một góc khu phố và khoe bức tranh với bố mẹ.'},
  {id:'quiet-play',title:'Chơi đồ chơi và dọn góc chơi',minutes:30,text:'Con chơi nhẹ nhàng rồi xếp đồ đạc gọn gàng.'},
] as const;
export type PastimeId=typeof PASTIMES[number]['id'];
export function freeTimeLock(s:State):string|null {
  if(s.education.safety.status==='abducted')return 'Cần nhờ người lớn trợ giúp trước.';
  if(!atPlace(s,'home'))return 'Về nhà để sinh hoạt cùng gia đình.';
  if(s.minutes<h(6,30)||s.minutes>=h(21))return 'Sinh hoạt tự do từ 06:30 đến trước 21:00. Đến giờ ngủ thì nghỉ đến sáng mai.';
  return activityLock(s);
}
function recordQuietTime(s:State,id:string,title:string,outcome:string) {
  if(s.life.today.day!==s.day)s.life.today={day:s.day,counts:{}};
  s.life.today.counts[id]=(s.life.today.counts[id]||0)+1;
  s.life.history.unshift({day:s.day,minutes:Math.floor(s.minutes),title,outcome});s.life.history=s.life.history.slice(0,40);
}
/** Repeatable downtime consumes time, with no money/XP/stat farming. */
export function spendFreeTime(s:State,id:PastimeId):Result {
  const reason=freeTimeLock(s);if(reason)return fail(reason);
  const option=PASTIMES.find(o=>o.id===id);if(!option)return fail('Không tìm thấy sinh hoạt này.');
  const duration=Math.min(option.minutes,h(21)-s.minutes);
  passTime(s,duration);recordQuietTime(s,'leisure:'+id,option.title,option.text);tickLife(s);
  return {ok:true,message:option.text+' Đã qua '+Math.ceil(duration)+' phút, bây giờ là '+clock(s.minutes)+'.'};
}
export function windDown(s:State):Result {
  const reason=freeTimeLock(s);if(reason)return fail(reason);
  if(s.minutes<h(18))return fail('Từ 18:00 có thể sinh hoạt đến giờ ngủ. Trước đó con chọn chơi tự do nhé.');
  const duration=h(21)-s.minutes;
  passTime(s,duration);recordQuietTime(s,'wind-down','Sinh hoạt buổi tối cùng gia đình','Trò chuyện, dọn góc chơi, vệ sinh cá nhân và chuẩn bị đồ cho ngày mai.');tickLife(s);
  return {ok:true,message:'Cả nhà đã sinh hoạt và chuẩn bị cho ngày mai. Bây giờ là 21:00, con có thể đi ngủ.'};
}
export function postponeShopping(s:State):Result {
  if(!atPlace(s,'home'))return fail('Về gặp mẹ để xin tiếp tục vào sáng mai.');
  if(s.quests.shopping!==1||doneToday(s,'shopping-postponed'))return fail('Không có việc mua đồ đang chờ để xin hoãn.');
  recordQuietTime(s,'shopping-postponed','Báo mẹ tiếp tục mua đồ sáng mai','Mẹ đồng ý giữ nguyên đồ đã mua và tiền tạm ứng, tiếp tục vào ngày mai.');
  return {ok:true,message:'Mẹ đồng ý để con tiếp tục sáng mai. Đồ và tiền mua hàng vẫn được giữ nguyên.'};
}

// ---------------- Availability ----------------
export const doneToday = (s: State, id: string) => (s.life.today.day === s.day ? s.life.today.counts[id] || 0 : 0);
const inWindow = (a: ActivityDef, m: number) => m >= a.window[0] && m < a.window[1];
function eligible(s: State, a: ActivityDef) {
  if (a.minAge !== undefined && s.age < a.minAge) return false;
  if (a.maxAge !== undefined && s.age > a.maxAge) return false;
  if (a.days === 'school' && !isSchoolDay(s.day)) return false;
  if (a.days === 'off' && isSchoolDay(s.day)) return false;
  const last = s.life.lastDone[a.id];
  if (a.once && last !== undefined) return false;
  if (a.cooldown && last !== undefined && s.day - last < a.cooldown) return false;
  if (a.requires && !a.requires(s)) return false;
  return true;
}
const todaysOffer = (s: State, id: string) => s.life.offers.find(o => o.id === id && o.day === s.day);

/** Creates today's dynamic events once per day, seeded so a reload sees the same day. */
export function generateDay(s: State) {
  const L = s.life; if (L.generatedDay === s.day) return;
  L.generatedDay = s.day;
  const carried=L.offers.filter(o=>o.status==='postponed'&&o.day===s.day-1).map(o=>o.id);
  // Avoid offering the same event two days in a row (guaranteed one-off events excepted).
  const pool = ACTIVITIES.filter(a => a.kind === 'dynamic' && eligible(s, a) && (a.chance === 1 || L.lastOffered[a.id] !== s.day - 1))
    .map(a => ({ a, roll: rand(s.day + ':' + a.id + ':' + s.name) }));
  pool.sort((x, y) => (x.roll / (x.a.chance ?? 0.5)) - (y.roll / (y.a.chance ?? 0.5)));
  // Guaranteed events, then chance rolls, with at least two (when possible) and at most five per day.
  const picked = pool.filter(p => p.a.chance === 1 || p.roll < (p.a.chance ?? 0.5));
  for (const p of pool) if (picked.length < 2 && !picked.includes(p)) picked.push(p);
  for(const id of carried)L.offers.push({id,day:s.day,status:'offered'});
  for (const { a } of picked.filter(p=>!carried.includes(p.a.id)).slice(0, Math.max(0,5-carried.length))) { L.offers.push({ id: a.id, day: s.day, status: 'offered' }); L.lastOffered[a.id] = s.day; }
  L.offers = L.offers.slice(-40);
}

export type Entry = { def: ActivityDef; status: 'available' | 'offered' | 'accepted' | 'upcoming'; reason: string | null };
function entryFor(s: State, a: ActivityDef): Entry | null {
  const m = s.minutes;
  if (a.kind === 'dynamic') {
    const o = todaysOffer(s, a.id);
    if (!o || (o.status !== 'offered' && o.status !== 'accepted')) return null;
    if (m < a.window[0]) return { def: a, status: 'upcoming', reason: 'Từ ' + clock(a.window[0]) };
    if (!inWindow(a, m)) return null;
    return { def: a, status: o.status, reason: activityLock(s, a.id) ?? a.blocked?.(s) ?? null };
  }
  if (!eligible(s, a)) return null;
  if (doneToday(s, a.id) >= (a.perDay ?? 1)) return null;
  if (m < a.window[0]) return a.window[0] - m <= 120 ? { def: a, status: 'upcoming', reason: 'Từ ' + clock(a.window[0]) } : null;
  if (!inWindow(a, m)) return null;
  return { def: a, status: 'available', reason: activityLock(s, a.id) ?? a.blocked?.(s) ?? null };
}
export function entries(s: State) {
  generateDay(s);
  return ACTIVITIES.map(a => entryFor(s, a)).filter((e): e is Entry => !!e);
}
/** Activities that can be started or accepted at this place right now. */
export function entriesAt(s: State, place: Place) {
  return entries(s).filter(e => !e.reason && e.status !== 'upcoming' && (e.def.place === place || (e.def.acceptAt === place && e.status === 'offered')));
}

export type Suggestion = { key: string; title: string; detail: string; place: Place | 'bed' | null; status: string };
const rank = { accepted: 0, offered: 1, available: 2, upcoming: 4 } as const;
export function suggestions(s: State, max = 4): Suggestion[] {
  const task = dailyTask(s);
  if (task.key !== 'slot:free') return [task];
  const list = entries(s).filter(e => !e.reason && e.status !== 'upcoming').sort((a, b) => (rank[a.status] + (a.def.kind === 'free' ? 1.5 : 0)) - (rank[b.status] + (b.def.kind === 'free' ? 1.5 : 0)));
  const out: Suggestion[] = list.map(e => {
    const where = e.status === 'offered' && e.def.acceptAt ? e.def.acceptAt : e.def.place;
    const label = { accepted: 'ĐÃ NHẬN LỜI', offered: e.def.kind === 'dynamic' ? 'CƠ HỘI MỚI' : 'CÓ THỂ LÀM', available: e.def.kind === 'scheduled' ? 'THEO LỊCH' : 'TỰ DO', upcoming: 'SẮP DIỄN RA' }[e.status];
    return { key: e.def.id, title: e.def.title, detail: (e.reason ? e.reason + ' · ' : '') + PLACE_NAMES[where], place: where, status: label };
  });
  if (s.finance.piggyOwned && spendable(s) >= 5000)
    out.push({ key: 'hint:piggy', title: 'Về nhà bỏ tiền vào ống heo', detail: 'Đang cầm ' + spendable(s).toLocaleString('vi-VN') + 'đ · Nhà của mình', place: 'home', status: 'TIẾT KIỆM' });
  for (const g of s.finance.goals) if (g.status === 'active' && g.id !== 'land') {
    const info = goalInfo(g.id as GoalId);
    if (g.saved >= info.price && info.seller) out.push({ key: 'hint:goal:' + g.id, title: 'Đủ tiền mua ' + info.name + '!', detail: 'Đến ' + PLACE_NAMES[info.seller], place: info.seller, status: 'MỤC TIÊU' });
  }
  if (out.length < 3) out.push({ key: 'free:explore', title: 'Đi dạo khám phá khu phố', detail: 'Chào hỏi hàng xóm, tìm cơ hội mới', place: null, status: 'TỰ DO' });
  if (out.length < 3) out.push({ key: 'free:talk', title: 'Trò chuyện với bác Bình', detail: PLACE_NAMES.binh, place: 'binh', status: 'TỰ DO' });
  if (out.length < 3) out.push({ key: 'free:bench', title: 'Ngồi nghỉ dưới tán cây', detail: 'Ghế công viên phía đông', place: null, status: 'TỰ DO' });
  const seen = new Set<string>();
  return out.filter(x => !seen.has(x.key) && seen.add(x.key)).slice(0, Math.max(1, max));
}

// ---------------- Actions ----------------
export type Result = { ok: boolean; message: string };
const fail = (message: string): Result => ({ ok: false, message });
function remember(s: State, a: ActivityDef, outcome: string) {
  s.life.history.unshift({ day: s.day, minutes: Math.floor(s.minutes), title: a.title, outcome });
  s.life.history = s.life.history.slice(0, 40);
}
export function meet(s: State, who: string) { if (!s.life.met.includes(who)) s.life.met.push(who); }

export function accept(s: State, id: string): Result {
  const a = activity(id), o = todaysOffer(s, id);
  if (!a || !o || o.status !== 'offered' || !inWindow(a, s.minutes)) return fail('Lời đề nghị này không còn nữa.');
  const lock = activityLock(s, id); if (lock) return fail(lock);
  if (!atPlace(s, a.acceptAt ?? a.place)) return fail('Hãy đến gặp ' + (PEOPLE[a.giver] ?? a.giver) + ' để nhận lời.');
  o.status = 'accepted'; meet(s, a.giver);
  return { ok: true, message: 'Đã nhận lời. Đến ' + PLACE_NAMES[a.place] + ' trước ' + clock(a.window[1]) + '.' };
}
export function decline(s: State, id: string): Result {
  const a = activity(id), o = todaysOffer(s, id);
  if (!a || !o || o.status !== 'offered') return fail('Không có lời đề nghị để từ chối.');
  o.status = 'declined'; s.life.lastDone[a.id] = s.day;
  if (a.decline) applyEffect(s, a.decline);
  remember(s, a, 'Đã từ chối');
  return { ok: true, message: 'Đã từ chối lịch sự.' + (a.decline?.rel ? ' ' + (PEOPLE[a.giver] ?? '') + ' hơi tiếc.' : '') };
}

/** Plays an activity at its place. `score` 0..3 comes from the mini-game; `choice` picks an option. */
export function perform(s: State, id: string, score = 3, choice?: number): Result {
  const a = activity(id); if (!a) return fail('Không tìm thấy hoạt động.');
  generateDay(s);
  const e = entryFor(s, a);
  if (!e || e.status === 'upcoming') return fail('Hoạt động này hiện không khả dụng.');
  if (a.acceptAt && e.status !== 'accepted') return fail('Cần nhận lời ' + (PEOPLE[a.giver] ?? '') + ' trước.');
  if (!atPlace(s, a.place)) return fail('Hãy đến ' + PLACE_NAMES[a.place] + ' để làm việc này.');
  if (e.reason) return fail(e.reason);
  if (s.energy < a.energy) return fail('Con mệt quá, cần nghỉ hoặc ăn gì đó trước (cần ' + a.energy + ' năng lượng).');
  let opt: Choice | undefined;
  if (a.choices) { opt = a.choices[choice ?? -1]; if (!opt) return fail('Hãy chọn một phương án.'); const why = opt.requires?.(s); if (why) return fail(why); }
  score = Math.max(0, Math.min(3, Math.round(score)));
  s.energy = clamp(s.energy - a.energy);
  passTime(s, a.duration);
  const parts: string[] = [];
  if (opt) parts.push(opt.apply(s));
  if (a.reward) {
    const scale = a.game === 'none' ? 1 : score / 3;
    const paid = applyEffect(s, a.reward, scale, a.title, PEOPLE[a.giver] ?? a.giver);
    parts.push(a.game === 'none' ? 'Hoàn thành!' : ['Chưa tốt lắm, lần sau cố hơn nhé.', 'Tạm được.', 'Làm khá tốt!', 'Xuất sắc!'][score]);
    if (paid) parts.push('Nhận ' + paid.toLocaleString('vi-VN') + 'đ.');
  }
  if (a.after) { const extra = a.after(s, score); if (extra) parts.push(extra); }
  const L = s.life;
  if (L.today.day !== s.day) L.today = { day: s.day, counts: {} };
  L.today.counts[a.id] = (L.today.counts[a.id] || 0) + 1;
  L.lastDone[a.id] = s.day;
  const o = todaysOffer(s, a.id); if (o) o.status = 'done';
  meet(s, a.giver);
  const message = parts.join(' ');
  remember(s, a, message); log(s, a.title + ': ' + message);
  return { ok: true, message };
}

function fairSale(s: State, price: number) {
  if (!spendCash(s, 20000, 'Hạt và dây làm vòng tay', PLACE_NAMES.market)) return 'Không đủ tiền mua nguyên liệu.';
  const base = price <= 8000 ? 1 : price <= 12000 ? 0.75 : 0.42;
  const skill = 0.7 + s.creativity / 200 + s.social / 300;
  const luck = 0.6 + rand(s.day + ':fair:' + s.name) * 0.8; // demand varies by day
  const sold = Math.max(0, Math.min(5, Math.round(5 * base * skill * luck)));
  const revenue = sold * price;
  if (revenue) earn(s, revenue, `Bán ${sold} vòng tay ở hội chợ`, 'Khách hội chợ');
  const profit = revenue - 20000;
  applyEffect(s, { stats: { creativity: 2, social: 2, xp: 8 }, rel: { teacher: 1 } });
  return `Bán được ${sold}/5 vòng, doanh thu ${revenue.toLocaleString('vi-VN')}đ, chi phí 20.000đ → ${profit >= 0 ? 'lãi' : 'lỗ'} ${Math.abs(profit).toLocaleString('vi-VN')}đ.` +
    (profit < 0 ? ' Giá cao làm ít người mua. Lần sau thử nghiên cứu khách trước nhé.' : '');
}

// ---------------- Schedule consequences (called from the game loop) ----------------
function once(s: State, key: string) {
  const c = s.life.checks; if (c.day !== s.day) { c.day = s.day; c.done = []; }
  if (c.done.includes(key)) return false; c.done.push(key); return true;
}
export function markSchoolStart(s: State) {
  if (s.minutes > h(8, 30) && once(s, 'late')) {
    applyEffect(s, { stats: { discipline: -1 }, rel: { teacher: -1 } });
    notify(s, 'Con đến lớp muộn (' + clock(s.minutes) + '). Cô Mai nhắc nhẹ: lần sau dậy sớm hơn nhé. Kỷ luật −1.');
  }
}
export function tickLife(s: State) {
  generateDay(s);
  markHomeReturn(s);
  syncStory(s);
  const m = s.minutes, L = s.life;
  // Expire offers whose window has passed.
  for (const o of L.offers) {
    if (o.status !== 'offered' && o.status !== 'accepted') continue;
    const a = activity(o.id)!;
    if (o.day < s.day || m >= a.window[1]) {
      const promised = o.status === 'accepted';
      o.status = 'expired';
      if (promised && a.expire) { applyEffect(s, a.expire); notify(s, 'Con đã quên lời hứa: “' + a.title + '”. ' + (PEOPLE[a.giver] ?? '') + ' thất vọng.'); remember(s, a, 'Nhận lời nhưng không làm'); }
    }
  }
  if (s.education.safety.status === 'abducted') return;
  if (m >= h(9) && doneToday(s, 'breakfast') === 0 && once(s, 'breakfast')) {
    applyEffect(s, { stats: { energy: -10, happiness: -3 } });
    notify(s, 'Con bỏ bữa sáng nên bụng đói cồn cào. Năng lượng −10. Hãy mua gì đó ăn ở tạp hóa.');
  }
  if (isSchoolDay(s.day) && m >= h(16) && !s.education.attended.includes(s.day) && s.education.deferredDay!==s.day && once(s, 'school')) {
    applyEffect(s, { stats: { discipline: -3 }, rel: { teacher: -2, mom: -1 } });
    notify(s, 'Hôm nay con không đi học. Cô Mai nhắn cho mẹ. Kỷ luật −3, quan hệ với cô Mai −2.');
    log(s, 'Ngày ' + s.day + ': nghỉ học không phép.');
  }
  if (m >= h(19, 30) && doneToday(s, 'dinner') === 0 && once(s, 'dinner')) {
    applyEffect(s, { stats: { energy: -8, happiness: -5 }, rel: { mom: -1, dad: -1 } });
    notify(s, 'Con không về ăn tối, bố mẹ lo lắng. Hạnh phúc −5. Về nhà sớm hơn vào ngày mai nhé.');
  }
  if (m >= h(21) && L.bedtimeNotice !== s.day) { L.bedtimeNotice = s.day; notify(s, BEDTIME_NOTICE); }
}
/** Parents provide a recovery option even when the child has no spending money. */
export function restAtHome(s:State):Result {
  if(!atPlace(s,'home'))return fail('Về nhà để ăn nhẹ và nghỉ cùng bố mẹ.');
  if(doneToday(s,'recovery')>=2)return fail('Hôm nay đã nghỉ hai lần. Hãy ăn uống theo lịch hoặc đi ngủ từ 21:00.');
  if(s.minutes>=h(21))return fail('Đến giờ ngủ rồi. Hãy nghỉ đến sáng mai.');
  if(s.life.today.day!==s.day)s.life.today={day:s.day,counts:{}};
  s.life.today.counts.recovery=(s.life.today.counts.recovery||0)+1;
  passTime(s,30);s.energy=Math.min(100,s.energy+30);
  return {ok:true,message:'Ăn nhẹ và nghỉ 30 phút ở nhà. Năng lượng +30, không cần tiền riêng.'};
}
export function deferSchool(s:State):Result {
  if(!isSchoolDay(s.day)||s.education.attended.includes(s.day)||s.education.deferredDay===s.day||s.minutes<1050)return fail('Vẫn có thể học hôm nay. Đến lớp hoặc nghỉ lấy sức trước nhé.');
  if(!atPlace(s,'home')&&!atPlace(s,'teacher'))return fail('Gặp mẹ ở nhà hoặc cô Mai để xin học bù.');
  s.education.deferredDay=s.day;s.education.active=false;markHomeReturn(s);
  log(s,'Đã báo người lớn: xin học bù sau ngày '+s.day+'.');
  return {ok:true,message:'Đã báo với người lớn. Ngày mai tiếp tục học; hôm nay không nhận thưởng buổi học.'};
}
export function postpone(s:State,id:string):Result {
  const o=todaysOffer(s,id),a=activity(id);
  if(!o||!a||o.status!=='accepted'||s.minutes>=a.window[1])return fail('Việc này đã hết hạn hoặc chưa nhận.');
  if(!atPlace(s,'home')&&!atPlace(s,a.acceptAt??a.place))return fail('Về nhà nhờ bố mẹ báo giúp, hoặc đến nơi nhận việc để xin hoãn.');
  o.status='postponed';remember(s,a,'Đã xin hoãn sang ngày mai');
  return {ok:true,message:'Đã báo xin hoãn. Việc sẽ được đề nghị lại ngày mai, không phạt thất hứa.'};
}
/** Applied once when going to bed. */
export function bedtimeReview(s: State) {
  if (isSchoolDay(s.day) && s.education.attended.includes(s.day) && doneToday(s, 'homework') === 0 && once(s, 'homework')) {
    applyEffect(s, { stats: { discipline: -1 } });
    log(s, 'Quên làm bài tập tối ngày ' + s.day + '.');
    return 'Hôm nay con quên làm bài tập buổi tối (Kỷ luật −1).';
  }
  return '';
}
