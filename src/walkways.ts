// Pedestrian network for the town: people walk only on sidewalks, zebra
// crossings, short footpaths from doors/yards to the sidewalk, and small paved
// plazas (landmarks, NPC spots, job points). Asphalt and grass are off limits.
// The same geometry is used for collision, drawing and route guidance.
import {roads,pond,landmarks,trees,distanceToSegment,inPolygon,SIDEWALK,type Road,type Point} from './mapLayout';
import {WORLD,buildings,npcData} from './data';
import {collisionOf} from './buildingLayout';

export {SIDEWALK};
/** People keep this far from the kerb so the sprite never overhangs the road. */
export const KERB_GAP=7;
export const KERB=3;             // kerb strip between asphalt and sidewalk
export const CELL=4;             // walk mask resolution (world px per cell)
export const PATH_RADIUS=10;     // half width of footpaths
export const CROSS_HALF=10;      // half width of zebra crossings (along the road)

export type Crosswalk={x:number;y:number;ux:number;uy:number;half:number;road:Road};
export type Plaza={id:string;x:number;y:number;r:number};
export type Footpath={points:Point[]};

/** Extra paved spots used by gameplay (job board, scrap buyer, bench). */
export const SPOTS={
 board:{x:2372,y:1262,name:'Bảng việc vặt khu phố'},
 bench:{x:2478,y:1630,name:'Ghế đá'},
};

const cols=Math.ceil(WORLD.width/CELL),rows=Math.ceil(WORLD.height/CELL);
const idx=(cx:number,cy:number)=>cy*cols+cx;
const cellOf=(x:number,y:number)=>[Math.floor(x/CELL),Math.floor(y/CELL)] as const;

export const roadDistance=(road:Road,x:number,y:number)=>{let d=Infinity;for(let i=1;i<road.points.length;i++)d=Math.min(d,distanceToSegment(x,y,road.points[i-1],road.points[i]));return d};
const onOtherRoad=(road:Road,x:number,y:number,margin:number)=>roads.some(o=>o!==road&&roadDistance(o,x,y)<o.width/2+margin);
const onAnyAsphalt=(x:number,y:number,margin=0)=>roads.some(o=>roadDistance(o,x,y)<o.width/2+KERB+margin);

/** Zebra crossings: near side-street ends and at regular intervals along every street. */
function makeCrosswalks():Crosswalk[]{
 const list:Crosswalk[]=[];
 const ok=(road:Road,x:number,y:number,ux:number,uy:number)=>{
  const half=road.width/2+SIDEWALK-2,nx=-uy,ny=ux;
  for(const t of [-1,-.5,0,.5,1])for(const a of [-CROSS_HALF,0,CROSS_HALF]){const px=x+nx*half*t+ux*a,py=y+ny*half*t+uy*a;if(onOtherRoad(road,px,py,KERB+KERB_GAP+2))return false}
  // Both ends must land on this road's own sidewalk, not across a bend.
  for(const s of [1,-1]){const px=x+nx*half*s,py=y+ny*half*s;if(Math.abs(roadDistance(road,px,py)-half)>3)return false}
  return !list.some(c=>Math.hypot(c.x-x,c.y-y)<110);
 };
 const add=(road:Road,x:number,y:number,ux:number,uy:number)=>{if(ok(road,x,y,ux,uy))list.push({x,y,ux,uy,half:road.width/2+SIDEWALK,road})};
 // 1. Where a street ends on a wider street, cross just before the junction.
 for(const road of roads)for(const [end,next]of [[road.points[0],road.points[1]],[road.points[road.points.length-1],road.points[road.points.length-2]]] as [Point,Point][]){
  const main=roads.find(o=>o!==road&&roadDistance(o,end[0],end[1])<o.width/2+6);if(!main)continue;
  const len=Math.hypot(next[0]-end[0],next[1]-end[1]);const ux=(next[0]-end[0])/len,uy=(next[1]-end[1])/len;
  for(const off of [main.width/2+SIDEWALK+CROSS_HALF+6,main.width/2+SIDEWALK+CROSS_HALF+30]){if(off>len-CROSS_HALF)break;const before=list.length;add(road,end[0]+ux*off,end[1]+uy*off,ux,uy);if(list.length>before)break}
 }
 // 2. Regular mid-block crossings.
 for(const road of roads){const step=road.width>=50?300:220;let carry=step/2;
  for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)continue;const ux=(b[0]-a[0])/len,uy=(b[1]-a[1])/len;
   let d=carry;for(;d<len;d+=step){let placed=false;for(const shift of [0,30,-30,60,-60,90]){const t=d+shift;if(t<0||t>len)continue;const before=list.length;add(road,a[0]+ux*t,a[1]+uy*t,ux,uy);if(list.length>before){placed=true;break}}void placed}
   carry=d-len;
  }
 }
 return list;
}

