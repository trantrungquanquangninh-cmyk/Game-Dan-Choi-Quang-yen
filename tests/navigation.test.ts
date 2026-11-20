import {collisionOf} from '../src/buildingLayout';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildings} from '../src/data';
import {routeField,routeFrom} from '../src/walkways';
import {atHomeExit,canWalk,recoverPosition,homeCameraZoom,HOME_SPAWN,STREET_SPAWN,SHOP_DOOR,HOME_OBSTACLES} from '../src/navigation';

test('walk from the starting position through the home doorway without crossing a wall',()=>{
 for(let y=HOME_SPAWN.y;y<=590;y+=5)assert.ok(canWalk(true,500,y,HOME_OBSTACLES),`blocked at 500,${y}`);
 assert.ok(atHomeExit(500,575));assert.ok(atHomeExit(500,590));assert.equal(atHomeExit(600,590),false);
 assert.equal(canWalk(true,400,595,HOME_OBSTACLES),false);
});
test('the street route to the milk shop and back stays on the pedestrian network',()=>{
 const obstacles=buildings.map(collisionOf);
 const walkable=(x:number,y:number)=>canWalk(false,x,y,obstacles);
 assert.ok(walkable(STREET_SPAWN.x,STREET_SPAWN.y));assert.ok(walkable(SHOP_DOOR.x,SHOP_DOOR.y));
 const field=routeField(SHOP_DOOR.x,SHOP_DOOR.y,walkable)!;
 const route=routeFrom(field,STREET_SPAWN.x,STREET_SPAWN.y);
 assert.ok(route.length>2,'no route home → shop');
 for(const [x,y]of route.slice(1,-1))assert.ok(walkable(x,y),`route leaves the walkway at ${x},${y}`);
 assert.equal(canWalk(false,SHOP_DOOR.x,SHOP_DOOR.y-55,obstacles),false);
});
test('old saves outside the room or inside furniture recover to the starting floor',()=>{
 for(const p of [{x:500,y:680},{x:40,y:400},{x:250,y:300},{x:NaN,y:300}])assert.deepEqual(recoverPosition(true,p.x,p.y,HOME_OBSTACLES),HOME_SPAWN);
 assert.deepEqual(recoverPosition(true,500,535,HOME_OBSTACLES),{x:500,y:535});
});
test('interior camera fits the floor and door at small desktop and phone sizes',()=>{
 for(const [w,h]of [[831,600],[1366,768],[390,844]]){const zoom=homeCameraZoom(w,h);assert.ok(820*zoom<=w);assert.ok(650*zoom<=h)}
});
