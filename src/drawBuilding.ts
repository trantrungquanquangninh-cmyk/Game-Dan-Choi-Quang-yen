import type {TownScene} from './game';
import type {Building} from './data';
import {plotOf,collisionOf} from './buildingLayout';

export function drawBuilding(s:TownScene,b:Building){
 const {x,y,w,h}=b,plot=plotOf(b),first=s.worldLayer.length;
 const keys=[`house-${b.id}-plot`,`house-${b.id}-body`];
 const addCached=()=>{for(let i=0;i<2;i++){const image=s.add.image(plot.x,plot.y,keys[i]).setOrigin(0).setDepth(i===0?0:y+h);s.worldLayer.add(image);s.staticImages.push({image,bounds:{x:plot.x,y:plot.y,width:plot.w,height:plot.h}})}const c=collisionOf(b);s.solid(c.x,c.y,c.w,c.h)};
 if(keys.every(key=>s.textures.exists(key))){addCached();return}
 // Roof, shadow and entrance all fit inside this plot. Road clearance is
 // checked against the entire plot, not only the collision rectangle.
 s.rect(plot.x,plot.y,plot.w,plot.h,0xb9c795,6);
 const boundary=s.add.graphics();boundary.lineStyle(1,0x8eaa76,.6).strokeRoundedRect(plot.x,plot.y,plot.w,plot.h,6);s.worldLayer.add(boundary);
 s.rect(x+w/2-10,y+h,20,21,0xd7c7a2,2);
 const bodyStart=s.worldLayer.length;
 s.rect(x+5,y+6,w,h,0x778b65,4);s.rect(x,y,w,h,b.color,4);
 s.rect(x+4,y+h-7,w-8,7,0xbca988);
 const doorW=Math.min(25,w*.23),doorH=h*.43;
 s.rect(x+w/2-doorW/2,y+h-doorH,doorW,doorH,0x78694f,2);
 const windowW=w*.18,windowH=h*.27;
 for(const wx of [x+w*.12,x+w*.7]){s.rect(wx,y+h*.49,windowW,windowH,0xf5edcf,2);s.rect(wx+3,y+h*.49+3,Math.max(3,windowW-6),Math.max(3,windowH-6),0x80a6a1,1)}
 const roof=s.add.graphics();roof.fillStyle(b.roof).fillPoints([{x:x-8,y:y+h*.3},{x:x+w/2,y:y-12},{x:x+w+8,y:y+h*.3},{x:x+w+5,y:y+h*.39},{x:x-5,y:y+h*.39}],true);roof.lineStyle(1,0xffffff,.16);for(let i=1;i<7;i++)roof.lineBetween(x+w/2,y-9,x+w*i/7,y+h*.32);s.worldLayer.add(roof);
 if(['shop','market','cafe','rung-market','oms-cake'].includes(b.id))for(let i=0;i<6;i++)s.rect(x+i*w/6,y+h*.39,w/6,h*.1,i%2?0xf5e6c3:b.roof,1);
 if(!b.id.startsWith('block')){const label=s.label(x+w/2,y+h*.42,b.name,Math.min(12,w/10));label.setStyle({strokeThickness:1,align:'center',wordWrap:{width:w-6}}).setOrigin(.5,0)}
 // Rasterize once: dozens of Graphics/Text objects become two cached images.
 const parts=[s.worldLayer.list.slice(first,bodyStart),s.worldLayer.list.slice(bodyStart)];
 for(let i=0;i<2;i++){
  s.worldLayer.remove(parts[i]);
  const group=s.add.container(-plot.x,-plot.y,parts[i]);
  const texture=s.add.renderTexture(0,0,Math.ceil(plot.w),Math.ceil(plot.h));
  texture.draw(group, -plot.x, -plot.y);texture.saveTexture(keys[i]);
  group.destroy(true);texture.destroy();
 }
 addCached();
}