type Grid={walk:Uint8Array;asphalt:Uint8Array;noGo:Uint8Array;crosswalks:Crosswalk[];plazas:Plaza[];footpaths:Footpath[];doorsteps:{x:number;y:number;w:number;h:number}[]};
let grid:Grid|undefined;

function forCells(x0:number,y0:number,x1:number,y1:number,fn:(cx:number,cy:number,x:number,y:number)=>void){
 const a=Math.max(0,Math.floor(x0/CELL)),b=Math.min(cols-1,Math.floor(x1/CELL)),c=Math.max(0,Math.floor(y0/CELL)),d=Math.min(rows-1,Math.floor(y1/CELL));
 for(let cy=c;cy<=d;cy++)for(let cx=a;cx<=b;cx++)fn(cx,cy,cx*CELL+CELL/2,cy*CELL+CELL/2);
}

/** Builds (once) the walk mask and all pedestrian geometry. */
export function walkGrid():Grid{
 if(grid)return grid;
 const walk=new Uint8Array(cols*rows),asphalt=new Uint8Array(cols*rows),side=new Uint8Array(cols*rows),noGo=new Uint8Array(cols*rows);
 // Sidewalk bands and asphalt (round joins/caps, same as the drawing).
 for(const road of roads)for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],r=road.width/2+SIDEWALK;
  forCells(Math.min(a[0],b[0])-r,Math.min(a[1],b[1])-r,Math.max(a[0],b[0])+r,Math.max(a[1],b[1])+r,(cx,cy,x,y)=>{
   const d=distanceToSegment(x,y,a,b),k=idx(cx,cy);
   if(d<road.width/2+KERB+KERB_GAP)noGo[k]=1;
   if(d<road.width/2+KERB)asphalt[k]=1;else if(d>=road.width/2+KERB+KERB_GAP&&d<=r)side[k]=1;
  });
 }
 for(let k=0;k<walk.length;k++)walk[k]=side[k]&&!asphalt[k]?1:0;
 const crosswalks=makeCrosswalks();
 for(const c of crosswalks){const nx=-c.uy,ny=c.ux,R=c.half+CROSS_HALF;
  forCells(c.x-R,c.y-R,c.x+R,c.y+R,(cx,cy,x,y)=>{const dx=x-c.x,dy=y-c.y,along=dx*c.ux+dy*c.uy,across=dx*nx+dy*ny;if(Math.abs(along)<=CROSS_HALF&&Math.abs(across)<=c.half){walk[idx(cx,cy)]=1;noGo[idx(cx,cy)]=0}});
 }
 // Obstacles that footpaths must go around (buildings, trees, pond, asphalt).
 const blocked=new Uint8Array(cols*rows);
 for(let k=0;k<blocked.length;k++)blocked[k]=asphalt[k];
 const block=(r:{x:number;y:number;w:number;h:number},pad:number)=>forCells(r.x-pad,r.y-pad,r.x+r.w+pad,r.y+r.h+pad,(cx,cy)=>{blocked[idx(cx,cy)]=1});
 for(const b of buildings)block(collisionOf(b),PATH_RADIUS+2);
 for(const [x,y]of trees)block({x:x-12,y:y-12,w:24,h:22},PATH_RADIUS+2);
 for(let cy=0;cy<rows;cy++)for(let cx=0;cx<cols;cx++){const x=cx*CELL+CELL/2,y=cy*CELL+CELL/2;if(inPolygon(x,y,pond))blocked[idx(cx,cy)]=1}
 // `net` is everything already joined to the street network.
 const net=walk.slice();
 const pave=(x:number,y:number,r:number)=>forCells(x-r,y-r,x+r,y+r,(cx,cy,px,py)=>{const k=idx(cx,cy);if(!asphalt[k]&&Math.hypot(px-x,py-y)<=r){walk[k]=1}});
 const plazas:Plaza[]=[];
 const addPlaza=(id:string,x:number,y:number,r:number)=>{plazas.push({id,x,y,r});pave(x,y,r)};
 for(const p of landmarks)addPlaza('landmark:'+p.id,p.x,p.y,p.kind==='park'?70:48);
 for(const n of npcData.filter(n=>!n.inside))addPlaza('npc:'+n.id,n.x,n.y,n.id==='dad'?60:46);
 for(const [id,p]of Object.entries(SPOTS))addPlaza('spot:'+id,p.x,p.y,36);
 const doorsteps=buildings.map(b=>({x:b.x+b.w/2-PATH_RADIUS,y:b.y+b.h,w:PATH_RADIUS*2,h:21+30}));
 for(const d of doorsteps)forCells(d.x,d.y,d.x+d.w,d.y+d.h,(cx,cy)=>{const k=idx(cx,cy);if(!asphalt[k])walk[k]=1});
 // Footpaths: shortest route over open ground from each anchor to the network.
 const footpaths:Footpath[]=[];
 const prev=new Int32Array(cols*rows),seen=new Int32Array(cols*rows);let stamp=0;
 const los=(a:Point,b:Point)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,y=a[1]+(b[1]-a[1])*i/n;const [cx,cy]=cellOf(x,y);if(blocked[idx(cx,cy)]&&!net[idx(cx,cy)])return false}return true};
 const connect=(x:number,y:number)=>{
  const [sx,sy]=cellOf(x,y);if(net[idx(sx,sy)])return true;
  stamp++;const queue=[idx(sx,sy)];seen[queue[0]]=stamp;prev[queue[0]]=-1;let found=-1;
  for(let h=0;h<queue.length&&h<120000;h++){const k=queue[h],cx=k%cols,cy=(k-cx)/cols;
   if(net[k]){found=k;break}
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const nk=idx(nx,ny);if(seen[nk]===stamp||(blocked[nk]&&!net[nk]))continue;
    // diagonal moves may not cut obstacle corners
    if(dx&&dy&&(blocked[idx(cx+dx,cy)]&&!net[idx(cx+dx,cy)]||blocked[idx(cx,cy+dy)]&&!net[idx(cx,cy+dy)]))continue;
    seen[nk]=stamp;prev[nk]=k;queue.push(nk)}
  }
  if(found<0)return false;
  const raw:Point[]=[];for(let k=found;k>=0;k=prev[k]){const cx=k%cols,cy=(k-cx)/cols;raw.push([cx*CELL+CELL/2,cy*CELL+CELL/2])}
  raw[raw.length-1]=[x,y];
  // Pull the string: keep only corners needed to stay on open ground.
  const pts:Point[]=[raw[0]];let i=0;while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!los(raw[i],raw[j]))j--;pts.push(raw[j]);i=j}
  // Extend slightly into the network so the joint is seamless.
  if(pts.length>=2){const [a,b]=[pts[0],pts[1]],len=Math.hypot(a[0]-b[0],a[1]-b[1])||1;pts[0]=[a[0]+(a[0]-b[0])/len*4,a[1]+(a[1]-b[1])/len*4]}
  footpaths.push({points:pts});
  for(let s=1;s<pts.length;s++){const a=pts[s-1],b=pts[s],r=PATH_RADIUS;forCells(Math.min(a[0],b[0])-r,Math.min(a[1],b[1])-r,Math.max(a[0],b[0])+r,Math.max(a[1],b[1])+r,(cx,cy,px,py)=>{const k=idx(cx,cy);if(!asphalt[k]&&distanceToSegment(px,py,a,b)<=r){walk[k]=1;net[k]=1}})}
  return true;
 };
 const joinArea=(x0:number,y0:number,x1:number,y1:number)=>forCells(x0,y0,x1,y1,(cx,cy)=>{const k=idx(cx,cy);if(walk[k])net[k]=1});
 for(const p of plazas){connect(p.x,p.y);joinArea(p.x-p.r,p.y-p.r,p.x+p.r,p.y+p.r)}
 const important=buildings.filter(b=>!b.id.startsWith('block')),homes=buildings.filter(b=>b.id.startsWith('block'));
 for(const b of [...important,...homes]){const d=doorsteps[buildings.indexOf(b)];connect(d.x+d.w/2,d.y+d.h-4);joinArea(d.x,d.y,d.x+d.w,d.y+d.h)}
 grid={walk,asphalt,noGo,crosswalks,plazas,footpaths,doorsteps};
 return grid;
}

