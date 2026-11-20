import type Phaser from 'phaser';
import {roads,distanceToSegment,type Road,type Point} from './mapLayout';
import {walkGrid,SIDEWALK,KERB,PATH_RADIUS,CROSS_HALF} from './walkways';

// Road geometry is unchanged (collision and layout tests depend on it); only the
// rendering is richer: grass verge, paved sidewalk with joints, concrete kerb,
// asphalt, edge lines on main streets, centre dashes, zebra crossings and lamps.
export const ROAD_COLORS={
 verge:0x8aa66a,sidewalk:0xe6dbc0,joint:0xc9bc9c,kerb:0xb3aa95,surface:0x67737a,lane:0x7b8487,
 edge:0xe6dbc0,line:0xe8ebe0,marking:0xf0cf6e,zebra:0xf4f1e6,lampPost:0x48524f,lampHead:0xffe7a3,
};
export const roadHex=(color:number)=>'#'+color.toString(16).padStart(6,'0');

function stroke(g:Phaser.GameObjects.Graphics,road:Road,width:number,color:number,alpha=1){
 if(width<=0)return;
 g.lineStyle(width,color,alpha).strokePoints(road.points.map(([x,y])=>({x,y})));
 g.fillStyle(color,alpha);for(const [x,y]of road.points)g.fillCircle(x,y,width/2);
}
const onOtherRoad=(road:Road,x:number,y:number,margin:number)=>roads.some(o=>o!==road&&o.points.slice(1).some((p,j)=>distanceToSegment(x,y,o.points[j],p)<o.width/2+margin));
function along(road:Road,step:number,fn:(x:number,y:number,ux:number,uy:number)=>void,start=step/2){
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)continue;
  const ux=(b[0]-a[0])/len,uy=(b[1]-a[1])/len;
  for(let d=start;d<len;d+=step)fn(a[0]+ux*d,a[1]+uy*d,ux,uy);
 }
}

export function drawRoads(g:Phaser.GameObjects.Graphics){
 // Each layer is finished for every road before the next one, so no verge or
 // kerb can be painted across another street's asphalt.
 for(const road of roads)stroke(g,road,road.width+SIDEWALK*2+6,ROAD_COLORS.verge,.55);
 for(const road of roads)stroke(g,road,road.width+SIDEWALK*2,ROAD_COLORS.sidewalk);
 // Paving joints: a groove along the middle of the sidewalk and short cross joints.
 for(const road of roads){stroke(g,road,road.width+SIDEWALK+2,ROAD_COLORS.joint,.55);stroke(g,road,road.width+SIDEWALK,ROAD_COLORS.sidewalk)}
 g.lineStyle(1,ROAD_COLORS.joint,.7);
 for(const road of roads)along(road,18,(x,y,ux,uy)=>{
  const nx=-uy,ny=ux,inner=road.width/2+4,outer=road.width/2+SIDEWALK;
  for(const side of [1,-1]){const ax=x+nx*inner*side,ay=y+ny*inner*side;if(onOtherRoad(road,ax,ay,4))continue;g.lineBetween(ax,ay,x+nx*outer*side,y+ny*outer*side)}
 });
 for(const road of roads)stroke(g,road,road.width+KERB*2,ROAD_COLORS.kerb);
 for(const road of roads)stroke(g,road,road.width,road.major||road.width>=32?ROAD_COLORS.surface:ROAD_COLORS.lane);
 // Edge lines on named streets: paint lines, then re-lay the inner asphalt of
 // every street so lines stop cleanly at junctions.
 const lined=roads.filter(r=>r.width>=32);
 for(const road of lined)stroke(g,road,road.width-6,ROAD_COLORS.line,.9);
 for(const road of lined)stroke(g,road,road.width-10,ROAD_COLORS.surface);
 // Centre dashes, kept out of junctions.
 g.lineStyle(2.5,ROAD_COLORS.marking,.9);
 for(const road of lined)for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(let d=10;d<length-12;d+=50){
   const t=d/length,u=Math.min(d+24,length)/length;
   const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,ex=a[0]+(b[0]-a[0])*u,ey=a[1]+(b[1]-a[1])*u;
   if(onOtherRoad(road,x,y,12)||onOtherRoad(road,ex,ey,12)||onOtherRoad(road,(x+ex)/2,(y+ey)/2,12))continue;
   g.lineBetween(x,y,ex,ey);
  }
 }
 // Zebra crossings: the only places where pedestrians may step on asphalt.
 g.lineStyle(4,ROAD_COLORS.zebra,.92);
 for(const c of walkGrid().crosswalks){const nx=-c.uy,ny=c.ux,w=c.road.width/2;
  for(let k=-w+3;k<=w-3;k+=7)g.lineBetween(c.x+nx*k-c.ux*(CROSS_HALF-2),c.y+ny*k-c.uy*(CROSS_HALF-2),c.x+nx*k+c.ux*(CROSS_HALF-2),c.y+ny*k+c.uy*(CROSS_HALF-2));
 }
 // Street lamps on the sidewalks of named streets, alternating sides.
 for(const road of roads.filter(r=>r.name&&r.width>=32)){let side=1;
  along(road,230,(x,y,ux,uy)=>{
   const s0=side;side=-side;
   const nx=-uy,ny=ux,r=road.width/2+SIDEWALK-4,lx=x+nx*r*s0,ly=y+ny*r*s0;
   if(onOtherRoad(road,lx,ly,SIDEWALK+4))return;
   // Post on the sidewalk, lamp head leaning over the road.
   const hx=lx-nx*s0*7,hy=ly-ny*s0*7;
   g.fillStyle(0x2c3d33,.25).fillEllipse(lx+3,ly+3,12,7);
   g.lineStyle(2,ROAD_COLORS.lampPost).lineBetween(lx,ly,hx,hy);
   g.fillStyle(ROAD_COLORS.lampPost).fillCircle(lx,ly,3.5);
   g.fillStyle(ROAD_COLORS.lampHead,.3).fillCircle(hx,hy,10);
   g.fillStyle(ROAD_COLORS.lampHead).fillCircle(hx,hy,4);
  },115);
 }
}

