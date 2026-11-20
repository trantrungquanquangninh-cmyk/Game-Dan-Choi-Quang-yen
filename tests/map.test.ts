import {collisionOf} from '../src/buildingLayout';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildings,npcData,WORLD} from '../src/data';
import {roads,pond,trees,inPolygon,MAP_REFERENCE,MAP_OFFSET,landmarks} from '../src/mapLayout';
import {canWalk,STREET_SPAWN,SHOP_DOOR,migrateMapPosition} from '../src/navigation';

const obstacles=[...buildings.map(collisionOf),...trees.map(([x,y])=>({x:x-12,y:y-12,w:24,h:22}))];
test('the screenshot reference and named streets are retained in one shared layout',()=>{
 assert.equal(MAP_REFERENCE.lat,20.9384777);assert.equal(MAP_REFERENCE.lng,106.8072544);
 for(const name of ['Trần Khánh Dư','Ngô Quyền','Phạm Ngũ Lão','Tiền Môn','Yết Kiêu'])assert.ok(roads.some(r=>r.name===name));
 assert.ok(inPolygon(360+MAP_OFFSET.x,1710+MAP_OFFSET.y,pond));assert.equal(canWalk(false,360+MAP_OFFSET.x,1710+MAP_OFFSET.y,obstacles),false);
});
test('all outside NPCs and the shop entrance have walkable standing positions',()=>{
 for(const n of [...npcData.filter(n=>!n.inside),{...SHOP_DOOR,name:'Shop entrance'}])assert.ok(canWalk(false,n.x,n.y,obstacles),n.name);
});
test('old outdoor saves move with the expanded map exactly once; interior saves remain in the room',()=>{
 const old={inside:false,x:1096,y:843,mapRevision:1};
 const expected={x:1096+MAP_OFFSET.x,y:843+MAP_OFFSET.y};
 migrateMapPosition(old);assert.deepEqual({x:old.x,y:old.y},expected);
 migrateMapPosition(old);assert.deepEqual({x:old.x,y:old.y},expected);
 const home={inside:true,x:500,y:440,mapRevision:1};migrateMapPosition(home);
 assert.deepEqual(home,{inside:true,x:500,y:440,mapRevision:2});
});
test('shop, school and playground are reachable from home with the actual building and tree collisions',()=>{
 const step=10,cols=Math.ceil(WORLD.width/step),rows=Math.ceil(WORLD.height/step);
 const start=[Math.round(STREET_SPAWN.x/step),Math.round(STREET_SPAWN.y/step)];
 const seen=new Set<number>();const queue=[start];seen.add(start[1]*cols+start[0]);
 for(let head=0;head<queue.length;head++){const [x,y]=queue[head];for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dx,ny=y+dy,key=ny*cols+nx;if(nx<0||ny<0||nx>=cols||ny>=rows||seen.has(key)||!canWalk(false,nx*step,ny*step,obstacles))continue;seen.add(key);queue.push([nx,ny])}}
 for(const target of [SHOP_DOOR,...landmarks,...npcData.filter(n=>['nam','teacher','binh'].includes(n.id))])assert.ok(seen.has(Math.round(target.y/step)*cols+Math.round(target.x/step)),`unreachable ${target.x},${target.y}`);
});
