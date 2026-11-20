import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildings,npcData,WORLD} from '../src/data';
import {collisionOf} from '../src/buildingLayout';
import {roads,trees,landmarks} from '../src/mapLayout';
import {canWalk,STREET_SPAWN,SCHOOL_DOOR,doorOf,outsideSpawn} from '../src/navigation';
import {walkGrid,onWalkway,canStep,roadDistance,SPOTS,KERB,KERB_GAP,SIDEWALK,nearestWalkable,routeField,routeLength,simplify} from '../src/walkways';

const obstacles=[...buildings.map(collisionOf),...trees.map(([x,y])=>({x:x-12,y:y-12,w:24,h:22}))];
const walkable=(x:number,y:number)=>canWalk(false,x,y,obstacles);

test('asphalt is closed to pedestrians except on zebra crossings',()=>{
 const g=walkGrid();assert.ok(g.crosswalks.length>=40);
 for(const road of roads){const [a,b]=[road.points[0],road.points[1]];for(let t=.1;t<.9;t+=.1){const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
  if(x<20||y<20||x>WORLD.width-20||y>WORLD.height-20)continue;
  const onCross=g.crosswalks.some(c=>Math.hypot(c.x-x,c.y-y)<c.half+12);
  if(!onCross&&roads.every(o=>o===road||roadDistance(o,x,y)>o.width/2+30))assert.equal(canStep(x,y),false,`${road.name||'lane'} centre ${x|0},${y|0} is walkable`)}}
 for(const c of g.crosswalks)assert.ok(onWalkway(c.x,c.y),'crossing centre must be walkable');
});
test('grass and sidewalks are open to walk, the roadway is not',()=>{
 for(const road of roads.filter(r=>r.width>=40)){const [a,b]=[road.points[0],road.points[1]];const len=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/len,uy=(b[1]-a[1])/len;const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
  for(const side of [1,-1]){const off=road.width/2+(KERB+KERB_GAP+SIDEWALK)/2,x=mx-uy*off*side,y=my+ux*off*side;if(roads.some(o=>o!==road&&roadDistance(o,x,y)<o.width/2+KERB+KERB_GAP+2))continue;if(x>0&&y>0&&x<WORLD.width&&y<WORLD.height){assert.ok(onWalkway(x,y),`sidewalk of ${road.name} at ${x|0},${y|0}`);assert.ok(canStep(x,y))}}}
 let grass=0,open=0;for(let y=40;y<WORLD.height;y+=97)for(let x=40;x<WORLD.width;x+=89){if(roads.every(o=>roadDistance(o,x,y)>o.width/2+60)){grass++;if(canStep(x,y))open++}}
 assert.equal(open,grass,'all open ground is walkable');
 const g=walkGrid();for(const c of g.crosswalks){assert.ok(canStep(c.x,c.y))}
});
test('every door, NPC, landmark and job spot joins one connected pedestrian network',()=>{
 const field=routeField(STREET_SPAWN.x,STREET_SPAWN.y,walkable)!;
 const targets=[...buildings.map(b=>({...doorOf(b.id),name:b.id})),...npcData.filter(n=>!n.inside).map(n=>({x:n.x,y:n.y,name:n.id})),...landmarks.map(p=>({x:p.x,y:p.y,name:p.id})),...Object.entries(SPOTS).map(([name,p])=>({...p,name})),{...outsideSpawn('classroom'),name:'school spawn'},{x:SCHOOL_DOOR.x,y:SCHOOL_DOOR.y+35,name:'school drop-off'}];
 for(const t of targets){assert.ok(walkable(t.x,t.y),t.name+' standing point');assert.ok(routeLength(field,t.x,t.y)>=0,'unreachable '+t.name)}
});
test('map clicks snap to the nearest sidewalk',()=>{
 const p=nearestWalkable(2000,700)!;assert.ok(onWalkway(p.x,p.y));
});
test('route simplification keeps the corners of a walking route',()=>{
 const pts:[number,number][]=[];for(let x=0;x<=96;x+=8)pts.push([x,0]);for(let y=8;y<=96;y+=8)pts.push([96,y]);
 assert.deepEqual(simplify(pts,4),[[0,0],[96,0],[96,96]]);
});
