import {roads,pond,green,park,landmarks,MAP_OFFSET,inPolygon,distanceToSegment,SIDEWALK} from './mapLayout';
import {compactBuildings,clearOfRoads,intersects,plotOf} from './buildingLayout';
export const WORLD = { width: 4096, height: 2560, tile: 32 };
export type Building = { id: string; name: string; x: number; y: number; w: number; h: number; color: number; roof: number };
export const buildings: Building[] = [
 {id:'home',name:'Nhà của mình',x:1000,y:650,w:192,h:144,color:0xf1dfaf,roof:0xc9694f},
 {id:'shop',name:'Tạp hóa cô Lan',x:1400,y:590,w:192,h:144,color:0xf3da9e,roof:0x638c7b},
 {id:'school',name:'Mầm non Hoa Nắng',x:1340,y:1450,w:256,h:160,color:0xf1d18c,roof:0x648b99},
 {id:'cafe',name:'Cà phê đầu ngõ',x:2100,y:950,w:176,h:144,color:0xe4b99c,roof:0x9b6151},
 {id:'market',name:'Chợ khu phố',x:650,y:1010,w:256,h:144,color:0xedcea3,roof:0xc36d51},
 {id:'house2',name:'Nhà bác Bình',x:400,y:650,w:176,h:144,color:0xe2c4a2,roof:0x8b7774},
 {id:'house3',name:'Nhà hàng xóm',x:500,y:450,w:176,h:144,color:0xf0d6a4,roof:0xb27758},
 {id:'house4',name:'Nhà gần đầm',x:300,y:1250,w:176,h:144,color:0xe7cd9f,roof:0x708e7b},
 {id:'house5',name:'Nhà vườn',x:2100,y:180,w:176,h:144,color:0xe5ce9e,roof:0x9f7160},
 ];
for(const b of buildings){b.x+=MAP_OFFSET.x;b.y+=MAP_OFFSET.y}
buildings.push(
 {id:'rung-market',name:'Chợ Rừng',x:600,y:900,w:220,h:150,color:0xe5cea0,roof:0xb87559},
 {id:'oms-cake',name:'Om’s Cake',x:2850,y:1320,w:210,h:144,color:0xf2ddc3,roof:0xb78388},
);
// Infill homes are game scenery, not claimed real addresses. Keep road corridors
// and the quest pavement clear so illustrated buildings cannot cover streets.
for(let y=160;y<WORLD.height-160;y+=175)for(let x=240;x<WORLD.width-160;x+=155){
 const w=66,h=64,cx=x+w/2,cy=y+h/2;
 if(inPolygon(cx,cy,pond)||inPolygon(cx,cy,green)||inPolygon(cx,cy,park))continue;
 if(landmarks.some(p=>Math.hypot(p.x-cx,p.y-cy)<120))continue;
 if(x>2400&&x<3000&&y>1480&&y<1730)continue;
 if(roads.some(r=>r.points.slice(1).some((b,i)=>distanceToSegment(cx,cy,r.points[i],b)<r.width/2+SIDEWALK+66)))continue;
 if(buildings.some(b=>x<b.x+b.w+40&&x+w>b.x-40&&y<b.y+b.h+45&&y+h>b.y-40))continue;
 const palette=[0xc48868,0x829a83,0xaa8270,0x81969b];
 buildings.push({id:`block-${x}-${y}`,name:'Nhà dân',x,y,w,h,color:0xe6d6b2,roof:palette[(x+y)%4]});
}
export const npcData = [
 {id:'mom',name:'Mẹ',age:30,job:'Thợ may',personality:'Ân cần',x:450,y:380,inside:true,color:0xcc797b},
 {id:'dad',name:'Bố',age:32,job:'Thợ mộc',personality:'Điềm đạm',x:750,y:940,color:0x658c9a},
 {id:'lan',name:'Cô Lan',age:42,job:'Chủ tạp hóa',personality:'Vui tính',x:1500,y:780,color:0xa17fa6},
 {id:'nam',name:'Bạn Nam',age:4,job:'Mẫu giáo',personality:'Hiếu động',x:1220,y:1110,color:0xe5a352},
 {id:'teacher',name:'Cô Mai',age:26,job:'Giáo viên',personality:'Kiên nhẫn',x:1468,y:1645,color:0x709b87},
 {id:'binh',name:'Bác Bình',age:58,job:'Làm vườn',personality:'Thân thiện',x:1880,y:1370,color:0x8c9a63},
];
for(const n of npcData)if(!n.inside){n.x+=MAP_OFFSET.x;n.y+=MAP_OFFSET.y}
compactBuildings(buildings,WORLD.width,WORLD.height,npcData.filter(n=>!n.inside&&!['lan','teacher'].includes(n.id)).map(n=>[n.x,n.y]));
for(const [id,buildingId]of [['lan','shop'],['teacher','school']]){const n=npcData.find(n=>n.id===id)!,b=buildings.find(b=>b.id===buildingId)!;n.x=b.x+b.w/2;n.y=b.y+b.h+28}
for(const p of landmarks){const b=buildings.find(b=>b.id===p.id);if(b){p.x=b.x+b.w/2;p.y=b.y+b.h+28}}
// Put the father's work area on open land, away from traffic and house plots.
const home=buildings.find(b=>b.id==='home')!,dad=npcData.find(n=>n.id==='dad')!;
const workCandidates:{x:number;y:number}[]=[];
for(let dy=-512;dy<=512;dy+=32)for(let dx=-512;dx<=512;dx+=32)workCandidates.push({x:home.x+home.w/2+dx,y:home.y+home.h+80+dy});
workCandidates.sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-Math.hypot(b.x-home.x,b.y-home.y));
for(const point of workCandidates){const area={x:point.x-65,y:point.y-65,w:130,h:150};if(area.x<20||area.y<20||!clearOfRoads(area)||buildings.some(b=>intersects(area,plotOf(b),8))||inPolygon(point.x,point.y,pond)||inPolygon(point.x,point.y,park))continue;dad.x=point.x;dad.y=point.y;break}
npcData.push({id:'visitor',name:'Người chưa quen',age:35,job:'Khách qua đường',personality:'Chưa rõ',x:1280,y:565,color:0x8d8b9d});
export const items = { milk:{name:'Sữa tươi',price:8000,energy:12}, bread:{name:'Bánh mì',price:7000,energy:18}, snack:{name:'Bánh gạo',price:5000,energy:8} };
export type ItemId = keyof typeof items;
export const questData = [
 {id:'shopping',name:'Một việc nhỏ cho mẹ',description:'Nói chuyện với mẹ, mua sữa và bánh mì ở tạp hóa cô Lan rồi mang về.',reward:'5.000đ · 30 kinh nghiệm'},
 {id:'friend',name:'Người bạn đầu tiên',description:'Tìm bạn Nam ở sân chơi và cùng chơi trò bắt nhịp.',reward:'20 kinh nghiệm · Giao tiếp +5'},
 {id:'learn',name:'Buổi học đầu đời',description:'Gặp cô Mai trước trường và trả lời câu đố của cô.',reward:'25 kinh nghiệm · Trí tuệ +5'},
];
