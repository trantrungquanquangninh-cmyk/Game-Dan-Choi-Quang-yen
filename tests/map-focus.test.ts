import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapFocus} from '../src/mapFocus';

test('the map opens zoomed around the player and includes even distant destinations',()=>{
  const player={x:100,y:100};
  const close=mapFocus(player);
  assert.equal(close.width,1000);
  assert.equal(close.x+close.width/2,player.x);
  assert.equal(close.y+close.height/2,player.y);
  for(const destination of [{x:4100,y:2400},{x:100,y:2500},{x:4100,y:100}]){
    const view=mapFocus(player,destination);
    for(const p of [player,destination]){
      assert.ok(p.x>view.x+100&&p.x<view.x+view.width-100);
      assert.ok(p.y>view.y+100&&p.y<view.y+view.height-100);
    }
    assert.equal(view.width/view.height,1.6);
  }
});
