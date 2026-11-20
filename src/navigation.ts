import { WORLD,buildings } from './data';
import {inPolygon,pond,MAP_OFFSET} from './mapLayout';
import {canStep} from './walkways';

export type Obstacle = {x:number;y:number;w:number;h:number};
export const HOME_SPAWN = {x:500,y:440};
export const HOME_RETURN = {x:500,y:535};
export const doorOf=(id:string)=>{const b=buildings.find(b=>b.id===id)!;return {x:b.x+b.w/2,y:b.y+b.h+21}};
export const HOME_DOOR=doorOf('home');
export const STREET_SPAWN = {x:HOME_DOOR.x,y:HOME_DOOR.y+28};
export const SHOP_DOOR = doorOf('shop');
export const SCHOOL_DOOR=doorOf('school');
export const outsideSpawn=(room:'home'|'classroom')=>room==='classroom'?{x:SCHOOL_DOOR.x,y:SCHOOL_DOOR.y+28}:{...STREET_SPAWN};
export const HOME_OBSTACLES:Obstacle[] = [
 {x:150,y:100,w:700,h:80}, {x:150,y:100,w:20,h:510},
 {x:830,y:100,w:20,h:510}, {x:150,y:590,w:290,h:20},
 {x:560,y:590,w:290,h:20}, {x:220,y:210,w:150,h:180},
 {x:600,y:230,w:120,h:65}, {x:690,y:440,w:100,h:60},
];
export const CLASSROOM_OBSTACLES:Obstacle[]=[...HOME_OBSTACLES.slice(0,5),...[290,455,620].map(x=>({x,y:325,w:90,h:40}))];
export function atHomeExit(x:number,y:number){return x>=455&&x<=545&&y>=575&&y<=610}
export function canWalk(inside:boolean,x:number,y:number,obstacles:Obstacle[]){
 // Keep the character inside the actual floor, rather than the empty canvas
 // around the room. The opening in the south wall remains walkable.
 const inBounds=inside?x>=180&&x<=820&&y>=195&&y<=605:x>18&&x<WORLD.width-18&&y>25&&y<WORLD.height-18;
 // Outside, people may walk on sidewalks and grass but cross streets only on zebra crossings.
 return inBounds&&(inside||!inPolygon(x,y,pond)&&canStep(x,y))&&!obstacles.some(r=>x+9>r.x&&x-9<r.x+r.w&&y+5>r.y&&y-10<r.y+r.h);
}
export function recoverPosition(inside:boolean,x:number,y:number,obstacles:Obstacle[]){
 if(Number.isFinite(x)&&Number.isFinite(y)&&canWalk(inside,x,y,obstacles))return {x,y};
 return inside?{...HOME_SPAWN}:{...STREET_SPAWN};
}
export function homeCameraZoom(width:number,height:number){return Math.min(1,Math.max(.25,Math.min(width/820,height/650)))}
export function migrateMapPosition(s:{inside:boolean;x:number;y:number;mapRevision:number}){
 if(s.mapRevision>=2)return;
 if(!s.inside){s.x+=MAP_OFFSET.x;s.y+=MAP_OFFSET.y}
 s.mapRevision=2;
}
