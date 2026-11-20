import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {state,fresh,start,sleep,complete,acceptShopping,buy,save,load} from '../src/state';
import {CHAPTERS,currentChapter,storyAction,syncStory,STORY_QUESTIONS,restoreStory} from '../src/progression';
import {beginSchool,answerSchool} from '../src/educationActions';
import {currentLesson,SUBJECTS} from '../src/education';
import {markHomeReturn,dailyTask,perform,restAtHome,deferSchool,schoolLock,postpone,generateDay,tickLife,rollMidnight,canLeaveSchool} from '../src/activities';
import {placePoint,type Place} from '../src/places';
import {missionJournal} from '../src/missions';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{setItem:(k:string,v:string)=>storage.set(k,v),getItem:(k:string)=>storage.get(k)??null},configurable:true});
beforeEach(()=>{storage.clear();start(fresh());});
function go(place:Place){if(place==='home'||place==='mom'){state.inside=true;state.room='home';markHomeReturn(state);}else if(place==='classroom'){state.inside=true;state.room='classroom';}else{state.inside=false;Object.assign(state,placePoint(place));}}
function school(){go('classroom');state.minutes=480;assert.equal(beginSchool(),true);for(let i=0;i<SUBJECTS.length;i++)answerSchool(currentLesson(state.day,i,state.age).answer);go('home');syncStory(state);}
function night(){go('home');state.minutes=1260;assert.equal(sleep(),true);}
test('a real seven-day playthrough completes each chapter, celebrates once and opens gardening',()=>{
  school();assert.equal(state.story.completed['first-class'],1);night();
  school();go('nam');assert.equal(complete('friend'),true);assert.equal(state.story.completed['first-friend'],2);night();
  school();go('mom');assert.equal(acceptShopping(),true);go('shop');buy('milk');buy('bread');go('mom');assert.equal(complete('shopping'),true);assert.equal(state.story.completed['first-errand'],3);night();
  school();assert.equal(storyAction(state,'card',STORY_QUESTIONS.card.answer).ok,true);night();
  school();assert.equal(storyAction(state,'mom-prep',1).ok,true);go('dad');assert.equal(storyAction(state,'dad-prep',2).ok,true);night();
  school();go('school');const cash=state.money;assert.equal(storyAction(state,'fair',1).ok,true);assert.equal(state.money,cash+10000);night();
  go('home');assert.equal(currentChapter(state)?.id,'birthday');const before=state.money;
  assert.equal(storyAction(state,'birthday').ok,true);assert.equal(state.age,4);assert.equal(state.money,before+20000);assert.equal(storyAction(state,'birthday').ok,false);assert.equal(state.money,before+20000);
  assert.equal(currentChapter(state),null);assert.equal(Object.keys(state.story.completed).length,7);assert.ok(state.life.unlocked.includes('memory-album'));
  state.minutes=8*60;go('binh');assert.equal(perform(state,'garden',3).ok,true);assert.equal(perform(state,'garden',3).ok,false);
  night();assert.equal(state.story.summaries[0].day,7);assert.ok(state.story.summaries[0].highlights.includes(CHAPTERS[6].title));
  save();assert.deepEqual(load()?.story,state.story);assert.equal(load()?.age,4);
});
test('chapters cannot be jumped, completed at the wrong place, or rewarded for a wrong answer',()=>{
  assert.equal(storyAction(state,'birthday').ok,false);assert.equal(storyAction(state,'card',0).ok,false);
  state.day=4;state.story.completed={'first-class':1,'first-friend':2,'first-errand':3};school();go('park');assert.equal(storyAction(state,'card',0).ok,false);
  go('home');const xp=state.xp;assert.equal(storyAction(state,'card',1).ok,false);assert.equal(state.xp,xp);assert.equal(storyAction(state,'card',0).ok,true);
});
test('unfinished chapters carry past their planned day and the journal uses the same current task as the HUD',()=>{
  state.day=8;school();assert.equal(currentChapter(state)?.id,'first-friend');
  const task=dailyTask(state);assert.equal(task.key,'story:first-friend');assert.equal(missionJournal(state)[0].id,task.key);
  assert.equal(missionJournal(state).filter(r=>r.id===task.key).length,1);
});
test('free recovery and a reported missed class avoid a permanent task lock',()=>{
  go('classroom');state.energy=0;assert.equal(canLeaveSchool(state),true);go('home');
  state.energy=0;state.money=0;assert.equal(restAtHome(state).ok,true);assert.equal(state.energy,30);assert.equal(state.money,0);
  assert.equal(restAtHome(state).ok,true);assert.equal(restAtHome(state).ok,false);
  state.minutes=1049;assert.equal(deferSchool(state).ok,false);state.minutes=1050;assert.equal(deferSchool(state).ok,true);assert.equal(schoolLock(state),null);assert.ok(!state.education.attended.includes(1));
  night();assert.ok(schoolLock(state));assert.equal(state.education.attended.includes(state.day),false);
});
test('an older four-year-old save can finish the story without a second fourth-birthday cash gift',()=>{
  state.age=4;state.day=7;state.story.completed=Object.fromEntries(CHAPTERS.slice(0,6).map(c=>[c.id,c.day]));
  const before=state.money;assert.equal(storyAction(state,'birthday').ok,true);assert.equal(state.money,before);assert.ok(state.life.unlocked.includes('garden'));
});
test('a postponed promise reappears tomorrow without a broken-promise penalty',()=>{
  state.life.generatedDay=1;state.life.offers=[{id:'mom-errand',day:1,status:'accepted'}];state.minutes=900;
  state.education.attended.push(1);assert.equal(postpone(state,'mom-errand').ok,true);state.minutes=1081;tickLife(state);assert.equal(state.relationships.mom??0,0);
  state.day=2;state.minutes=900;generateDay(state);assert.equal(state.life.offers.filter(o=>o.day===2&&o.id==='mom-errand').length,1);assert.equal(state.life.offers.find(o=>o.day===2&&o.id==='mom-errand')?.status,'offered');
});
test('midnight also archives a day once and older saves gain a clean story',()=>{
  state.minutes=1440;assert.equal(rollMidnight(state),true);assert.equal(state.story.summaries.length,1);assert.equal(state.story.summaries[0].day,1);
  assert.deepEqual(restoreStory(undefined).completed,{});assert.equal(restoreStory({completed:{birthday:-1}}).completed.birthday,undefined);
});
