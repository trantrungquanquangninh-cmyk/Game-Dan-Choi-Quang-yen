import {drawRoads,drawWalkways} from './drawRoads';
import {vehicleSpeed} from './finance';
import {makeTraffic,stepMover,moverPos,type Mover} from './traffic';
import {onAsphalt} from './walkways';
import {jobTick,collectScrap,scrapLeft,jobTargets,scrapCapacity} from './sidejobs';
import {SPOTS,navPass,routeField,routeFrom,routeLength,nearestWalkable,type RouteField} from './walkways';
import {withinView,STATIC_UPDATE_MS,type Bounds} from './renderBudget';
import {drawBuilding} from './drawBuilding';
import Phaser from 'phaser';
import {buildings,npcData,WORLD} from './data';
import {state,change,save,tickFamily} from './state';
import {tickLife,rollMidnight,canLeaveSchool,markHomeReturn,dailyTask} from './activities';
import {doorOf} from './navigation';
import {roads,pond,green,park,landmarks,MAP_OFFSET,mapLabels,trees} from './mapLayout';
import {canWalk,atHomeExit,recoverPosition,migrateMapPosition,HOME_RETURN,STREET_SPAWN,HOME_DOOR,SHOP_DOOR,SCHOOL_DOOR,HOME_OBSTACLES,CLASSROOM_OBSTACLES,outsideSpawn} from './navigation';
export type GameEvent = {type:'interact';id:string}|{type:'panel';id:string}|{type:'near';id:string;name:string}|{type:'arrived'}|{type:'notice';text:string};
export let scene:TownScene|undefined;
type Rect={x:number;y:number;w:number;h:number};
type StaticImage={image:Phaser.GameObjects.Image;bounds:Bounds};
type CachedWorld={layer:Phaser.GameObjects.Container;obstacles:Rect[];npcs:TownScene['npcs'];player:Phaser.GameObjects.Container;night:Phaser.GameObjects.Rectangle;weather:Phaser.GameObjects.Graphics;images:StaticImage[]};
export class TownScene extends Phaser.Scene {
 guideGround?:Phaser.GameObjects.Container; guideHead?:Phaser.GameObjects.Graphics; guideText?:Phaser.GameObjects.Text;
 scrapGfx?:Phaser.GameObjects.Graphics; markGfx?:Phaser.GameObjects.Graphics; jobKey='';
 traffic:{m:Mover;body:Phaser.GameObjects.Container}[]=[];
 route?:RouteField; routeKey=''; trail?:Phaser.GameObjects.Graphics; lastTrail=-Infinity;
 companion?:Phaser.GameObjects.Container; staticImages:StaticImage[]=[]; worldCache=new Map<string,CachedWorld>(); currentWorld?:string; lastStaticUpdate=-Infinity;

