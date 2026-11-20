import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildings} from '../src/data';
import {plotOf,intersects,clearOfRoads,segmentDistanceToBox} from '../src/buildingLayout';

test('every complete house plot clears streets and sidewalks, including roofs and shadows',()=>{
 for(const b of buildings)assert.ok(clearOfRoads(plotOf(b)),b.id+' overlaps a street');
});
test('no two house plots overlap and a walking gap is retained between them',()=>{
 for(let i=0;i<buildings.length;i++)for(let j=i+1;j<buildings.length;j++)assert.equal(intersects(plotOf(buildings[i]),plotOf(buildings[j]),12),false,buildings[i].id+' / '+buildings[j].id);
});
test('house artwork fits inside its lot and uses compact footprints',()=>{
 for(const b of buildings){const p=plotOf(b);assert.ok(b.w<=164&&b.h<=103);assert.ok(b.x-8>=p.x&&b.y-12>=p.y);assert.ok(b.x+b.w+8<=p.x+p.w&&b.y+b.h+21<=p.y+p.h)}
});
test('road clearance catches diagonal roads through plots and near the corners',()=>{
 const b={x:10,y:10,w:20,h:20};assert.equal(segmentDistanceToBox([0,0],[40,40],b),0);assert.equal(segmentDistanceToBox([0,5],[40,5],b),5);assert.ok(segmentDistanceToBox([0,0],[5,5],b)>7);
});
