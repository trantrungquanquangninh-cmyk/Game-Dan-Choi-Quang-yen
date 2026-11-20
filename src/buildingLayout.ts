import {roads,pond,park,trees,inPolygon,distanceToSegment,SIDEWALK,type Point} from './mapLayout';
export type Box={x:number;y:number;w:number;h:number};
export const plotOf=(b:Box):Box=>({x:b.x-12,y:b.y-18,w:b.w+24,h:b.h+46});
export const collisionOf=(b:Box):Box=>({x:b.x,y:b.y+b.h*.39,w:b.w,h:b.h*.61});
export const intersects=(a:Box,b:Box,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
const corners=(r:Box):Point[]=>[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]];
function segmentHitsBox(a:Point,b:Point,r:Box){
 let lo=0,hi=1;for(const [origin,delta,min,max]of [[a[0],b[0]-a[0],r.x,r.x+r.w],[a[1],b[1]-a[1],r.y,r.y+r.h]]){if(delta===0){if(origin<min||origin>max)return false;continue}const u=(min-origin)/delta,v=(max-origin)/delta;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return false}return true;
}
export function segmentDistanceToBox(a:Point,b:Point,r:Box){
 if(segmentHitsBox(a,b,r))return 0;
 const toBox=([x,y]:Point)=>Math.hypot(Math.max(r.x-x,0,x-r.x-r.w),Math.max(r.y-y,0,y-r.y-r.h));
 return Math.min(toBox(a),toBox(b),...corners(r).map(([x,y])=>distanceToSegment(x,y,a,b)));
}
export function clearOfRoads(plot:Box){return roads.every(r=>r.points.slice(1).every((p,i)=>segmentDistanceToBox(r.points[i],p,plot)>r.width/2+SIDEWALK+6))}
function clearOfLandscape(plot:Box){return [pond,park].every(poly=>!corners(plot).some(([x,y])=>inPolygon(x,y,poly))&&!poly.some(([x,y])=>x>=plot.x&&x<=plot.x+plot.w&&y>=plot.y&&y<=plot.y+plot.h)&&!poly.some((p,i)=>segmentHitsBox(p,poly[(i+1)%poly.length],plot)))}
export function compactBuildings<T extends Box&{id:string}>(buildings:T[],width:number,height:number,reserved:Point[]){
 const placed:Box[]=trees.map(([x,y])=>({x:x-42,y:y-110,w:90,h:128}));
 for(const b of buildings){const oldW=b.w,oldH=b.h;b.w=Math.round(oldW*.64);b.h=Math.round(oldH*.64);b.x+=Math.round((oldW-b.w)/2);b.y+=oldH-b.h;
  const origin={x:b.x,y:b.y};let found=false;
  const offsets:Point[]=[[0,0]];for(let radius=16;radius<=512;radius+=16)for(let dx=-radius;dx<=radius;dx+=16)for(const dy of [-radius,radius])offsets.push([dx,dy]);for(let radius=16;radius<=512;radius+=16)for(let dy=-radius+16;dy<radius;dy+=16)for(const dx of [-radius,radius])offsets.push([dx,dy]);offsets.sort((a,b)=>Math.hypot(...a)-Math.hypot(...b));
  for(const [dx,dy]of offsets){b.x=origin.x+dx;b.y=origin.y+dy;const plot=plotOf(b);if(plot.x<20||plot.y<20||plot.x+plot.w>width-20||plot.y+plot.h>height-20||!clearOfRoads(plot)||!clearOfLandscape(plot)||placed.some(p=>intersects(plot,p,12))||reserved.some(([x,y])=>x>plot.x-12&&x<plot.x+plot.w+12&&y>plot.y-12&&y<plot.y+plot.h+12))continue;placed.push(plot);found=true;break}
  if(!found)throw new Error('Không tìm được khu đất trống cho '+b.id);
 }
}