 player!:Phaser.GameObjects.Container; npcs:{id:string;body:Phaser.GameObjects.Container;x:number;y:number}[]=[]; obstacles:Rect[]=[]; keys:Record<string,Phaser.Input.Keyboard.Key>={}; walk=0; lastTime=0; near=''; zoomLevel=1; worldLayer!:Phaser.GameObjects.Container; night!:Phaser.GameObjects.Rectangle; weather!:Phaser.GameObjects.Graphics; marker?:Phaser.GameObjects.Container; destination?:{x:number;y:number}; send:(e:GameEvent)=>void; blocked=false;
 constructor(send:(e:GameEvent)=>void){super('Town');this.send=send;scene=this}
 create(){this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.worldCache.clear();this.staticImages=[]});this.cameras.main.setBackgroundColor('#abc27f');this.input.keyboard!.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);for(const k of ['W','A','S','D','UP','DOWN','LEFT','RIGHT','SHIFT','E','I','M','J','C','F','H','V','ESC','PLUS','MINUS','K'])this.keys[k]=this.input.keyboard!.addKey(k);this.keys.E.on('down',()=>this.interact());for(const [k,id]of Object.entries({F:'family',I:'inventory',M:'map',J:'quests',C:'character',H:'activities',V:'wallet',K:'jobs',ESC:'pause'}))this.keys[k].on('down',()=>this.send({type:'panel',id}));this.scale.on('resize',()=>this.fitCamera());this.build();this.lastTime=this.time.now;}
 rect(x:number,y:number,w:number,h:number,c:number,r=0){const g=this.add.graphics();g.fillStyle(c);r?g.fillRoundedRect(x,y,w,h,r):g.fillRect(x,y,w,h);this.worldLayer.add(g);return g}
 label(x:number,y:number,text:string,size=14,color='#fff8e5'){const t=this.add.text(x,y,text,{fontFamily:'Segoe UI, sans-serif',fontSize:size,color,stroke:'#314f42',strokeThickness:3}).setOrigin(.5);this.worldLayer.add(t);return t}
 solid(x:number,y:number,w:number,h:number){this.obstacles.push({x,y,w,h})}
 person(x:number,y:number,color:number,child=false,hair=0x3e302d){const c=this.add.container(x,y);const g=this.add.graphics();g.fillStyle(0x294b35,.19).fillEllipse(0,5,28,11);g.fillStyle(0x394f52).fillRoundedRect(-9,-8,7,15,3).fillRoundedRect(3,-8,7,15,3);g.fillStyle(color).fillRoundedRect(-12,-30,24,26,7);g.fillStyle(0xe8b78b).fillRoundedRect(-17,-26,6,19,3).fillRoundedRect(11,-26,6,19,3).fillCircle(0,-41,14);g.fillStyle(hair).fillEllipse(0,-49,29,15).fillRect(-14,-49,5,13);g.fillStyle(0x382e2a).fillCircle(-5,-40,1.5).fillCircle(5,-40,1.5);g.lineStyle(1,0xb67561).lineBetween(-3,-34,3,-34);c.add(g);c.setScale(child?.8:1);this.worldLayer.add(c);return c}
 tree(x:number,y:number){const first=this.worldLayer.length;this.rect(x-13,y-5,50,15,0x718b58,8);this.rect(x-5,y-45,10,49,0x8f7754,3);const g=this.add.graphics();g.fillStyle(0x507954).fillCircle(x,y-63,35);g.fillStyle(0x68955f).fillCircle(x-13,y-79,29).fillCircle(x+17,y-71,27);g.fillStyle(0x7da66b).fillCircle(x-11,y-88,19);this.worldLayer.add(g);this.solid(x-12,y-12,24,22);for(const child of this.worldLayer.list.slice(first))(child as Phaser.GameObjects.Graphics).setDepth(y)}
 building(b:typeof buildings[number]){drawBuilding(this,b)}
 classroom(){
  this.rect(0,0,1000,720,0x546c60);this.rect(150,130,700,480,0xe4d5aa,8);
  this.rect(150,100,700,80,0xf1e3be);this.rect(150,100,20,510,0xc6b590);this.rect(830,100,20,510,0xc6b590);this.rect(150,590,290,20,0xc6b590);this.rect(560,590,290,20,0xc6b590);
  this.obstacles=CLASSROOM_OBSTACLES.map(r=>({...r}));
  this.rect(340,175,320,55,0x527e66,6);this.label(500,199,'LỚP MẪU GIÁO HOA NẮNG',17);
  for(const x of [290,455,620]){this.rect(x,325,90,40,0xbd986c,6);this.rect(x+12,320,25,20,0xf5e4ae,2)}
  this.rect(465,420,70,40,0xd4b778,6);this.label(500,404,'Góc học tập · E',13);this.label(500,630,'Ra cổng trường · đi xuống cửa',14);
 }
 syncCompanion(){if(state.education.escorted&&!state.inside){this.companion=this.person(this.player.x+35,this.player.y+10,0xcc797b);const label=this.label(0,-66,'M\u1eb9 \u0111i c\u00f9ng',12);this.worldLayer.remove(label);this.companion.add(label)}}
 workplaces(inside:boolean){
  if(inside){this.rect(386,321,124,27,0xb28860,4);for(let i=0;i<3;i++)this.rect(400+i*28,309,18,17,[0xc87d76,0x6b9b99,0xdcbb6f][i],3);this.label(448,290,'Góc may của mẹ',12);this.label(650,322,'Sổ gia đình · E',12)}
  else{const dad=npcData.find(n=>n.id==='dad')!;this.rect(dad.x-55,dad.y+23,110,28,0xa68159,4);this.rect(dad.x-36,dad.y+15,65,10,0xd6bc8c,2);this.label(dad.x,dad.y+75,'Bàn mộc của bố',12)}
 }
 build(){
  this.companion?.destroy();this.companion=undefined;
  if(this.worldLayer){this.marker?.destroy();this.worldLayer.setVisible(false);this.worldCache.set(this.currentWorld!,{layer:this.worldLayer,obstacles:this.obstacles,npcs:this.npcs,player:this.player,night:this.night,weather:this.weather,images:this.staticImages})}
  const inside=state.inside;migrateMapPosition(state);const worldKey=inside?state.room:'street';this.currentWorld=worldKey;this.near='';this.send({type:'near',id:'',name:''});this.marker=undefined;this.lastStaticUpdate=this.time.now;
  this.cameras.main.removeBounds();
  const cached=this.worldCache.get(worldKey);
  if(cached){this.worldLayer=cached.layer;this.obstacles=cached.obstacles;this.npcs=cached.npcs;this.player=cached.player;this.night=cached.night;this.weather=cached.weather;this.staticImages=cached.images;for(const item of this.staticImages)item.image.setVisible(true);this.worldLayer.setVisible(true);const p=recoverPosition(inside,state.x,state.y,this.obstacles);Object.assign(state,p);this.player.setPosition(p.x,p.y);this.syncCompanion();this.fitCamera();this.afterBuild();return}
  this.worldLayer=this.add.container(0,0);this.obstacles=[];this.npcs=[];this.staticImages=[];
  if(inside&&state.room==='classroom')this.classroom();else if(inside){this.interior();this.obstacles=HOME_OBSTACLES.map(r=>({...r}))}else this.exterior();
  if(!inside||state.room==='home')this.workplaces(inside);const p=recoverPosition(inside,state.x,state.y,this.obstacles);Object.assign(state,p);this.player=this.person(p.x,p.y,state.shirt,true,state.hair);
  for(const n of (inside&&state.room==='classroom'?[{...npcData.find(n=>n.id==='teacher')!,x:500,y:260},{...npcData.find(n=>n.id==='nam')!,x:330,y:470}]:npcData.filter(n=>!!n.inside===inside))){const body=this.person(n.x,n.y,n.color,n.id==='nam');this.npcs.push({id:n.id,body,x:n.x,y:n.y});const label=this.label(0,-65,n.name,13);this.worldLayer.remove(label);body.add(label)}
  this.syncCompanion();this.fitCamera();this.night=this.add.rectangle(0,0,this.scale.width,this.scale.height,0x18264a,0).setOrigin(0).setScrollFactor(0).setDepth(10000);this.weather=this.add.graphics().setScrollFactor(0).setDepth(10001);this.worldLayer.add([this.night,this.weather]);this.afterBuild();
 }
 /** Re-attach the guide arrow to the active world and restore the destination marker. */
 afterBuild(){this.ensureGuide();if(state.inside)this.destination=undefined;const task=dailyTask(state);if(task.place==='home'&&['slot:home','slot:recover','slot:school'].includes(task.key))this.destination={...HOME_DOOR};else if(task.key==='slot:school'&&!state.inside)this.destination={...SCHOOL_DOOR};for(const o of [this.guideGround!,this.guideText!]){o.parentContainer?.remove(o);this.worldLayer.add(o)}if(!state.inside&&this.destination)this.setDestination(this.destination.x,this.destination.y)}
 ensureGuide(){if(this.guideGround)return;
  // A flat ring and arrow painted on the ground under the player's feet.
  const ground=this.add.container(0,0).setScale(1,.62);const ring=this.add.graphics();ring.fillStyle(0xffd65a,.2).fillEllipse(0,0,58,58);ring.lineStyle(3,0xffd65a,.95).strokeCircle(0,0,29);ring.lineStyle(1.5,0x7a5a1c,.5).strokeCircle(0,0,32);
  const head=this.add.graphics();const tri=[{x:36,y:-22},{x:86,y:0},{x:36,y:22},{x:44,y:0}];head.fillStyle(0x1d3b2e,.4).fillPoints(tri.map(p=>({x:p.x+3,y:p.y+4})),true);head.fillStyle(0xffd65a,1).fillPoints(tri,true);head.lineStyle(3,0x7a5418,1).strokePoints(tri,true);head.fillStyle(0xfff3c4,1).fillTriangle(44,-8,74,0,44,0);
  ground.add([ring,head]);const text=this.add.text(0,0,'',{fontFamily:'Be Vietnam Pro, Segoe UI, sans-serif',fontSize:12,fontStyle:'bold',color:'#fff6d6',stroke:'#24463a',strokeThickness:4}).setOrigin(.5,1);
  this.guideGround=ground;this.guideHead=head;this.guideText=text}
 updateGuide(time:number){const g=this.guideGround,head=this.guideHead,text=this.guideText;if(!g||!head||!text)return;const d=this.destination;
  if(!d){g.setVisible(false);text.setVisible(false);return}
  // Indoors (home or classroom) the arrow points to the door first.
  let tx=state.inside?500:d.x,ty=state.inside?600:d.y,dist=Math.hypot(tx-this.player.x,ty-this.player.y);
  if(!state.inside&&dist<70){this.destination=undefined;this.route=undefined;this.trail?.clear();this.marker?.destroy();this.marker=undefined;g.setVisible(false);text.setVisible(false);this.send({type:'arrived'});return}
  // Outdoors the arrow follows the sidewalk route (crossing only at zebras).
  if(!state.inside){const field=this.routeTo(d);if(field){const path=routeFrom(field,this.player.x,this.player.y,40);const ahead=path[Math.min(path.length-1,8)];if(ahead&&path.length>1){tx=ahead[0];ty=ahead[1]}const len=routeLength(field,this.player.x,this.player.y);if(len>=0)dist=len;if(time-this.lastTrail>250)this.drawTrail(field)}}
  const dx=tx-this.player.x,dy=ty-this.player.y;
  g.setVisible(true).setPosition(this.player.x,this.player.y+4).setDepth(this.player.y-1);head.rotation=Math.atan2(dy/.62,dx);head.setScale(1+Math.sin(time*.008)*.08);
  text.setVisible(true).setText(state.inside?'Ra cửa':Math.max(1,Math.round(dist/8))+' m').setPosition(this.player.x,this.player.y-78).setDepth(this.player.y+2);
  this.marker?.setScale(1+Math.sin(time*.006)*.15)}
 /** Pedestrians on the sidewalks, motorbikes and cars on the streets. */
 spawnTraffic(){this.traffic=[];for(const m of makeTraffic()){const p=moverPos(m);let body:Phaser.GameObjects.Container;
  if(m.kind==='walker')body=this.person(p.x,p.y,m.color,false,m.hair);
  else{body=this.add.container(p.x,p.y);const g=this.add.graphics();if(m.kind==='car'){g.fillStyle(0x223029,.25).fillRoundedRect(-27,-11,58,28,8);g.fillStyle(0x2b2f33).fillRect(-20,-15,11,30).fillRect(10,-15,11,30);g.fillStyle(m.color).fillRoundedRect(-28,-13,56,26,8);g.fillStyle(0x9cc3cf).fillRoundedRect(4,-10,13,20,3).fillRoundedRect(-19,-10,9,20,3);g.fillStyle(0xffffff,.25).fillRoundedRect(-8,-11,11,22,3);g.fillStyle(0xfff3b0).fillCircle(27,-8,2.5).fillCircle(27,8,2.5)}
   else{g.fillStyle(0x223029,.25).fillEllipse(2,4,40,14);g.fillStyle(0x2b2f33).fillRoundedRect(-18,-3,10,6,3).fillRoundedRect(9,-3,10,6,3);g.fillStyle(m.color).fillRoundedRect(-12,-5,22,10,4);g.fillStyle(0x394f52).fillRect(10,-7,3,14);g.fillStyle(0x5b6f7a).fillRoundedRect(-8,-7,12,14,5);g.fillStyle(0xe1e6e0).fillCircle(-2,0,6);g.fillStyle(0x394f52).fillCircle(-1,0,4)}
   body.add(g);body.setScale(1.35);this.worldLayer.add(body)}
  this.traffic.push({m,body})}}
 updateTraffic(dt:number,time:number){const px=this.player.x,py=this.player.y,onRoad=onAsphalt(px,py);const blocked=(x:number,y:number)=>onRoad&&Math.hypot(x-px,y-py)<40;
  for(const t of this.traffic){const moved=stepMover(t.m,dt,blocked);const p=moverPos(t.m);t.body.setPosition(p.x,p.y).setDepth(p.y);
   if(t.m.kind==='walker'){(t.body.first as Phaser.GameObjects.Graphics).rotation=Math.sin(time*.012+t.m.id)*.06}else if(moved)t.body.setRotation(p.angle)}}
 /** Bottles on the sidewalks and blue hand-over markers for the active job. */
 syncJobVisuals(time:number){if(state.inside)return;
  for(const [k,depth]of [['scrapGfx',3],['markGfx',3500]] as const){const g=this[k];if(!g||g.parentContainer!==this.worldLayer){g?.destroy();this[k]=this.add.graphics().setDepth(depth);this.worldLayer.add(this[k]!);this.jobKey=''}}
  this.markGfx!.setAlpha(.75+Math.sin(time*.006)*.25);
  const day=state.minutes>=360&&state.minutes<=1200,left=day?scrapLeft(state):[],targets=jobTargets(state);
  const key=state.day+'|'+left.map(p=>p.id).join(',')+'|'+targets.map(t=>t.id).join(',');if(key===this.jobKey)return;this.jobKey=key;
  const g=this.scrapGfx!.clear();for(const p of left){g.fillStyle(0x2c3d33,.25).fillEllipse(p.x+2,p.y+3,18,7);if(p.id%2){g.fillStyle(0x6fb3a8).fillRoundedRect(p.x-4,p.y-13,8,15,2);g.fillStyle(0xe4efe8).fillRect(p.x-2,p.y-17,4,4)}else{g.fillStyle(0xc7584f).fillRoundedRect(p.x-5,p.y-9,10,11,2);g.fillStyle(0xd9d4c8).fillRect(p.x-5,p.y-9,10,2)}}
  const m=this.markGfx!.clear();for(const t of targets){m.fillStyle(0x3f88c5,.22).fillEllipse(t.x,t.y,64,28);m.lineStyle(3,0x3f88c5).strokeEllipse(t.x,t.y,64,28);m.fillStyle(0x3f88c5).fillPoints([{x:t.x,y:t.y-78},{x:t.x+12,y:t.y-62},{x:t.x,y:t.y-46},{x:t.x-12,y:t.y-62}],true);m.fillStyle(0xffffff).fillCircle(t.x,t.y-62,4)}}
 /** Distance field to the destination over the pedestrian network (cached). */
 routeTo(d:{x:number;y:number}){const key=Math.round(d.x)+','+Math.round(d.y)+':'+this.currentWorld;if(this.routeKey!==key){this.routeKey=key;this.route=routeField(d.x,d.y,navPass(this.obstacles))??undefined}return this.route}
 /** Dotted footprints along the next stretch of the route. */
 drawTrail(field:RouteField){this.lastTrail=this.time.now;if(!this.trail){this.trail=this.add.graphics()}if(this.trail.parentContainer!==this.worldLayer){this.trail.parentContainer?.remove(this.trail);this.worldLayer.add(this.trail)}this.trail.setDepth(2);const g=this.trail.clear(),path=routeFrom(field,this.player.x,this.player.y,90);for(let i=6;i<path.length-1;i+=4){const [x,y]=path[i];g.fillStyle(0xffd65a,.85-i/140).fillCircle(x,y,4);g.lineStyle(1.5,0x7a5418,.5-i/240).strokeCircle(x,y,4)}}
 exterior(){
 // A real Phaser tilemap ground layer; the illustrated objects are separate layers.
 if(!this.textures.exists('grass')){const tile=this.make.graphics({x:0,y:0});tile.fillStyle(0xa8be7c).fillRect(0,0,32,32);tile.fillStyle(0xb0c383).fillRect(7,12,2,3);tile.generateTexture('grass',32,32);tile.destroy()}const map=this.make.tilemap({data:Array.from({length:WORLD.height/32},()=>Array(WORLD.width/32).fill(0)),tileWidth:32,tileHeight:32});const tiles=map.addTilesetImage('grass');if(tiles){const layer=map.createLayer(0,tiles,0,0);if(layer){this.worldLayer.addAt(layer,0);layer.setCullPadding(2,2)}}
 const terrain=this.add.graphics();this.worldLayer.add(terrain);
 const polygon=(points:[number,number][],color:number)=>{terrain.fillStyle(color);terrain.fillPoints(points.map(([x,y])=>({x,y})),true)};
 polygon(green,0x92b77e);polygon(park,0x86b580);polygon(pond,0x6eaaa6);terrain.lineStyle(8,0xc6d4a2);terrain.strokePoints(pond.map(([x,y])=>({x,y})),true);
 drawRoads(terrain);
 const paths=this.add.graphics().setDepth(1);this.worldLayer.add(paths);drawWalkways(paths);
 for(const b of buildings)this.building(b);
 // Small garden with a pergola and a stone bench, on its own paved plaza.
 {const b=SPOTS.bench;this.rect(b.x-88,b.y-86,176,96,0xb8c68b,22);this.rect(b.x-70,b.y-76,96,52,0xd7bc86,12);this.rect(b.x-62,b.y-70,7,40,0xa78760);this.rect(b.x+10,b.y-70,7,40,0xa78760);this.rect(b.x-62,b.y-72,79,5,0xa78760);this.rect(b.x-40,b.y-62,30,5,0xf1d88e);this.rect(b.x+28,b.y-30,52,12,0xb88a5d,4)}
 // Neighbourhood job board where side jobs are taken.
 {const b=SPOTS.board,g=this.add.graphics();g.fillStyle(0x2c3d33,.25).fillEllipse(b.x,b.y-4,74,12);g.fillStyle(0x6f5034).fillRect(b.x-29,b.y-54,6,50).fillRect(b.x+23,b.y-54,6,50);g.fillStyle(0x9d7449).fillRoundedRect(b.x-36,b.y-80,72,38,4);g.lineStyle(2,0x6f5034).strokeRoundedRect(b.x-36,b.y-80,72,38,4);g.fillStyle(0xf4ead0).fillRect(b.x-29,b.y-75,17,13).fillRect(b.x-8,b.y-73,18,15).fillRect(b.x+14,b.y-76,15,12);g.fillStyle(0xd9573f).fillCircle(b.x-21,b.y-74,2).fillCircle(b.x+1,b.y-72,2).fillCircle(b.x+21,b.y-75,2);g.setDepth(b.y-4);this.worldLayer.add(g);this.label(b.x,b.y-92,'VIỆC VẶT · E',12).setDepth(4000)}
 for(const point of landmarks){if(point.kind==='well'){const well=this.add.graphics();well.fillStyle(0x879889).fillEllipse(point.x,point.y,65,35);well.fillStyle(0x557f7d).fillEllipse(point.x,point.y-5,42,20);this.worldLayer.add(well)}this.label(point.x,point.y+38,point.name,16).setDepth(4000)}
 for(const [x,y]of trees)this.tree(x,y);
 for(const road of roads.filter(r=>r.name)){const label=this.label(road.label[0],road.label[1],road.name,13,'#fff9dc');label.setAngle(road.angle||0).setDepth(2600)}
 for(const label of mapLabels)this.label(label.x,label.y,label.name,label.name==='B\u1eaeC'?16:20).setDepth(2600);
 this.label(2868,2180,'M\u1ea7m non - khu v\u1ef1c tham chi\u1ebfu',12).setDepth(2600);
 this.spawnTraffic();
 this.worldLayer.sort('depth');

 }
 interior(){this.rect(0,0,1000,720,0x546c60);this.rect(150,130,700,480,0xe3c99f,8);for(let y=145;y<610;y+=32){this.rect(150,y,700,1,0xc5a781);for(let x=160+(y%64);x<850;x+=100)this.rect(x,y,1,32,0xc5a781)}this.rect(150,100,700,80,0xf1e3be);this.rect(150,100,20,510,0xc6b590);this.rect(830,100,20,510,0xc6b590);this.rect(150,590,290,20,0xc6b590);this.rect(560,590,290,20,0xc6b590);this.solid(150,100,700,80);this.solid(150,100,20,510);this.solid(830,100,20,510);this.solid(150,590,290,20);this.solid(560,590,290,20);this.rect(220,210,150,180,0x9c7957,8);this.rect(227,245,136,137,0x7c9c90,6);this.rect(236,220,52,38,0xf4e9ca,8);this.rect(302,220,52,38,0xf4e9ca,8);this.solid(220,210,150,180);this.label(295,410,'Giường · E để ngủ',13);this.rect(600,230,120,65,0xb88b5d,8);this.solid(600,230,120,65);this.rect(622,237,24,32,0xe9d7ac,2);this.rect(670,243,25,16,0x73977a,4);this.rect(690,440,100,60,0xc28764,12);this.solid(690,440,100,60);this.rect(430,410,170,110,0xc69476,12);this.rect(440,420,150,90,0xd7aa85,10);this.rect(700,130,65,50,0x80a6a0,2);this.rect(730,130,4,50,0xf4e6c8);this.label(500,140,'NHÀ CỦA MÌNH',17);this.label(500,630,'Ra khu phố · E',15);}
 fitCamera(){this.zoomLevel=1;const camera=this.cameras.main;camera.removeBounds();camera.setZoom(1);if(this.player){camera.startFollow(this.player,true,1,1);camera.centerOn(this.player.x,this.player.y)}}
 valid(x:number,y:number){return canWalk(state.inside,x,y,this.obstacles)}
 moveScene(inside:boolean,room:'home'|'classroom'='home'){const leavingSchool=state.inside&&state.room==='classroom';change(s=>{s.inside=inside;s.room=room;Object.assign(s,inside?(room==='classroom'?{x:500,y:520}:HOME_RETURN):outsideSpawn(leavingSchool?'classroom':'home'));if(!inside)s.education.active=false});markHomeReturn(state);this.zoomLevel=1;this.build();save()}
 goToSchool(){change(s=>{s.inside=false;s.room='home';s.education.escorted=true;s.minutes=Math.max(480,s.minutes);s.x=SCHOOL_DOOR.x;s.y=SCHOOL_DOOR.y+35});this.build();save()}
 interact(){if(this.blocked)return;if(this.near==='exit'&&!canLeaveSchool(state)){this.send({type:'interact',id:'teacher'});return}if(this.near==='exit')this.moveScene(false);else if(this.near==='home')this.moveScene(true);else if(this.near)this.send({type:'interact',id:this.near})}
 setDestination(x:number,y:number){if(!state.inside){const p=nearestWalkable(x,y,(px,py)=>this.valid(px,py),500);if(p){x=p.x;y=p.y}}this.destination={x,y};this.trail?.clear();this.marker?.destroy();if(state.inside)return;this.marker=this.add.container(x,y);const g=this.add.graphics();g.fillStyle(0xffd65a,.25).fillEllipse(0,0,54,26);g.lineStyle(3,0xffd65a).strokeEllipse(0,0,54,26);g.fillStyle(0xd9573f).fillCircle(0,-34,11).fillTriangle(-9,-28,9,-28,0,-10);g.fillStyle(0xfff4d6).fillCircle(0,-34,4);this.marker.add(g);this.marker.setDepth(y);this.worldLayer.add(this.marker)}
 update(time:number,delta:number){if(!this.player)return;if(state.education.safety.status==='abducted'){this.blocked=true;return;}const dt=Math.min(delta,50)/1000;if(this.blocked)return;let dx=0,dy=0;if(this.keys.W.isDown||this.keys.UP.isDown)dy--;if(this.keys.S.isDown||this.keys.DOWN.isDown)dy++;if(this.keys.A.isDown||this.keys.LEFT.isDown)dx--;if(this.keys.D.isDown||this.keys.RIGHT.isDown)dx++;const moving=dx!==0||dy!==0;if(moving){const len=Math.hypot(dx,dy),speed=(this.keys.SHIFT.isDown&&state.energy>5?215:140)*(!state.inside?vehicleSpeed(state):1);dx=dx/len*speed*dt;dy=dy/len*speed*dt;let{x,y}=this.player;if(this.valid(x+dx,y))x+=dx;if(this.valid(x,y+dy))y+=dy;this.player.setPosition(x,y);state.x=x;state.y=y;this.walk+=dt*(speed/16);this.player.first&&((this.player.first as Phaser.GameObjects.Graphics).rotation=Math.sin(this.walk)*.06);state.energy=Math.max(0,state.energy-dt*(this.keys.SHIFT.isDown&&state.energy>5?.12:.025));}else (this.player.first as Phaser.GameObjects.Graphics).rotation=Math.sin(time*.002)*.012;
 if(!state.inside)this.updateTraffic(dt,time);
 if(!state.inside){const msg=jobTick(state,dt,moving&&this.keys.SHIFT.isDown&&state.energy>5);if(msg){this.send({type:'notice',text:msg});save()}const got=collectScrap(state);if(got)this.send({type:'notice',text:'Nhặt được '+got+' ve chai · túi '+state.jobs.bag+'/'+scrapCapacity(state)+'. Bán cho bà Tư ở Chợ Rừng.'})}
 if(state.inside&&atHomeExit(this.player.x,this.player.y)){if(!canLeaveSchool(state)){this.player.setPosition(this.player.x,560);state.y=560;this.send({type:'interact',id:'teacher'});return}this.moveScene(false);return;}
 if(this.companion){const x=this.player.x+35,y=this.player.y+12;if(this.valid(x,y))this.companion.setPosition(x,y);this.companion.setDepth(this.companion.y)}this.player.setDepth(this.player.y);for(const n of this.npcs){if(n.id!=='mom'&&n.id!=='lan'&&!(n.id==='dad'&&state.minutes>=480&&state.minutes<1020&&state.day%7!==0)){const night=state.minutes>18*60;const nx=n.x+Math.sin(time*.00025+n.x)*(!night?32:6),ny=n.y+Math.cos(time*.0003+n.y)*10;if(this.valid(nx,ny))n.body.setPosition(nx,ny)}n.body.setDepth(n.body.y)}
 if(time-this.lastStaticUpdate>=STATIC_UPDATE_MS){for(const n of this.npcs.filter(n=>n.id==='mom'||n.id==='dad')){const working=state.minutes>=480&&state.minutes<1020&&state.day%7!==0;const label=n.body.list.find(o=>o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text|undefined;const text=npcData.find(p=>p.id===n.id)!.name+' - '+(working?'Đang làm việc':'Nghỉ / chuẩn bị đơn');if(label&&label.text!==text)label.setText(text);(n.body.first as Phaser.GameObjects.Graphics).rotation=working?Math.sin(time*.008)*.035:0}this.syncJobVisuals(time);this.worldLayer.sort('depth');const view=this.cameras.main.worldView;for(const item of this.staticImages)item.image.setVisible(withinView(item.bounds,view));this.lastStaticUpdate=time}
 this.updateGuide(time);
 let target='',name='';let distance=80;const find=(id:string,label:string,x:number,y:number)=>{const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,x,y);if(d<distance){distance=d;target=id;name=label}};for(const n of this.npcs)find(n.id,npcData.find(a=>a.id===n.id)!.name,n.body.x,n.body.y);if(state.inside&&state.room==='classroom'){find('teacher','C\u00f4 Mai - v\u00e0o l\u1edbp',500,410);find('exit','Ra c\u1ed5ng tr\u01b0\u1eddng',500,575)}else if(state.inside){find('exit','Ra khu ph\u1ed1',500,575);find('family','Sổ thu – chi gia đình',650,320);find('bed','Giường ngủ (từ 21:00)',350,400);find('place:home','Bàn ăn · việc trong nhà',515,465)}else{find('home','Vào nhà',HOME_DOOR.x,HOME_DOOR.y);find('shop','Tạp hóa cô Lan',SHOP_DOOR.x,SHOP_DOOR.y);find('school','Mầm non Hoa Nắng',SCHOOL_DOOR.x,SCHOOL_DOOR.y);find('bench','Ngồi nghỉ',SPOTS.bench.x,SPOTS.bench.y);const cafe=doorOf('cafe'),neighbor=doorOf('house3');find('place:cafe','Cà phê đầu ngõ · anh Tú',cafe.x,cafe.y);find('place:neighbor','Nhà cô Hằng hàng xóm',neighbor.x,neighbor.y)}if(!state.inside){for(const p of landmarks)find('landmark:'+p.id,p.name,p.x,p.y);find('board','Bảng việc vặt khu phố',SPOTS.board.x,SPOTS.board.y);
  // Job hand-over points win over the shop/NPC at the same door.
  for(const t of jobTargets(state)){const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,t.x,t.y)-25;if(d<distance){distance=d;target='job:'+t.id;name=t.label}}}if(this.near!==target){this.near=target;this.send({type:'near',id:target,name:target==='exit'?'Ra khu phố':name})}
 state.minutes+=dt*1.2;tickFamily();rollMidnight(state);tickLife(state);const hour=state.minutes/60;this.night.setSize(this.scale.width,this.scale.height).setAlpha(state.inside?0:hour<5||hour>20?.46:hour>17?.2:0);this.weather.clear();if(!state.inside&&state.day%4===2){this.weather.lineStyle(1,0xd1ebeb,.4);for(let i=0;i<80;i++){const x=(i*131+time*.15)%this.scale.width,y=(i*97+time*.4)%this.scale.height;this.weather.lineBetween(x,y,x-4,y+12)}}if(time-this.lastTime>1000){change(()=>{});this.lastTime=time} }
}
export function createGame(parent:HTMLElement,send:(e:GameEvent)=>void){return new Phaser.Game({type:Phaser.AUTO,parent,backgroundColor:'#a8be7c',scale:{mode:Phaser.Scale.RESIZE,width:parent.clientWidth,height:parent.clientHeight},render:{antialias:true,pixelArt:false},scene:new TownScene(send),audio:{noAudio:true}})}
