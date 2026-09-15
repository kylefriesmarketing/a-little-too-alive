import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../js/sim.js';
import {LIMIT} from '../js/data.js';
const step=(w,t)=>{for(let i=0;i<t*4;i++)w.tick(.25);};
test('ingredients change anatomy and germinate into the correct kind',()=>{
  const w=new World(123);const plant=w.plant(['moss','tooth'],0,0);const home=w.plant(['brick','heart'],2,0);const animal=w.plant(['eye','heart'],0,2);
  assert.equal(plant.kind,'plant');assert.equal(plant.genes.fang,1);assert.equal(home.kind,'home');assert.equal(animal.kind,'creature');step(w,11);assert.equal(plant.phase,'mature');assert.equal(w.state.stats.planted,3);assert.equal(w.state.milestones.life,true);
});
test('save through JSON resumes the same evolving world and RNG',()=>{
  const w=new World(728);for(let i=0;i<7;i++)w.plant(i%2?['eye','heart']:['moss','eye'],i-3,0);step(w,43);
  const restored=World.restore(JSON.parse(JSON.stringify(w.snapshot())));step(w,75);step(restored,75);assert.deepEqual(restored.snapshot(),w.snapshot());
});
test('neighboring species breed blended traits and retain parentage',()=>{
  const w=new World(555);w.plant(['moss','heart'],-.2,0);w.plant(['moss','eye'],.2,0);step(w,50);
  const child=w.state.entities.find(e=>e.generation===2);assert.ok(child);assert.equal(child.parentIds.length,2);assert.ok(child.genes.mind>0&&child.genes.love>0);assert.equal(w.state.milestones.hybrid,true);
});
test('civilization, walking homes, and a living city are reachable through normal rules',()=>{
  const w=new World(512);for(let i=0;i<3;i++)w.plant(['brick','heart'],i*.8-.8,0);
  for(let i=0;i<5;i++){const e=w.plant(['eye','heart'],i*.3-.6,.8);e.control='rooted';}
  w.affect('love',0,0);step(w,48);
  assert.equal(w.state.milestones.civilization,true);assert.equal(w.state.milestones.walking,true);assert.equal(w.state.milestones.city,true);assert.ok(w.state.entities.some(e=>e.phase==='city'));
});
test('grafting changes an existing organism and its visible kind',()=>{
  const w=new World();const e=w.plant(['eye'],0,0);const id=e.id;w.graft(id,['brick','heart']);assert.equal(e.id,id);assert.equal(e.kind,'home');assert.ok(e.genes.love>.5);assert.equal(w.state.stats.grafted,1);
});
test('loss causes grief and leaves ecological consequences',()=>{
  const w=new World(1);const a=w.plant(['heart','tear'],0,0);const b=w.plant(['eye'],1,0);w.remove(b.id);assert.ok(a.grief>.25);assert.ok(w.state.patches.some(p=>p.type==='water'));assert.equal(w.state.stats.lost,1);
});
test('invalid and oversized postcards are refused before replacing state',()=>{
  const w=new World();w.plant(['eye'],0,0);const s=w.snapshot();s.entities[0].x=Infinity;assert.throws(()=>World.restore(s));
  s.entities[0].x=0;s.entities[0].genes.mind=99;assert.throws(()=>World.restore(s));
  s.entities[0].genes.mind=1;s.entities[0].seeds=['__proto__'];assert.throws(()=>World.restore(s));
  assert.throws(()=>w.plant(['missing'],0,0));assert.equal(w.plant(['moss'],100,100),null);
});
test('population remains bounded through a long deterministic ecosystem run',()=>{
  const a=new World(417),b=new World(417);for(let i=0;i<20;i++){const p=[['moss','heart'],['moss','eye'],['eye','tooth'],['brick','heart']][i%4];a.plant(p,Math.cos(i)*5,Math.sin(i)*5);b.plant(p,Math.cos(i)*5,Math.sin(i)*5);}
  step(a,600);step(b,600);assert.ok(a.state.entities.length<=LIMIT);assert.deepEqual(a.snapshot(),b.snapshot());World.restore(a.snapshot());
});
