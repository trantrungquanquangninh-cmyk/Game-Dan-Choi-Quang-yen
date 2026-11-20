import React,{useState} from 'react';
import {state,change} from './state';
import {CHAPTERS,currentChapter,chapterPlace,STORY_QUESTIONS,storyAction,daySummary,type StoryAction} from './progression';
import {missionJournal} from './missions';
import {atPlace,PEOPLE,type Place} from './places';
import {dailyLock,restAtHome,deferSchool,postpone,postponeShopping,doneToday} from './activities';
import {guide} from './LifePanel';

type Props={onAction:(fn:()=>void)=>void;notice:(text:string)=>void};
export function StoryAtPlace({place,onAction,notice}:Props&{place:Place}){
  const [feedback,setFeedback]=useState('');const c=currentChapter(state);
  if(!c||state.day<c.day||!atPlace(state,place)||chapterPlace(state,c)!==place&&!(place==='mom'&&chapterPlace(state,c)==='home'))return null;
  let action:StoryAction|null=null;
  if(c.id==='birthday-card')action='card';
  if(c.id==='fair-preparation')action=state.story.flags.includes('mom-prep')?'dad-prep':'mom-prep';
  if(c.id==='family-fair')action='fair';if(c.id==='birthday')action='birthday';
  const lock=dailyLock(state);
  if(!action)return <section className="story-card"><small>CÂU CHUYỆN · {c.day}/7</small><h3>{c.title}</h3><p>{c.text}</p></section>;
  const selected=action;const question=action!=='birthday'?STORY_QUESTIONS[action]:null;
  const run=(answer?:number)=>onAction(()=>{const result=storyAction(state,selected,answer);setFeedback(result.message);notice(result.message)});
  return <section className="story-card"><small>CÂU CHUYỆN · {c.day}/7</small><h3>{c.title}</h3><p>{c.text}</p>{lock?<p className="finance-alert">{lock}</p>:question?<><p>{question.question}</p><div className="choices">{question.options.map((option,i)=><button key={option} onClick={()=>run(i)}>{option}</button>)}</div></>:<><p>Cả nhà và Nam cùng chúc mừng con. Mở sổ kỷ niệm và chăm vườn cùng bác Bình từ hôm nay!</p><button className="primary wide" onClick={()=>run()}>Thổi nến · bước sang tuổi 4</button></>}{feedback&&<p role="status">{feedback}</p>}</section>;
}
export function MissionJournal({notice}:Pick<Props,'notice'>){return <div className="mission-journal"><h3>Hành trình tuổi thơ · {Object.keys(state.story.completed).length}/7</h3>{missionJournal(state).map(row=><article className={'quest mission-'+row.status} key={row.id}><small>{{current:'ĐANG LÀM',done:'ĐÃ XONG',locked:'SẮP TỚI',available:'CÓ THỂ CHỌN'}[row.status]}</small><h3>{row.title}</h3><p>{row.detail}</p>{row.status!=='locked'&&row.status!=='done'&&row.place&&<button onClick={()=>guide(row.place,notice)}>Chỉ đường</button>}</article>)}</div>}
export function RecoveryPanel({onAction,notice}:Props){
  const home=state.inside&&state.room==='home',school=state.inside&&state.room==='classroom';
  const accepted=state.life.offers.filter(o=>o.day===state.day&&o.status==='accepted');
  const run=(fn:()=>{ok:boolean;message:string})=>onAction(()=>notice(fn().message));
  return <section className="recovery-panel"><details><summary>Cần nghỉ hoặc xin hoãn?</summary>{home?<button className="wide" onClick={()=>run(()=>restAtHome(state))}>Ăn nhẹ và nghỉ 30 phút · miễn phí</button>:<button onClick={()=>guide('home',notice)}>Chỉ đường về nhà nghỉ</button>}{(home||school)&&state.minutes>=1050&&!state.education.attended.includes(state.day)&&state.day%7!==0&&<button className="wide" onClick={()=>run(()=>deferSchool(state))}>Báo người lớn · xin học bù ngày mai</button>}{home&&state.quests.shopping===1&&!doneToday(state,'shopping-postponed')&&<button className="wide" onClick={()=>run(()=>postponeShopping(state))}>{'Xin m\u1eb9 ti\u1ebfp t\u1ee5c mua \u0111\u1ed3 v\u00e0o s\u00e1ng mai'}</button>}{accepted.map(o=><button key={o.id} className="wide" onClick={()=>run(()=>postpone(state,o.id))}>Xin hoãn việc đã nhận sang mai</button>)}</details></section>
}
export function DayReview({previous=false}:{previous?:boolean}){
  const review=previous?state.story.summaries[0]:daySummary(state);
  if(!review)return null;
  return <section className="story-card"><small>TỔNG KẾT NGÀY {review.day}</small><h3>Hôm nay con đã làm được gì?</h3>{review.highlights.length?<ul>{review.highlights.map(h=><li key={h}>{h}</li>)}</ul>:<p>Một ngày khám phá. Những việc chưa xong có thể tiếp tục.</p>}<p>{review.relationships.length?'Quan hệ: '+review.relationships.map(r=>{const [id,delta]=r.split(': ');return (PEOPLE[id]??id)+' '+delta}).join(' · '):'Một ngày bên những người thân quen.'}</p><p><b>Ngày mai:</b> {review.tomorrow}</p></section>
}
export function MorningReview({onAction}:Pick<Props,'onAction'>){const last=state.story.summaries[0];if(!last||last.day<=state.story.seenSummaryDay)return null;return <div className="overlay"><section className="modal"><div className="modal-content"><DayReview previous/><button className="primary wide" onClick={()=>onAction(()=>change(s=>{s.story.seenSummaryDay=last.day}))}>Bắt đầu ngày {state.day}</button></div></section></div>}
export function MemoryAlbum(){if(!state.life.unlocked.includes('memory-album'))return null;return <section className="story-card"><h3>Sổ kỷ niệm</h3>{CHAPTERS.filter(c=>state.story.completed[c.id]).map(c=><p key={c.id}>✓ {c.title} · ngày {state.story.completed[c.id]}</p>)}{state.life.unlocked.includes('garden')&&<p>🌱 Đã mở chăm vườn cùng bác Bình — mỗi ngày có một lượt.</p>}</section>}
