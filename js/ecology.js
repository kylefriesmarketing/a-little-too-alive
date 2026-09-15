import {seedRole} from './catalog.js';
import {materialGain} from './seed-effects.js';
import {anatomy} from './anatomy.js';
import {distance,landAt,groundAt,wrapped,LATITUDE_LIMIT,PLANET_RADIUS} from './planet.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function moveLife(w,e,dt,population){
 if(e.control==='rooted'){e.activity='rooted';return;}
 const a=anatomy(e.genes),near=population.filter(n=>n.id!==e.id&&distance(e,n)<a.sense);let target=null,flee=false;
 const town=w.state.societies.find(c=>c.id===e.society),parent=e.parentIds.map(id=>w.find(id)).find(Boolean);
 const threat=near.filter(n=>n.kind==='creature'&&anatomy(n.genes).diet==='predator'&&n.control!=='gentle').sort((a,b)=>distance(e,a)-distance(e,b))[0];
 e.activity='wandering';
 const role=seedRole(e),guardian=near.find(n=>seedRole(n)==='horn');
 if(a.diet==='predator'&&guardian&&e.fear>.25){target=guardian;flee=true;e.activity='avoiding a guardian';}
 if(role==='wing'){target=near.find(n=>seedRole(n)==='flower')||near.find(n=>n.kind==='plant');if(target){e.activity='pollinating';if(distance(e,target)<2){target.reproAt=Math.max(target.age+1,target.reproAt-dt*.7);target.energy=Math.min(100,target.energy+dt);e.energy=Math.min(100,e.energy+dt*2);}}}
 if(target){}
 else if(e.kind==='home'){e.activity=e.phase==='city'?'carrying a civilization':'walking';}
 else if(a.diet!=='predator'&&threat&&distance(e,threat)<7){target=threat;flee=true;e.fear=clamp(e.fear+dt*.5);e.activity='fleeing a predator';}
 else if(e.age<28&&parent&&distance(e,parent)>1.8){target=parent;e.activity='following parent';}
 else if(a.diet==='predator'&&e.energy<80&&e.control!=='gentle'){
   target=near.filter(n=>n.kind==='creature'&&anatomy(n.genes).diet!=='predator'&&n.age>3).sort((a,b)=>distance(e,a)-distance(e,b))[0];
   if(target){e.activity='hunting';if(distance(e,target)<1.55){target.health-=dt*(3+e.genes.fang*4)*(seedRole(target)==='shell'?.45:1);target.fear=clamp(target.fear+dt*.6);e.energy=Math.min(100,e.energy+dt*5);e.activity='feeding';}}
 }
 if(!target&&town&&e.kind==='creature'&&e.age>24&&a.diet!=='predator'){
   e.carrying=e.carrying||0;
   if(e.carrying>=3){target={x:town.x+Math.cos(e.motion)*1.8,z:town.z+Math.sin(e.motion)*1.8};e.activity='bringing food home';if(distance(e,town)<2.7){town.food=(town.food||0)+e.carrying;town.materials=(town.materials||0)+(e.carryingWood||e.carrying*.7);e.carrying=0;e.carryingWood=0;e.memory='i helped this place grow.';}}
   else{target=near.find(n=>n.kind==='plant'&&n.age>8);if(target){e.activity='gathering';if(distance(e,target)<1.7){e.carrying+=dt*.7;e.carryingWood=(e.carryingWood||0)+dt*.49*materialGain(target);e.energy=Math.min(100,e.energy+dt);}}}
 }
 if(!target&&e.kind==='creature'&&e.energy<82&&a.diet!=='predator'){target=near.filter(n=>n.kind==='plant'&&n.age>6).sort((a,b)=>distance(e,a)-distance(e,b))[0];if(target)e.activity=distance(e,target)<1.7?'grazing':'seeking food';}
 if(!target&&e.kind==='creature'&&e.genes.mind>.3){target=near.find(n=>n.kind==='home');if(target)e.activity='sheltering';}
 if(!target&&e.kind==='creature'){const herd=near.filter(n=>n.kind==='creature'&&anatomy(n.genes).diet===a.diet);if(herd.length){target={x:herd.reduce((s,n)=>s+n.x,0)/herd.length,z:herd.reduce((s,n)=>s+n.z,0)/herd.length};e.activity='with the herd';}}
 if(target){let dx=wrapped(target.x-e.x)*Math.cos(e.z/PLANET_RADIUS),dz=target.z-e.z;e.heading=Math.atan2(dz,dx)+(flee?Math.PI:0);}else e.heading+=Math.sin(e.age*.15+e.motion)*dt*.23;
 const separation=e.activity==='with the herd'?3:1.4;
 if(!target||flee||distance(e,target)>separation){const pace=(e.phase==='city'?.18:e.phase==='walking'?.2:a.speed)*(flee?1.8:1)*(e.age<14?.65:1),dx=Math.cos(e.heading)*dt*pace/Math.max(.12,Math.cos(e.z/PLANET_RADIUS)),dz=Math.sin(e.heading)*dt*pace,nx=wrapped(e.x+dx),nz=clamp(e.z+dz,-LATITUDE_LIMIT,LATITUDE_LIMIT);if((role==='wing'||landAt(nx,nz))&&Math.abs(groundAt(nx,nz)-groundAt(e.x,e.z))<.65){e.x=nx;e.z=nz;}else{e.heading+=1.4;e.activity='finding a path';}}
}
export function updateSettlements(w,dt){
 for(const town of w.state.societies){town.food??=4;town.materials??=0;town.built??=0;const homes=w.state.entities.filter(e=>e.society===town.id&&e.kind==='home');const anchor=homes.find(e=>e.phase==='city')||homes[0];if(anchor){town.x=anchor.x;town.z=anchor.z;}
   const residents=w.state.entities.filter(e=>e.society===town.id&&e.kind==='creature');town.population=residents.length;town.food=Math.max(0,town.food-residents.length*dt*.025);
   if(town.food>0)for(const e of residents)if(distance(e,town)<4)e.energy=Math.min(100,e.energy+dt*.7);
   if(town.materials>=12&&town.food>=5&&town.built<5){const angle=w.random()*Math.PI*2,x=wrapped(town.x+Math.cos(angle)*3.2),z=town.z+Math.sin(angle)*3.2;if(landAt(x,z)){const home=w.plant(['brick','heart','moss'],x,z,{birth:true});if(home){home.society=town.id;home.love=.58;home.memory='our neighbors grew this home together.';town.materials-=12;town.food-=5;town.built++;w.emit(town.name+' grew a new home from gathered living material.','construction',home);}}}
 }
}
export function seedLivingWorld(w){
 w.state.name='The Unfolding';
 const add=(seeds,x,z,age=35,extras={})=>{const e=w.plant(seeds,x,z,extras);if(e){e.age=age;e.phase=age<14?'growing':'mature';e.energy=85;e.reproAt=age+45+w.random()*50;e.talkAt=age+8+w.random()*30;Object.assign(e,extras);}return e;};
 // A deliberately populated starting scenario; empty creation remains available.
 for(let i=0;i<60;i++){const a=i*2.399,r=3+Math.sqrt(i/60)*24,x=Math.cos(a)*r,z=Math.sin(a)*r;add([['grass'],['flower'],['fruit'],['reed'],['bark'],['fungus']][i%6],x,z,35+i);}
 const families=[];for(let i=0;i<12;i++){const x=-12+(i%4)*3,z=-4+Math.floor(i/4)*3;const genes={flora:.18,mind:.35,love:.7,build:0,fang:.1,water:i%2?.8:.25,heat:.12,song:i%3?.45:.85,motion:.8};families.push(add(i%2?['shell']:['hoof'],x,z,45+i,{genes,name:i%2?'Reedstrider':'Crestback'}));}
 for(let i=0;i<4;i++){const p=families[i],q=families[i+4],genes=Object.fromEntries(Object.keys(p.genes).map(k=>[k,(p.genes[k]+q.genes[k])/2]));add(['hoof'],p.x+.6,p.z+.6,8,{genes,parentIds:[p.id,q.id],generation:2,name:'Young Crestback',memory:'two lineages, one new possibility.'});}
 for(let i=0;i<3;i++)add(['claw'],-15-i*2,8+i*2,50,{energy:65,genes:{flora:0,mind:.7,love:.1,build:0,fang:.9,water:.2,heat:.45,song:.2,motion:.8},name:'Cinderjaw'});
 const town={id:w.state.nextId++,name:'Softmouth',x:10,z:3,age:25,rule:null,food:8,materials:7,built:0,population:7};w.state.societies.push(town);
 for(let i=0;i<3;i++)add(['brick','heart','eye'],10+i*2,3+(i%2)*2,60,{society:town.id,love:.7,residents:5,phase:i===0?'walking':'mature'});
 for(let i=0;i<8;i++)add(['hand'],9+(i%4)*2,1-Math.floor(i/4)*2,38,{society:town.id,name:'Softmouth Forager'});
 for(let i=0;i<4;i++)add(['wing'],-4+i*2,6,30,{name:'Lantern moth'});
 add(['horn'],-8,3,45);
 add(['well'],15,6,40);add(['workshop'],15,1,40,{society:town.id});add(['granary'],8,6,40,{society:town.id});
 const city=add(['brick','heart','echo'],3,-12,170,{heading:0,phase:'city',size:1.7,love:.8,residents:12,name:'The Wandering Orchard',memory:'we used to be three houses. now we disagree about which way to walk.'});
 const orchard={id:w.state.nextId++,name:'The Orchard',x:city.x,z:city.z,age:40,rule:null,food:12,materials:4,built:0,population:6};city.society=orchard.id;w.state.societies.push(orchard);
 for(let i=0;i<6;i++)add(['eye','heart','echo'],city.x+(i%3-1)*1.2,city.z+1+Math.floor(i/3),40,{society:orchard.id,name:'Orchard Keeper'});
 w.state.history=[];w.state.serial=0;w.state.milestones={};w.state.discoveries={};w.state.stats={planted:0,born:0,lost:0,grafted:0};w.state.scenario='living-world';w.state.started=true;w.emit('A living-world starting scenario. These lineages and settlements are yours to change.','event',city);w.events=[];return w;
}
