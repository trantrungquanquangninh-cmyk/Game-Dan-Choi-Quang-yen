// Real interaction points in the world. Activities and purchases are validated
// against the player's actual location, so money is tied to moving around town.
import { npcData } from './data';
import { doorOf, SHOP_DOOR, SCHOOL_DOOR, HOME_DOOR } from './navigation';
import { landmarks } from './mapLayout';

export type Place = 'home' | 'classroom' | 'shop' | 'school' | 'mom' | 'dad' | 'nam' | 'binh' | 'teacher' | 'cafe' | 'neighbor' | 'market' | 'park';
type Where = { inside: boolean; room: 'home' | 'classroom'; x: number; y: number };

export const PLACE_NAMES: Record<Place, string> = {
  home: 'Nhà của mình', classroom: 'Lớp học', shop: 'Tạp hóa cô Lan', school: 'Cổng trường', mom: 'Mẹ (trong nhà)',
  dad: 'Bàn mộc của bố', nam: 'Sân chơi của Nam', binh: 'Vườn bác Bình', teacher: 'Cô Mai', cafe: 'Cà phê đầu ngõ',
  neighbor: 'Nhà cô Hằng hàng xóm', market: 'Chợ Rừng', park: 'Công viên Quảng Yên',
};
/** Characters attached to places that do not have their own sprite yet. */
export const PEOPLE: Record<string, string> = {
  mom: 'Mẹ', dad: 'Bố', lan: 'Cô Lan', nam: 'Bạn Nam', teacher: 'Cô Mai', binh: 'Bác Bình',
  hang: 'Cô Hằng (hàng xóm)', tu: 'Anh Tú (quán cà phê)', 'ba-tu': 'Bà Tư (chợ)', 'ong-ba': 'Ông bà',
};

const npc = (id: string) => { const n = npcData.find(n => n.id === id)!; return { x: n.x, y: n.y }; };
const landmark = (id: string) => { const p = landmarks.find(p => p.id === id)!; return { x: p.x, y: p.y }; };

export function placePoint(place: Place): { x: number; y: number; room: 'home' | 'classroom' | null } {
  switch (place) {
    case 'home': case 'mom': return { ...HOME_DOOR, room: 'home' };
    case 'classroom': return { ...SCHOOL_DOOR, room: 'classroom' };
    case 'shop': return { ...SHOP_DOOR, room: null };
    case 'school': case 'teacher': return { ...SCHOOL_DOOR, room: null };
    case 'cafe': return { ...doorOf('cafe'), room: null };
    case 'neighbor': return { ...doorOf('house3'), room: null };
    case 'market': return { ...landmark('rung-market'), room: null };
    case 'park': return { ...landmark('quang-yen-park'), room: null };
    default: return { ...npc(place), room: null };
  }
}

export const NEAR_DISTANCE = 170;
export function atPlace(s: Where, place: Place) {
  if (place === 'home' || place === 'mom') return s.inside && s.room === 'home';
  if (place === 'classroom') return s.inside && s.room === 'classroom';
  if (place === 'teacher' && s.inside && s.room === 'classroom') return true;
  if (s.inside) return false;
  const p = placePoint(place);
  return Math.hypot(s.x - p.x, s.y - p.y) <= NEAR_DISTANCE;
}

/** Maps an interaction panel id (from the Phaser scene) to an activity place. */
export function placeOfPanel(panel: string, s: Where): Place | null {
  if (panel === 'shop' || panel === 'lan') return 'shop';
  if (panel === 'teacher' || panel === 'school') return s.inside && s.room === 'classroom' ? 'classroom' : 'school';
  if (['mom', 'dad', 'nam', 'binh'].includes(panel)) return panel as Place;
  if (panel === 'landmark:rung-market') return 'market';
  if (panel === 'landmark:quang-yen-park') return 'park';
  if (panel === 'place:home') return 'home';
  if (panel === 'place:cafe') return 'cafe';
  if (panel === 'place:neighbor') return 'neighbor';
  return null;
}