/** Footpaths from doors and yards to the sidewalk, and small paved plazas.
 * Drawn above house plots so every walkable path is visible. */
export function drawWalkways(g:Phaser.GameObjects.Graphics){
 const {footpaths,plazas,doorsteps}=walkGrid();
 const line=(pts:Point[],width:number,color:number,alpha=1)=>{g.lineStyle(width,color,alpha).strokePoints(pts.map(([x,y])=>({x,y})));g.fillStyle(color,alpha);for(const [x,y]of pts)g.fillCircle(x,y,width/2)};
 for(const p of plazas){g.fillStyle(ROAD_COLORS.joint,.9).fillCircle(p.x,p.y,p.r+2)}
 for(const f of footpaths)line(f.points,PATH_RADIUS*2+3,ROAD_COLORS.joint,.9);
 for(const d of doorsteps)g.fillStyle(ROAD_COLORS.joint,.9).fillRoundedRect(d.x-1.5,d.y,d.w+3,d.h+1.5,4);
 for(const p of plazas){g.fillStyle(ROAD_COLORS.sidewalk).fillCircle(p.x,p.y,p.r);g.lineStyle(1,ROAD_COLORS.joint,.6).strokeCircle(p.x,p.y,p.r*.62);g.strokeCircle(p.x,p.y,p.r*.28)}
 for(const f of footpaths)line(f.points,PATH_RADIUS*2,ROAD_COLORS.sidewalk);
 for(const d of doorsteps)g.fillStyle(ROAD_COLORS.sidewalk).fillRoundedRect(d.x,d.y,d.w,d.h,4);
 // Stepping-stone joints across each path.
 g.lineStyle(1,ROAD_COLORS.joint,.7);
 for(const f of footpaths)for(let i=1;i<f.points.length;i++){const a=f.points[i-1],b=f.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)continue;const ux=(b[0]-a[0])/len,uy=(b[1]-a[1])/len;
  for(let d=10;d<len-4;d+=14){const x=a[0]+ux*d,y=a[1]+uy*d;g.lineBetween(x-uy*(PATH_RADIUS-2),y+ux*(PATH_RADIUS-2),x+uy*(PATH_RADIUS-2),y-ux*(PATH_RADIUS-2))}}
}
