import type {State} from './state';
import {dailyTask,entries} from './activities';
import {CHAPTERS,chapterPlace} from './progression';
import type {Place} from './places';

export function legacyQuestLock(s:State,id:'friend'|'shopping'):string|null {
  const chapter=CHAPTERS.find(c=>!s.story.completed[c.id]);
  const required=id==='friend'?'first-friend':'first-errand';
  if(s.quests[id]>0)return null;
  if(!chapter||chapter.id===required&&s.day>=chapter.day)return null;
  return id==='friend'?'Làm quen Nam trong câu chuyện ngày 2, sau ngày đầu đi học.':'Mẹ sẽ nhờ mua đồ trong câu chuyện ngày 3, sau khi con đã làm quen Nam.';
}

export type MissionRow={id:string;title:string;detail:string;status:'current'|'done'|'locked'|'available';place:Place|'bed'|null};
/** One journal projection for the HUD's task, story chapters and local activities.
 * Existing quest flags remain compatible with older saved games. */
export function missionJournal(s:State):MissionRow[]{
  const active=dailyTask(s);
  const rows:MissionRow[]=[{id:active.key,title:active.title,detail:active.detail,status:'current',place:active.place}];
  for(const c of CHAPTERS){
    if(c.id==='first-class'&&!s.story.completed[c.id]&&active.key==='slot:school')continue;
    const id='story:'+c.id;if(rows.some(r=>r.id===id)||(c.id==='first-errand'&&active.key==='shopping'))continue;
    rows.push({id,title:'Ngày '+c.day+' · '+c.title,detail:s.story.completed[c.id]?'Hoàn thành ngày '+s.story.completed[c.id]:c.text,status:s.story.completed[c.id]?'done':'locked',place:chapterPlace(s,c)});
  }
  for(const e of entries(s).filter(e=>!e.reason&&e.status!=='upcoming')){
    if(rows.some(r=>r.id===e.def.id))continue;
    rows.push({id:e.def.id,title:e.def.title,detail:e.status==='accepted'?'Đã nhận lời — làm xong hoặc xin hoãn.':e.def.text,status:'available',place:e.status==='offered'&&e.def.acceptAt?e.def.acceptAt:e.def.place});
  }
  return rows;
}
