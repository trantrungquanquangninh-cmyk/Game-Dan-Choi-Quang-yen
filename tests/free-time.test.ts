import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,start,state,sleep,save,load,acceptShopping} from '../src/state';
import {spendFreeTime,windDown,dailyTask,doneToday,postponeShopping,generateDay} from '../src/activities';
import {canSleep} from '../src/clock';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{setItem:(k:string,v:string)=>storage.set(k,v),getItem:(k:string)=>storage.get(k)??null},configurable:true});
beforeEach(()=>{
  storage.clear();start(fresh());state.education.attended.push(state.day);state.life.returnedHomeDay=state.day;
  state.story.completed={'first-class':1};
  state.life.today={day:1,counts:{breakfast:1,dinner:1,homework:1}};
});
test('19:36 with all activities done offers an evening routine and reaches 21:00 without advancing a day',()=>{
  state.minutes=19*60+36;assert.equal(dailyTask(state).key,'slot:evening');assert.match(dailyTask(state).detail,/84/);
  assert.equal(canSleep(state.minutes),false);assert.equal(windDown(state).ok,true);
  assert.equal(state.minutes,1260);assert.equal(state.day,1);assert.equal(canSleep(state.minutes),true);assert.equal(dailyTask(state).key,'bed');
  assert.equal(doneToday(state,'wind-down'),1);assert.equal(windDown(state).ok,false);
  assert.equal(sleep(),true);assert.equal(state.day,2);assert.ok(state.story.summaries[0].highlights.includes('Sinh hoạt buổi tối cùng gia đình'));
});
test('quiet activities can repeat indefinitely before bedtime without farming rewards',()=>{
  state.minutes=16*60;const before={xp:state.xp,money:state.money,happiness:state.happiness,energy:state.energy,creativity:state.creativity};
  for(let i=0;i<15;i++)assert.equal(spendFreeTime(state,'draw').ok,true);
  assert.equal(state.minutes,1260);assert.equal(doneToday(state,'leisure:draw'),15);
  assert.deepEqual({xp:state.xp,money:state.money,happiness:state.happiness,energy:state.energy,creativity:state.creativity},before);
  assert.equal(spendFreeTime(state,'draw').ok,false);
});
test('a final short pastime stops exactly at bedtime rather than overrunning',()=>{
  state.minutes=1258.5;assert.equal(spendFreeTime(state,'tell-story').ok,true);assert.equal(state.minutes,1260);
  assert.equal(state.day,1);
});
test('downtime respects location, school, accepted promises and the evening start time',()=>{
  state.minutes=17*60+59;assert.equal(windDown(state).ok,false);
  state.minutes=19*60;state.inside=false;assert.equal(windDown(state).ok,false);
  state.inside=true;state.room='classroom';assert.equal(windDown(state).ok,false);
  state.room='home';state.education.attended=[];assert.equal(spendFreeTime(state,'draw').ok,false);
  state.education.attended=[1];state.minutes=16*60;generateDay(state);state.life.offers=[{id:'mom-errand',day:1,status:'accepted'}];
  assert.equal(spendFreeTime(state,'draw').ok,false);state.education.safety.status='abducted';assert.equal(windDown(state).ok,false);
});
test('evening suggestions point to dinner and homework before winding down',()=>{
  state.minutes=18*60;state.life.today.counts.dinner=0;assert.match(dailyTask(state).title,/Ăn tối/);
  state.minutes=19*60+36;state.life.today.counts.homework=0;assert.match(dailyTask(state).title,/bài tập/);
  state.life.today.counts.homework=1;assert.match(dailyTask(state).title,/giờ ngủ/);
});
test('winding down does not complete unfinished dinner, homework, or tomorrow story chapters',()=>{
  state.minutes=19*60+36;state.life.today.counts.dinner=0;state.life.today.counts.homework=0;
  state.story.completed={'first-class':1};const xp=state.xp;
  assert.equal(windDown(state).ok,true);assert.equal(doneToday(state,'dinner'),0);assert.equal(doneToday(state,'homework'),0);
  assert.equal(state.story.completed['first-friend'],undefined);assert.equal(state.xp,xp);
  assert.ok(state.life.notices.some(n=>n.includes('ăn tối')));
});
test('a closed shop can be reported to mum; advance and inventory remain reserved and the errand resumes tomorrow',()=>{
  state.minutes=20*60;assert.equal(acceptShopping(),true);const cash=state.money,familyCash=state.family.cash;
  assert.equal(dailyTask(state).place,'mom');assert.equal(windDown(state).ok,false);
  assert.equal(postponeShopping(state).ok,true);assert.equal(postponeShopping(state).ok,false);
  assert.equal(state.money,cash);assert.equal(state.family.cash,familyCash);assert.equal(state.family.advance,20000);
  assert.equal(state.quests.shopping,1);assert.equal(windDown(state).ok,true);save();start(load()!);
  assert.equal(doneToday(state,'shopping-postponed'),1);assert.equal(sleep(),true);
  state.education.attended.push(2);state.life.returnedHomeDay=2;
  assert.equal(dailyTask(state).key,'shopping');assert.equal(doneToday(state,'shopping-postponed'),0);assert.equal(acceptShopping(),false);
});
test('when daytime activities run out, the HUD offers repeatable free time rather than an empty list',()=>{
  state.minutes=17*60+59;state.life.generatedDay=state.day;state.life.offers=[];
  state.life.today.counts['park-play']=2;state.life.today.counts['market-explore']=1;state.life.today.counts.chores=1;
  assert.equal(dailyTask(state).key,'slot:leisure');assert.equal(dailyTask(state).place,'home');
  assert.equal(spendFreeTime(state,'quiet-play').ok,true);
});
