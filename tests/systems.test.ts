import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,start,state,buy,consume,complete,sleep,save,load,SAVE_KEY} from '../src/state';
const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{setItem:(k:string,v:string)=>storage.set(k,v),getItem:(k:string)=>storage.get(k)??null},configurable:true});
beforeEach(()=>{storage.clear();start(fresh('Bé An'))});
test('shopping loop preserves funds, required goods and awards reward exactly once',()=>{
 state.money=20000;state.quests.shopping=1;
 assert.equal(buy('milk'),true);assert.equal(buy('bread'),true);assert.equal(state.money,5000);
 assert.equal(consume('milk'),false);assert.equal(complete('shopping'),true);
 assert.equal(state.money,10000);assert.equal(state.inventory.milk,0);assert.equal(state.inventory.bread,0);assert.equal(state.xp,30);
 assert.equal(complete('shopping'),false);assert.equal(state.money,10000);
});
test('cannot spend unavailable money or consume an absent item',()=>{assert.equal(buy('milk'),false);assert.equal(consume('bread'),false);assert.equal(state.money,0)});
test('legacy quests do not trigger the birthday before the seven-day story',()=>{
 state.inventory.milk=1;state.inventory.bread=1;state.quests.shopping=1;complete('shopping');complete('friend');complete('learn');assert.equal(state.xp,75);
 const night=()=>{state.minutes=21*60;assert.equal(sleep(),true)};night();night();assert.equal(state.age,3);night();assert.equal(state.age,3);assert.equal(state.money,5000);night();assert.equal(state.money,5000);
});
test('save/load round trip retains location, appearance, inventory and quests',()=>{state.x=1500;state.y=820;state.inside=false;state.inventory.snack=2;state.quests.friend=2;assert.equal(save(),true);assert.deepEqual(load(),state)});
test('invalid and incompatible saves fall back safely',()=>{for(const text of ['bad','{}','{"version":2}','{"version":1,"name":"A"}']){storage.set(SAVE_KEY,text);assert.equal(load(),null)}});
