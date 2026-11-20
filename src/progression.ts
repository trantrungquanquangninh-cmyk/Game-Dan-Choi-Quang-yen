import type {State} from './state';
import {atPlace, type Place} from './places';
import {earn} from './finance';
import {record} from './family';

export type Chapter = {id:string; day:number; title:string; text:string; place:Place};
export const CHAPTERS:Chapter[] = [
  {id:'first-class',day:1,title:'Ngày đầu đến lớp',text:'Nhờ mẹ đưa tới trường, học đủ các môn rồi trở về nhà.',place:'school'},
  {id:'first-friend',day:2,title:'Người bạn đầu tiên',text:'Tìm Nam ở sân chơi, cùng chơi bắt nhịp để làm quen.',place:'nam'},
  {id:'first-errand',day:3,title:'Một việc nhỏ cho mẹ',text:'Nhận tiền từ mẹ, mua sữa và bánh mì rồi mang đồ cùng tiền thừa về.',place:'mom'},
  {id:'birthday-card',day:4,title:'Tấm thiệp của cả nhà',text:'Về nhà viết lời chúc để chuẩn bị sinh nhật và mời Nam tới chơi.',place:'home'},
  {id:'fair-preparation',day:5,title:'Cả nhà chuẩn bị hội chợ',text:'Giúp mẹ chọn màu trang trí và giúp bố tính số đồ dùng cho gian hàng.',place:'mom'},
  {id:'family-fair',day:6,title:'Gian hàng nhỏ ở trường',text:'Mang đồ đã chuẩn bị đến hội chợ, cùng Nam tính tiền cho khách.',place:'school'},
  {id:'birthday',day:7,title:'Sinh nhật và khu vườn mới',text:'Về nhà xem lại kỷ niệm, đón sinh nhật và nhận hạt giống đầu tiên.',place:'home'},
];
export type DaySummary={day:number; highlights:string[]; relationships:string[]; tomorrow:string};
export type Story={completed:Record<string,number>; flags:string[]; summaries:DaySummary[]; seenSummaryDay:number; baseline:{day:number;relationships:Record<string,number>}};
export const freshStory=():Story=>({completed:{},flags:[],summaries:[],seenSummaryDay:0,baseline:{day:0,relationships:{}}});
export function restoreStory(raw:unknown):Story {
  const base=freshStory();if(!raw||typeof raw!=='object')return base;
  const v=raw as Partial<Story>;
  return {...base,completed:Object.fromEntries(CHAPTERS.filter(c=>Number.isSafeInteger(v.completed?.[c.id])&&v.completed![c.id]>0).map(c=>[c.id,v.completed![c.id]])),flags:Array.isArray(v.flags)?v.flags.filter(f=>typeof f==='string'):[],summaries:Array.isArray(v.summaries)?v.summaries.filter(d=>Number.isSafeInteger(d?.day)&&Array.isArray(d.highlights)&&Array.isArray(d.relationships)&&typeof d.tomorrow==='string').slice(0,14):[],seenSummaryDay:Number(v.seenSummaryDay)||0,baseline:v.baseline&&Number.isSafeInteger(v.baseline.day)&&v.baseline.relationships&&typeof v.baseline.relationships==='object'?v.baseline:base.baseline};
}
export function syncStory(s:State) {
  if(s.story.baseline.day!==s.day)s.story.baseline={day:s.day,relationships:{...s.relationships}};
  const evidence:Record<string,boolean>={
    'first-class':s.education.attended.length>0,'first-friend':s.quests.friend===2,'first-errand':s.quests.shopping===2,
    'birthday-card':s.story.flags.includes('card'),'fair-preparation':s.story.flags.includes('mom-prep')&&s.story.flags.includes('dad-prep'),
    'family-fair':s.story.flags.includes('fair'),'birthday':s.story.flags.includes('birthday'),
  };
  for(const chapter of CHAPTERS){if(s.story.completed[chapter.id])continue;if(chapter.day>s.day||!evidence[chapter.id])break;s.story.completed[chapter.id]=s.day;}
}
export function currentChapter(s:State){return CHAPTERS.find(c=>!s.story.completed[c.id])??null;}
export function chapterPlace(s:State,chapter:Chapter):Place {
  if(chapter.id==='first-errand'&&s.quests.shopping===1)return s.inventory.milk&&s.inventory.bread?'mom':'shop';
  if(chapter.id==='fair-preparation'&&s.story.flags.includes('mom-prep'))return 'dad';
  return chapter.place;
}
export type StoryAction='card'|'mom-prep'|'dad-prep'|'fair'|'birthday';
export const STORY_QUESTIONS:Record<Exclude<StoryAction,'birthday'>,{question:string;options:string[];answer:number;explanation:string}>={
  card:{question:'Viết lời nào trên thiệp để mời Nam tới sinh nhật?',options:['Nam ơi, mời bạn đến sinh nhật mình nhé!','Bạn phải mang quà mới được đến.','Mình không muốn gặp bạn.'],answer:0,explanation:'Lời mời thân thiện giúp bạn cảm thấy được chào đón. Không cần yêu cầu quà.'},
  'mom-prep':{question:'Mẹ có 2 dải cờ đỏ và 2 dải cờ vàng. Con xếp xen kẽ thế nào?',options:['Đỏ – đỏ – vàng – vàng','Đỏ – vàng – đỏ – vàng','Vàng – vàng – đỏ – đỏ'],answer:1,explanation:'Xen kẽ là đổi màu sau mỗi dải: đỏ, vàng, đỏ, vàng.'},
  'dad-prep':{question:'Mỗi bàn cần 2 ghế. Có 3 bàn thì cần bao nhiêu ghế?',options:['5 ghế','3 ghế','6 ghế'],answer:2,explanation:'2 + 2 + 2 = 6. Con đã giúp bố chuẩn bị đủ ghế.'},
  fair:{question:'Khách mua thiệp 5.000đ, đưa 10.000đ. Cần trả lại bao nhiêu?',options:['2.000đ','5.000đ','10.000đ'],answer:1,explanation:'10.000 − 5.000 = 5.000đ. Nam cùng con kiểm tra tiền thừa.'},
};
export function storyAction(s:State,action:StoryAction,answer?:number):{ok:boolean;message:string} {
  syncStory(s);const c=currentChapter(s);
  const chapterOf:Record<StoryAction,string>={card:'birthday-card','mom-prep':'fair-preparation','dad-prep':'fair-preparation',fair:'family-fair',birthday:'birthday'};
  if(!c||c.id!==chapterOf[action]||s.day<c.day||s.story.flags.includes(action))return {ok:false,message:'Bước này chưa mở hoặc đã hoàn thành.'};
  if(action==='dad-prep'&&!s.story.flags.includes('mom-prep'))return {ok:false,message:'Chuẩn bị màu trang trí cùng mẹ trước, rồi ghé bố nhé.'};
  if(s.day%7!==0&&(!s.education.attended.includes(s.day)||s.life.returnedHomeDay!==s.day))return {ok:false,message:'Học xong và về nhà trước nhé.'};
  if(s.quests.shopping===1||s.life.offers.some(o=>o.day===s.day&&o.status==='accepted'))return {ok:false,message:'Hoàn thành hoặc xin hoãn việc đã nhận trước nhé.'};
  const place:Place=action==='dad-prep'?'dad':action==='fair'?'school':'home';
  if(!atPlace(s,place))return {ok:false,message:'Hãy đến đúng nơi được chỉ trên nhiệm vụ.'};
  if(s.minutes>=21*60)return {ok:false,message:'Đã muộn rồi. Ngủ và tiếp tục câu chuyện ngày mai nhé.'};
  if(action!=='birthday'&&answer!==STORY_QUESTIONS[action].answer)return {ok:false,message:STORY_QUESTIONS[action].explanation};
  s.story.flags.push(action);s.minutes=Math.min(1259,s.minutes+15);s.xp+=5;s.happiness=Math.min(100,s.happiness+3);
  if(action==='card')s.relationships.nam=(s.relationships.nam||0)+2;
  if(action==='mom-prep'||action==='dad-prep'){const who=action==='mom-prep'?'mom':'dad';s.relationships[who]=(s.relationships[who]||0)+2;}
  if(action==='fair'){earn(s,10000,'Cùng gia đình bán thiệp tại hội chợ','Khách hội chợ');s.relationships.nam=(s.relationships.nam||0)+3;}
  if(action==='birthday'){
    const alreadyFour=s.age>=4;s.age=Math.max(4,s.age);const gift=alreadyFour?0:Math.min(20000,s.family.cash);
    if(gift){record(s.family,s.day,'Quà sinh nhật 4 tuổi',-gift,'transfer');earn(s,gift,'Quà sinh nhật 4 tuổi','Bố mẹ');}
    for(const id of ['memory-album','garden'])if(!s.life.unlocked.includes(id))s.life.unlocked.push(id);
  }
  syncStory(s);return {ok:true,message:action==='birthday'?'Chúc mừng sinh nhật! Đã mở sổ kỷ niệm và trồng cây cùng bác Bình.':action==='fair'?'Cả nhà bán được thiệp! Con nhận 10.000đ và có thêm một kỷ niệm với Nam.':'Đã hoàn thành: '+(action==='card'?'viết thiệp':action==='mom-prep'?'trang trí cùng mẹ':'chuẩn bị cùng bố')+'.'};
}
export function daySummary(s:State):DaySummary {
  const highlights=[...CHAPTERS.filter(c=>s.story.completed[c.id]===s.day).map(c=>c.title),...s.life.history.filter(h=>h.day===s.day).map(h=>h.title)];
  if(s.education.attended.includes(s.day))highlights.unshift('Hoàn thành buổi học 5 môn');
  const relationships=Object.entries(s.relationships).flatMap(([id,value])=>{const delta=value-(s.story.baseline.relationships[id]||0);return delta?[`${id}: ${delta>0?'+':''}${delta}`]:[];});
  const next=currentChapter(s);
  return {day:s.day,highlights:[...new Set(highlights)].slice(0,6),relationships,tomorrow:next?(next.day>s.day?'Ngày '+next.day+': ':'Tiếp tục: ')+next.title:'Đã xong tuần tuổi thơ! Ngày mai chăm cây và khám phá cùng bạn bè.'};
}
export function archiveDay(s:State){syncStory(s);if(!s.story.summaries.some(d=>d.day===s.day))s.story.summaries.unshift(daySummary(s));s.story.summaries=s.story.summaries.slice(0,14);}