/** True when (x,y) is on the pedestrian network (sidewalk, crossing, path, plaza). */
/** Where a person may stand outdoors: anywhere except the roadway (zebra crossings are fine). */
export function canStep(x:number,y:number){
 if(x<0||y<0||x>=WORLD.width||y>=WORLD.height)return false;
 const g=walkGrid(),[cx,cy]=cellOf(x,y);return g.noGo[idx(cx,cy)]===0;
}
export function onWalkway(x:number,y:number){
 if(x<0||y<0||x>=WORLD.width||y>=WORLD.height)return false;
 const g=walkGrid(),[cx,cy]=cellOf(x,y);return g.walk[idx(cx,cy)]===1;
}
export const onAsphalt=(x:number,y:number)=>{const g=walkGrid(),[cx,cy]=cellOf(x,y);return x>=0&&y>=0&&x<WORLD.width&&y<WORLD.height&&g.asphalt[idx(cx,cy)]===1};
export {onAnyAsphalt};

/** Nearest walkable point (ring search), used to snap map clicks and quest spots. */
export function nearestWalkable(x:number,y:number,ok:(x:number,y:number)=>boolean=onWalkway,maxRadius=600){
 if(ok(x,y))return {x,y};
 for(let r=CELL;r<=maxRadius;r+=CELL){const n=Math.max(8,Math.round(r*2*Math.PI/CELL));for(let i=0;i<n;i++){const a=i/n*Math.PI*2,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(ok(px,py))return {x:px,y:py}}}
 return null;
}

