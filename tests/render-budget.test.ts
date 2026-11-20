import {test} from 'node:test';
import assert from 'node:assert/strict';
import {withinView} from '../src/renderBudget';

test('viewport culling keeps nearby roofs visible before the camera reaches them',()=>{
 const camera={x:1000,y:800,width:800,height:600};
 assert.equal(withinView({x:950,y:700,width:100,height:130},camera),true);
 assert.equal(withinView({x:1900,y:900,width:100,height:100},camera),true);
 assert.equal(withinView({x:3000,y:900,width:100,height:100},camera),false);
 assert.equal(withinView({x:800,y:20,width:100,height:100},camera),false);
});
test('culling adapts to zoomed-out views and does not hide overlapping edge objects',()=>{
 assert.equal(withinView({x:1800,y:1500,width:100,height:100},{x:0,y:0,width:2000,height:1600},0),true);
 assert.equal(withinView({x:950,y:800,width:100,height:100},{x:1000,y:800,width:800,height:600},0),true);
});
