// Game Time Manager rules. Everything reads the in-game clock (state.minutes),
// never the real system time.
export const DAY_MINUTES = 24 * 60;
export const BEDTIME = 21 * 60;
export const WAKE_TIME = 6 * 60 + 30;
const h = (hh: number, mm = 0) => hh * 60 + mm;

/** Sleeping is allowed only from 21:00 to 23:59 of the current day. */
export const canSleep = (minutes: number) => minutes >= BEDTIME && minutes < DAY_MINUTES;

export const clock = (minutes: number) => {
  const t = Math.floor(((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES);
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
};

export const isSchoolDay = (day: number) => day % 7 !== 0;

export const sleepRefusal = (minutes: number) =>
  `Chưa đến giờ ngủ đâu! Bây giờ mới là ${clock(minutes)}. ${minutes>=18*60?'Có thể sinh hoạt cùng gia đình đến 21:00, rồi đi ngủ.':'Mở Hoạt động (H) để chọn việc hoặc chơi tự do ở nhà nhé!'}`;
export const BEDTIME_NOTICE = 'Đã đến giờ nghỉ ngơi. Bạn có thể về nhà đi ngủ để bắt đầu một ngày mới!';

export type Slot = { start: number; end: number; label: string; activity?: string; place?: string; note?: string };

export const SCHOOL_DAY: Slot[] = [
  { start: h(6, 30), end: h(7), label: 'Thức dậy', activity: 'wake', place: 'home' },
  { start: h(7), end: h(7, 30), label: 'Ăn sáng và chuẩn bị đi học', activity: 'breakfast', place: 'home' },
  { start: h(7, 30), end: h(8), label: 'Đến trường', place: 'school', note: 'Nhờ mẹ đưa đến trường' },
  { start: h(8), end: h(11, 30), label: 'Học: Toán · Anh · Văn · Sử · Địa', place: 'classroom', note: 'Học đủ 5 môn rồi về nhà' },
  { start: h(11, 30), end: h(13), label: 'Ăn trưa ở lớp, mẹ đón về', activity: 'lunch' },
  { start: h(13), end: h(18), label: 'Hoạt động tự do sau giờ học', note: 'Bạn bè, hàng xóm, cửa hàng có thể cần bạn' },
  { start: h(18), end: h(19), label: 'Ăn tối, sinh hoạt gia đình', activity: 'dinner', place: 'home' },
  { start: h(19), end: h(21), label: 'Làm bài tập, khám phá, giao tiếp', activity: 'homework', place: 'home' },
  { start: h(21), end: DAY_MINUTES, label: 'Có thể về nhà đi ngủ', place: 'bed' },
];

export const OFF_DAY: Slot[] = [
  { start: h(6, 30), end: h(7), label: 'Thức dậy', activity: 'wake', place: 'home' },
  { start: h(7), end: h(7, 30), label: 'Ăn sáng cùng gia đình', activity: 'breakfast', place: 'home' },
  { start: h(7, 30), end: h(11), label: 'Sinh hoạt cộng đồng ở công viên', activity: 'cleanup', place: 'park' },
  { start: h(11, 30), end: h(13), label: 'Ăn trưa, nghỉ ngơi', activity: 'lunch', place: 'home' },
  { start: h(13), end: h(18), label: 'Hoạt động tự do ngày nghỉ' },
  { start: h(18), end: h(19), label: 'Ăn tối, sinh hoạt gia đình', activity: 'dinner', place: 'home' },
  { start: h(19), end: h(21), label: 'Đọc truyện, chơi cùng gia đình', activity: 'homework', place: 'home' },
  { start: h(21), end: DAY_MINUTES, label: 'Có thể về nhà đi ngủ', place: 'bed' },
];

export const scheduleFor = (day: number) => (isSchoolDay(day) ? SCHOOL_DAY : OFF_DAY);

export function slotAt(day: number, minutes: number) {
  const list = scheduleFor(day);
  return {
    current: list.find(s => minutes >= s.start && minutes < s.end) ?? null,
    next: list.find(s => s.start > minutes) ?? null,
  };
}
