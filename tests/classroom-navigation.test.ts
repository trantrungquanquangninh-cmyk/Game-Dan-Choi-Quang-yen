import {test} from 'node:test';
import assert from 'node:assert/strict';
import {outsideSpawn,SCHOOL_DOOR,STREET_SPAWN,CLASSROOM_OBSTACLES,canWalk,atHomeExit} from '../src/navigation';
test('leaving school returns to its own gate and leaving home returns to the home street',()=>{assert.deepEqual(outsideSpawn('home'),STREET_SPAWN);assert.deepEqual(outsideSpawn('classroom'),{x:SCHOOL_DOOR.x,y:SCHOOL_DOOR.y+28});assert.notDeepEqual(outsideSpawn('classroom'),STREET_SPAWN)});
test('the classroom entrance, learning station and teacher are reachable without crossing desks or walls',()=>{for(let y=410;y<=590;y+=5)assert.ok(canWalk(true,500,y,CLASSROOM_OBSTACLES));for(let y=260;y<=520;y+=5)assert.ok(canWalk(true,410,y,CLASSROOM_OBSTACLES));assert.equal(canWalk(true,500,340,CLASSROOM_OBSTACLES),false);assert.equal(canWalk(true,155,440,CLASSROOM_OBSTACLES),false);assert.ok(atHomeExit(500,580))});
