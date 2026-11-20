import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeTraffic,moverPos,stepMover} from '../src/traffic';
import {onAsphalt,onWalkway} from '../src/walkways';

test('town has pedestrians on sidewalks and vehicles on the streets',()=>{
 const list=makeTraffic();
 assert.ok(list.filter(m=>m.kind==='walker').length>=15);assert.ok(list.filter(m=>m.kind!=='walker').length>=10);
 let walk=0,walkOk=0,drive=0,driveOk=0;
 for(const m of list)for(let i=0;i<60;i++){stepMover(m,.5,()=>false);const p=moverPos(m);if(m.kind==='walker'){walk++;if(onWalkway(p.x,p.y)&&!onAsphalt(p.x,p.y))walkOk++}else{drive++;if(onAsphalt(p.x,p.y))driveOk++}}
 assert.ok(walkOk/walk>.8,'walkers on sidewalks '+walkOk+'/'+walk);
 assert.ok(driveOk/drive>.97,'vehicles on asphalt '+driveOk+'/'+drive);
});
test('vehicles wait while someone is on the road ahead, then drive on',()=>{
 const car=makeTraffic().find(m=>m.kind!=='walker')!;const before=moverPos(car);
 assert.equal(stepMover(car,.5,()=>true),false);assert.deepEqual(moverPos(car),before);assert.ok(car.waiting>0);
 assert.equal(stepMover(car,.5,()=>false),true);assert.notDeepEqual(moverPos(car),before);
});