// ---------------- Route guidance ----------------
const NAV=8; // nav grid resolution
const ncols=Math.ceil(WORLD.width/NAV),nrows=Math.ceil(WORLD.height/NAV);
export type RouteField={dist:Int32Array;tx:number;ty:number};
/** Breadth-first distance field from a destination over walkable nav cells. */
const passCache=new WeakMap<object,Uint8Array>();
/** Walkable nav cells for a set of solid rectangles (cached per obstacle list). */
export function navPass(obstacles:{x:number;y:number;w:number;h:number}[]){
 const hit=passCache.get(obstacles);if(hit)return hit;
 const pass=new Uint8Array(ncols*nrows);
 for(let cy=0;cy<nrows;cy++)for(let cx=0;cx<ncols;cx++){const x=cx*NAV+NAV/2,y=cy*NAV+NAV/2;pass[cy*ncols+cx]=canStep(x,y)&&!inPolygon(x,y,pond)?1:0}
 // Same feet box as canWalk: x±9, y-10..+5.
 for(const r of obstacles){const a=Math.max(0,Math.floor((r.x-9)/NAV)),b=Math.min(ncols-1,Math.floor((r.x+r.w+9)/NAV)),c=Math.max(0,Math.floor((r.y-5)/NAV)),d=Math.min(nrows-1,Math.floor((r.y+r.h+10)/NAV));
  for(let cy=c;cy<=d;cy++)for(let cx=a;cx<=b;cx++){const x=cx*NAV+NAV/2,y=cy*NAV+NAV/2;if(x+9>r.x&&x-9<r.x+r.w&&y+5>r.y&&y-10<r.y+r.h)pass[cy*ncols+cx]=0}}
 passCache.set(obstacles,pass);return pass;
}
export function routeField(tx:number,ty:number,walkable:((x:number,y:number)=>boolean)|Uint8Array):RouteField|null{
 let pass:Uint8Array;
 if(typeof walkable==='function'){pass=new Uint8Array(ncols*nrows);for(let cy=0;cy<nrows;cy++)for(let cx=0;cx<ncols;cx++)pass[cy*ncols+cx]=walkable(cx*NAV+NAV/2,cy*NAV+NAV/2)?1:0}else pass=walkable.slice();
 const ok=(x:number,y:number)=>{const cx=Math.floor(x/NAV),cy=Math.floor(y/NAV);return cx>=0&&cy>=0&&cx<ncols&&cy<nrows&&pass[cy*ncols+cx]===1};
 const snap=nearestWalkable(tx,ty,ok,400);if(!snap)return null;
 const dist=new Int32Array(ncols*nrows).fill(-1);
 const sx=Math.min(ncols-1,Math.floor(snap.x/NAV)),sy=Math.min(nrows-1,Math.floor(snap.y/NAV));
 const start=sy*ncols+sx;pass[start]=1;dist[start]=0;const queue=new Int32Array(ncols*nrows);let head=0,tail=0;queue[tail++]=start;
 while(head<tail){const k=queue[head++],cx=k%ncols,cy=(k-cx)/ncols,d=dist[k]+1;
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=ncols||ny>=nrows)continue;const nk=ny*ncols+nx;if(dist[nk]>=0||!pass[nk])continue;dist[nk]=d;queue[tail++]=nk}}
 return {dist,tx:snap.x,ty:snap.y};
}
function fieldAt(f:RouteField,x:number,y:number){
 const cx=Math.floor(x/NAV),cy=Math.floor(y/NAV);
 // tolerate standing on the edge of a cell that is not walkable itself
 let best=-1,bk=-1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=ncols||ny>=nrows)continue;const k=ny*ncols+nx,d=f.dist[k];if(d>=0&&(best<0||d<best)){best=d;bk=k}}
 return {d:best,k:bk};
}
/** Route from (x,y) to the field's destination as a list of points (empty if unreachable). */
export function routeFrom(f:RouteField,x:number,y:number,maxSteps=4000):Point[]{
 let {k}=fieldAt(f,x,y);if(k<0)return [];
 const pts:Point[]=[[x,y]];
 for(let s=0;s<maxSteps;s++){const d=f.dist[k];if(d===0)break;const cx=k%ncols,cy=(k-cx)/ncols;let next=-1;
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=ncols||ny>=nrows)continue;const nk=ny*ncols+nx;if(f.dist[nk]===d-1){next=nk;break}}
  if(next<0)break;k=next;pts.push([(k%ncols)*NAV+NAV/2,Math.floor(k/ncols)*NAV+NAV/2]);
 }
 pts.push([f.tx,f.ty]);
 return pts;
}
/** Walking distance (world px) from (x,y) to the destination, or -1. */
export function routeLength(f:RouteField,x:number,y:number){const {d}=fieldAt(f,x,y);return d<0?-1:d*NAV}
/** Simplifies a route to its corners (for drawing). */
export function simplify(points:Point[],tolerance=6):Point[]{
 if(points.length<3)return points;
 // Douglas–Peucker
 const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;const stack:[number,number][]=[[0,points.length-1]];
 while(stack.length){const [a,b]=stack.pop()!;let best=-1,bi=-1;for(let i=a+1;i<b;i++){const d=distanceToSegment(points[i][0],points[i][1],points[a],points[b]);if(d>best){best=d;bi=i}}if(best>tolerance){keep[bi]=1;stack.push([a,bi],[bi,b])}}
 return points.filter((_,i)=>keep[i]);
}
