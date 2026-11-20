// Original game geometry interpreted from the map screenshot supplied by the
// user. North is up. These are schematic game coordinates, not survey/GPS data.
export type Point = [number,number];
export const MAP_OFFSET={x:1400,y:480};
/** Paved sidewalk width on each side of every street (world px). */
export const SIDEWALK=28;
export type Road = {name:string;width:number;points:Point[];label:Point;angle?:number;major?:boolean};
export const MAP_REFERENCE = {lat:20.9384777,lng:106.8072544,name:'Tiệm bánh Om’s Cake',source:'Google Maps link and screenshot supplied by the user',precision:'schematic' as const};
export const roads:Road[] = [
 {name:'Trần Khánh Dư',width:65,major:true,points:[[0,655],[200,710],[485,925],[910,950],[1500,780],[2040,630],[2560,505]],label:[1110,930],angle:-15},
 {name:'Ngô Quyền',width:42,points:[[140,0],[100,260],[55,510],[0,700]],label:[100,310],angle:-79},
 {name:'Phạm Ngũ Lão',width:38,points:[[80,790],[360,1140],[870,1220],[1330,1250],[1520,840]],label:[710,1180],angle:8},
 {name:'Tiền Môn',width:32,points:[[200,1090],[125,1430],[670,1510],[1090,1740]],label:[430,1470],angle:9},
 {name:'Yết Kiêu',width:34,points:[[1000,1230],[960,1530],[925,1910]],label:[1015,1580],angle:-84},
 {name:'Ngõ khu phố',width:28,points:[[1460,20],[1480,350],[1500,780]],label:[1515,380],angle:88},
 {name:'',width:24,points:[[320,120],[550,280],[780,410],[960,440],[1070,310],[1180,290],[1475,470]],label:[0,0]},
 {name:'',width:24,points:[[780,410],[490,925]],label:[0,0]},
 {name:'',width:24,points:[[1475,470],[1750,500],[1950,470],[2110,430],[2540,330]],label:[0,0]},
 {name:'',width:24,points:[[1750,500],[1780,695]],label:[0,0]},
 {name:'',width:26,points:[[1780,695],[1840,990],[1890,1190],[2500,1110],[2540,505]],label:[0,0]},
 {name:'',width:24,points:[[1520,840],[1670,1000],[1840,990],[2240,870],[2540,820]],label:[0,0]},
 {name:'',width:24,points:[[1330,1250],[1510,1150],[1710,1200],[1890,1190]],label:[0,0]},
 {name:'',width:24,points:[[1330,1250],[1285,1620]],label:[0,0]},
 // Safe, connected game alley behind the homes: doors never cross buildings.
 {name:'Ngõ tuổi thơ',width:26,points:[[780,410],[865,560],[865,843],[1096,843],[1496,843],[1520,840]],label:[1160,880]},
];
export const pond:Point[]=[[160,1540],[460,1560],[590,1660],[640,1830],[530,1870],[200,1800],[120,1740],[115,1620]];
export const green:Point[]=[[1450,1540],[2030,1360],[2560,1430],[2560,1920],[1410,1920]];
export const mapLabels=[{name:'Đầm Rau Câu',x:360,y:1710},{name:'KHU PHỐ QUẢNG YÊN',x:1110,y:120},{name:'BẮC',x:2420,y:100}];
export const trees:Point[]=[[420,570],[670,250],[1300,230],[1670,230],[2190,390],[2300,1280],[1700,1370],[1750,1590],[1980,1540],[2100,1740],[2360,1620],[770,1690],[740,1420],[600,1330],[70,950]];
// Retain the existing playable eastern neighborhood, and add the western and
// northern streets visible in the two newer reference screenshots.
for(const road of roads){road.points=road.points.map(([x,y])=>[x+MAP_OFFSET.x,y+MAP_OFFSET.y]);road.label=[road.label[0]+MAP_OFFSET.x,road.label[1]+MAP_OFFSET.y]}
for(const polygon of [pond,green,trees])for(const p of polygon){p[0]+=MAP_OFFSET.x;p[1]+=MAP_OFFSET.y}
for(const label of mapLabels){label.x+=MAP_OFFSET.x;label.y+=MAP_OFFSET.y}
roads.push(
 {name:'Lê Lợi',width:62,major:true,points:[[30,1135],[700,1135],[1200,1135],[1400,1135]],label:[820,1115]},
 {name:'Trần Hưng Đạo',width:48,major:true,points:[[0,300],[500,245],[850,260],[1200,390],[1540,480]],label:[720,220],angle:5},
 {name:'Bạch Đằng',width:50,major:true,points:[[100,0],[150,300],[260,750],[320,1135],[310,1710]],label:[225,560],angle:75},
 {name:'Nguyễn Du',width:30,points:[[820,260],[795,670],[770,890],[755,1135]],label:[820,545],angle:93},
 {name:'An Hưng',width:34,points:[[260,750],[500,690],[800,670],[1170,760],[1455,990]],label:[720,645],angle:1},
 {name:'Hồ Xuân Hương',width:28,points:[[580,690],[565,1135]],label:[590,940],angle:92},
 {name:'Trần Nhật Duật',width:28,points:[[1170,760],[1130,1135]],label:[1168,955],angle:96},
 {name:'Lê Lai',width:25,points:[[1300,870],[1260,1135]],label:[1310,1000],angle:98},
 {name:'Lê Hoàn',width:36,points:[[0,1390],[315,1400],[750,1410],[1240,1475],[1450,1510]],label:[790,1390],angle:5},
 {name:'Quang Trung',width:28,points:[[1000,1135],[980,1440],[950,1780]],label:[1010,1335],angle:92},
 {name:'Dã Tượng',width:25,points:[[750,1135],[730,1410],[700,1740]],label:[757,1290],angle:94},
 {name:'Trần Nhân Tông',width:42,points:[[0,1135],[320,1135]],label:[160,1105]},
 {name:'Lê Thánh Tông',width:58,major:true,points:[[2640,0],[2910,260],[3190,510],[3500,700],[3800,760],[4096,750]],label:[3190,450],angle:42},
 {name:'',width:24,points:[[150,300],[750,370],[1200,390]],label:[0,0]},
 {name:'',width:24,points:[[260,900],[565,890],[770,890],[1130,950]],label:[0,0]},
 {name:'',width:24,points:[[315,1240],[730,1250],[980,1280],[1400,1370]],label:[0,0]},
);
/** Streets are drawn ~40% wider than the schematic so walking and traffic read clearly. */
export const ROAD_SCALE=1.4;
for(const road of roads)road.width=Math.round(road.width*ROAD_SCALE);
export const park:Point[]=[[1190,405],[1410,455],[1380,595],[1160,545]];
export const landmarks=[
 {id:'rung-market',name:'Chợ Rừng',x:710,y:1085,kind:'market',description:'Chợ nằm phía bắc trục Lê Lợi trong ảnh tham chiếu. Công trình trong game được cách điệu; chưa có gian hàng mô phỏng riêng.'},
 {id:'quang-yen-park',name:'Công viên Quảng Yên',x:1280,y:510,kind:'park',description:'Công viên ở phía tây Ngô Quyền, phía nam Trần Hưng Đạo theo ảnh bạn cung cấp. Có thể dừng chân nghỉ tại đây.'},
 {id:'rung-well',name:'Giếng Rừng',x:1500,y:300,kind:'well',description:'Điểm tham chiếu Giếng Rừng nằm phía bắc công viên trong ảnh. Hình thức giếng trong game là minh họa, chưa phải phục dựng kiến trúc.'},
 {id:'oms-cake',name:'Om’s Cake',x:2960,y:1500,kind:'bakery',description:'Tiệm bánh được ghim trong link và ảnh tham chiếu. Công trình game minh họa vị trí tương đối phía nam Trần Khánh Dư, không phải mô hình cửa hàng thật.'},
];
export function inPolygon(x:number,y:number,points:Point[]){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a[1]>y)!==(b[1]>y))&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
export function distanceToSegment(x:number,y:number,a:Point,b:Point){const dx=b[0]-a[0],dy=b[1]-a[1];const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)}
