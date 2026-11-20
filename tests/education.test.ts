import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,start,state,save,load} from '../src/state';
import {beginSchool,answerSchool,encounterChoice,reportSafety,rescueToHome} from '../src/educationActions';
import {currentLesson,SUBJECTS,SUBJECT_MINUTES,lessonBank,restoreEducation} from '../src/education';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{setItem:(k:string,v:string)=>storage.set(k,v),getItem:(k:string)=>storage.get(k)??null},configurable:true});
beforeEach(()=>{storage.clear();start(fresh())});
const classroom=()=>{state.room='classroom';state.inside=true;state.minutes=480};
test('classes require being inside school, class hours and sufficient energy',()=>{assert.equal(beginSchool(),false);classroom();state.minutes=479;assert.equal(beginSchool(),false);state.minutes=1050;assert.equal(beginSchool(),false);state.minutes=480;state.day=7;assert.equal(beginSchool(),false);state.day=1;state.energy=9;assert.equal(beginSchool(),false);state.energy=100;assert.equal(beginSchool(),true)});
test('wrong answers allow retry without cash or stat penalties; a full class rewards only once',()=>{classroom();beginSchool();const wrong=(currentLesson(1,0).answer+1)%3;assert.equal(answerSchool(wrong),'wrong');assert.equal(state.education.step,0);assert.equal(state.money,0);assert.equal(state.energy,100);for(let i=0;i<SUBJECTS.length;i++)assert.equal(answerSchool(currentLesson(1,i).answer),i===SUBJECTS.length-1?'done':'next');assert.deepEqual(state.education.attended,[1]);assert.equal(state.energy,90);assert.equal(state.minutes,480+SUBJECTS.length*SUBJECT_MINUTES);assert.deepEqual(state.education.subjects,{math:1,english:1,literature:1,history:1,geography:1});assert.equal(state.quests.learn,2);const xp=state.xp;assert.equal(beginSchool(),false);assert.equal(answerSchool(0),'unavailable');assert.equal(state.xp,xp);assert.equal(state.family.cash,500000)});
test('a lesson cannot be answered from outside the school and resumes after save/load',()=>{classroom();beginSchool();answerSchool(currentLesson(1,0).answer);save();start(load()!);assert.equal(state.education.step,1);assert.equal(state.room,'classroom');state.inside=false;assert.equal(answerSchool(currentLesson(1,1).answer),'unavailable')});

test('a late child can finish a catch-up class before bedtime',()=>{classroom();state.minutes=1049;assert.equal(beginSchool(),true);for(let i=0;i<SUBJECTS.length;i++)answerSchool(currentLesson(1,i).answer);assert.ok(state.education.attended.includes(1));assert.equal(state.minutes,1259)});

test('all five subjects have distinct questions for ten days and valid answers',()=>{
  assert.equal(SUBJECTS.length,5);
  assert.equal(Object.values(lessonBank).flat().length,56);
  for(const [step,subject] of SUBJECTS.entries()){
    const questions=Array.from({length:10},(_,i)=>currentLesson(i+1,step,3));
    assert.equal(new Set(questions.map(q=>q.question)).size,10,subject);
    for(const question of lessonBank[subject]){assert.ok(question.options[question.answer]);assert.ok(question.explanation);assert.equal(new Set(question.options).size,question.options.length);}
  }
  assert.ok(Array.from({length:12},(_,i)=>currentLesson(i+1,0,4)).some(q=>q.minAge===4));
});
test('old education saves acquire history and geography without losing partial progress',()=>{
  const old=restoreEducation({lessonDay:1,step:2,subjects:{math:4,english:3,literature:2}});
  assert.equal(old.step,2);assert.equal(old.subjects.math,4);assert.equal(old.subjects.history,0);assert.equal(old.subjects.geography,0);
});
test('a partially completed late class can resume after the start deadline',()=>{
  classroom();state.minutes=1049;beginSchool();answerSchool(currentLesson(1,0).answer);
  state.education.active=false;assert.ok(state.minutes>1050);assert.equal(beginSchool(),true);
  for(let i=1;i<SUBJECTS.length;i++)answerSchool(currentLesson(1,i).answer);
  assert.ok(state.education.attended.includes(1));assert.equal(state.minutes,1259);
});
test('an escorted child is not put in the unsafe encounter',()=>{state.education.escorted=true;assert.equal(encounterChoice('follow'),false);assert.equal(state.education.safety.status,'idle')});
test('refusing leads to reporting to a trusted adult, with a one-time learning reward',()=>{assert.equal(encounterChoice('refuse'),true);assert.equal(state.education.safety.status,'report');assert.equal(state.xp,0);assert.equal(reportSafety(),true);assert.equal(state.xp,10);assert.equal(reportSafety(),false);assert.equal(encounterChoice('follow'),false);state.day=2;assert.equal(encounterChoice('check'),true);reportSafety();assert.equal(state.xp,10)});
test('following enters a persisted incident; help restores a safe home without losing possessions',()=>{state.inside=false;state.money=12000;state.family.jars.save=5000;state.quests.friend=2;assert.equal(encounterChoice('follow'),true);assert.equal(state.education.safety.status,'abducted');save();start(load()!);assert.equal(state.education.safety.status,'abducted');assert.equal(beginSchool(),false);assert.equal(rescueToHome(),true);assert.equal(state.inside,true);assert.equal(state.room,'home');assert.equal(state.education.safety.status,'report');assert.equal(state.money,12000);assert.equal(state.family.jars.save,5000);assert.equal(state.quests.friend,2);assert.equal(state.health,100);assert.equal(rescueToHome(),false);assert.equal(reportSafety(),true)});
