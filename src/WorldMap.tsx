import React from 'react';
import {WORLD,buildings,npcData} from './data';
import {roads,pond,green,park,landmarks} from './mapLayout';
import {state} from './state';
import {HOME_DOOR,SCHOOL_DOOR} from './navigation';
import {scene} from './game';
import {plotOf} from './buildingLayout';
import {ROAD_COLORS,roadHex} from './drawRoads';
import {mapFocus} from './mapFocus';
import {dailyTask} from './activities';
import {placePoint} from './places';
import {collisionOf} from './buildingLayout';
import {walkGrid,navPass,routeField,routeFrom,simplify,SIDEWALK,PATH_RADIUS,type RouteField} from './walkways';

const STREET_OBSTACLES=buildings.map(collisionOf);
let cachedRoute:{key:string;field:RouteField|null}|undefined;
/** Walking route over sidewalks and crossings, simplified for drawing. */
function walkingRoute(from:{x:number;y:number},to:{x:number;y:number}){
 const key=Math.round(to.x)+','+Math.round(to.y);
 if(cachedRoute?.key!==key)cachedRoute={key,field:routeField(to.x,to.y,navPass(STREET_OBSTACLES))};
 const f=cachedRoute.field;if(!f)return null;const pts=routeFrom(f,from.x,from.y);return pts.length>1?simplify(pts,10):null;
}

export function WorldMap({large,onDestination}:{large:boolean;onDestination:()=>void}){
 const [overview,setOverview]=React.useState(false);
 const [,refresh]=React.useState(0);
 const player=state.inside?(state.room==='classroom'?SCHOOL_DOOR:HOME_DOOR):{x:state.x,y:state.y};
 const task=dailyTask(state);
 const target=task.place&&task.place!=='bed'?placePoint(task.place):task.place==='bed'?HOME_DOOR:undefined;
 const destination=scene?.destination??target;
 const focus=mapFocus(player,destination);
 const view=large&&!overview?focus:{x:0,y:0,width:WORLD.width,height:WORLD.height};
 const points=(ps:number[][])=>ps.map(p=>p.join(',')).join(' ');
 const scenery=React.useMemo(()=><>
  <rect width={WORLD.width} height={WORLD.height} fill="#a8bd87"/>
  <polygon points={points(green)} fill="#92b77e"/><polygon points={points(park)} fill="#78ab76"/><polygon points={points(pond)} fill="#72a7a0"/>
  {roads.map((r,i)=><polyline key={'edge-'+i} points={points(r.points)} fill="none" stroke={roadHex(ROAD_COLORS.edge)} strokeWidth={r.width+SIDEWALK*2} strokeLinejoin="round" strokeLinecap="round"/>)}
  {walkGrid().footpaths.map((f,i)=><polyline key={'path-'+i} points={points(f.points)} fill="none" stroke={roadHex(ROAD_COLORS.sidewalk)} strokeWidth={PATH_RADIUS*2} strokeLinejoin="round" strokeLinecap="round"/>)}
  {walkGrid().plazas.map(p=><circle key={p.id} cx={p.x} cy={p.y} r={p.r} fill={roadHex(ROAD_COLORS.sidewalk)}/>)}
  {roads.map((r,i)=><polyline key={'surface-'+i} points={points(r.points)} fill="none" stroke={roadHex(ROAD_COLORS.surface)} strokeWidth={r.width} strokeLinejoin="round" strokeLinecap="round"/>)}
  {walkGrid().crosswalks.map((c,i)=><line key={'zebra-'+i} x1={c.x-c.uy*c.road.width/2} y1={c.y+c.ux*c.road.width/2} x2={c.x+c.uy*c.road.width/2} y2={c.y-c.ux*c.road.width/2} stroke="#f4f1e6" strokeWidth={16} strokeDasharray="4 3"/>)}
  {buildings.map(b=>{const p=plotOf(b);return <g key={b.id}><rect x={p.x} y={p.y} width={p.w} height={p.h} rx="5" fill="#bdc99c"/><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill={'#'+b.roof.toString(16).padStart(6,'0')}/>{large&&!b.id.startsWith('block')&&!landmarks.some(p=>p.id===b.id)&&<text x={b.x+b.w/2} y={b.y+b.h/2+5} textAnchor="middle" fontSize="17" textLength={Math.min(b.w-8,b.name.length*9)} lengthAdjust="spacingAndGlyphs" fill="#fff8dc">{b.name}</text>}</g>})}
  {npcData.filter(n=>!n.inside).map(n=><circle key={n.id} cx={n.x} cy={n.y} r="13" fill="#fff4cb"/>)}
  {landmarks.map(p=><g key={p.id}><circle cx={p.x} cy={p.y} r={large?16:24} fill="#9d6651"/>{large&&<text x={p.x+25} y={p.y+10} fontSize="33" fill="#234d3e">{p.name}</text>}</g>)}
  {large&&<>{roads.filter(r=>r.name&&r.name!=='Ngõ khu phố'&&r.name!=='Ngõ tuổi thơ').map((r,i)=><text key={i} x={r.label[0]} y={r.label[1]} fontSize="26" fill="#385b41" transform={`rotate(${r.angle||0} ${r.label[0]} ${r.label[1]})`}>{r.name}</text>)}<text x="1640" y="2200" fontSize="35" fill="#385b41">Đầm Rau Câu</text><text x="3920" y="150" fontSize="42" fill="#385b41">BẮC ↑</text></>}
 </>,[large]);
 return <>{large&&<div className="map-controls"><button onClick={()=>setOverview(false)} className={!overview?'primary':''}>Bạn & điểm đến</button><button onClick={()=>setOverview(true)} className={overview?'primary':''}>Toàn khu phố</button><small>Vàng: bạn · Đỏ: điểm đến</small></div>}<svg viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} role="img" aria-label="Bản đồ khu vực Quảng Yên, vị trí của bạn và điểm đến" onClick={e=>{if(!large||state.inside)return;const matrix=e.currentTarget.getScreenCTM();if(!matrix)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());if(p.x<0||p.y<0||p.x>WORLD.width||p.y>WORLD.height)return;scene?.setDestination(p.x,p.y);refresh(v=>v+1);setOverview(false);onDestination()}}>
  {scenery}
  {destination&&(()=>{const route=walkingRoute(player,destination);return route?<polyline points={points(route)} fill="none" stroke="#b34f48" strokeWidth={large?7:14} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={large?'14 10':'28 18'}/>:<line x1={player.x} y1={player.y} x2={destination.x} y2={destination.y} stroke="#b34f48" strokeWidth={large?5:12} strokeDasharray="18 14"/>})()}
  <circle cx={state.inside?(state.room==='classroom'?SCHOOL_DOOR.x:HOME_DOOR.x):state.x} cy={state.inside?(state.room==='classroom'?SCHOOL_DOOR.y:HOME_DOOR.y):state.y} r="34" fill="#f7d879" stroke="#244f40" strokeWidth="12"/>
  {destination&&<g><circle cx={destination.x} cy={destination.y} r="35" fill="#fff7df" stroke="#b34f48" strokeWidth="12"/>{large&&<text x={destination.x} y={destination.y-55} textAnchor="middle" fontSize="26" fontWeight="bold" fill="#8b302b" stroke="#fff7df" strokeWidth="5" paintOrder="stroke">Điểm đến</text>}</g>}
  {large&&<text x={player.x} y={player.y+70} textAnchor="middle" fontSize="26" fontWeight="bold" fill="#244f40" stroke="#fff7df" strokeWidth="5" paintOrder="stroke">Bạn đang ở đây</text>}

 </svg></>
}
