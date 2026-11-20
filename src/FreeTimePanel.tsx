import React from 'react';
import {state} from './state';
import {PASTIMES,freeTimeLock,spendFreeTime,windDown,doneToday} from './activities';
import {BEDTIME,canSleep,clock} from './clock';
import {guide} from './LifePanel';

type Props={onAction:(fn:()=>void)=>void;notice:(text:string)=>void;onBed:()=>void};
/** A visible way to fill downtime; all buttons use the same in-game time rules. */
export function FreeTimePanel({onAction,notice,onBed}:Props) {
  const home=state.inside&&state.room==='home';
  if(canSleep(state.minutes))return <section className="free-time-panel"><h3>Đã đến giờ nghỉ ngơi</h3><p>Bây giờ là {clock(state.minutes)}. Ngủ để bắt đầu ngày mới.</p><button className="primary wide" onClick={()=>home?onBed():guide('bed',notice)}>{home?'Đi ngủ':'Chỉ đường về nhà ngủ'}</button></section>;
  if(state.minutes<390)return null;
  const reason=freeTimeLock(state),remaining=Math.max(0,Math.ceil(BEDTIME-state.minutes));
  const run=(fn:()=>{ok:boolean;message:string})=>onAction(()=>notice(fn().message));
  return <section className="free-time-panel"><small>KHÔNG CẦN ĐỨNG CHỜ ĐỒNG HỒ</small><h3>{state.minutes>=1080?'Sinh hoạt buổi tối':'Chơi tự do khi đã xong việc'}</h3>
    <p>{state.minutes>=1080?`Còn ${remaining} phút đến 21:00. Chọn sinh hoạt nhẹ hoặc cùng gia đình chuẩn bị đi ngủ.`:'Có thể lặp lại các hoạt động dưới đây. Thời gian vẫn trôi theo sinh hoạt, không cần đứng chờ.'}</p>
    {!home?<button className="wide" onClick={()=>guide('home',notice)}>Về nhà sinh hoạt cùng gia đình</button>:<>
      {reason&&<p className="finance-alert">{reason}</p>}
      <div className="free-time-options">{PASTIMES.map(option=><button key={option.id} disabled={!!reason} onClick={()=>run(()=>spendFreeTime(state,option.id))}>{option.title}<small>{Math.ceil(Math.min(option.minutes,remaining))} phút · miễn phí</small></button>)}</div>
      {state.minutes>=1080&&<>
        {(!doneToday(state,'dinner')||!doneToday(state,'homework'))&&<p className="muted-inline">{!doneToday(state,'dinner')?'Bữa tối chưa hoàn thành. ':''}{!doneToday(state,'homework')?'Bài tập chưa hoàn thành. ':''}Có thể làm ở bàn ăn trước; sinh hoạt tự do không hoàn thành thay các việc này.</p>}
        <button className="primary wide" disabled={!!reason} onClick={()=>run(()=>windDown(state))}>Sinh hoạt cùng gia đình đến 21:00 · {remaining} phút</button>
        <p className="muted-inline">Trò chuyện, dọn đồ chơi, vệ sinh và chuẩn bị đồ cho ngày mai. Sau đó con tự chọn đi ngủ.</p>
      </>}
    </>}
  </section>;
}
