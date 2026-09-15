import {seedRole} from './catalog.js';
import {distance} from './planet.js';

// Seed functions read the same neighbors used by the simulation, and spend/produce
// actual energy or settlement stores rather than decorative counters.
export function seedEffects(w,e,near,dt){
  const role=seedRole(e);if(!role||e.age<6)return;
  if(role==='reed')for(const n of near)if(n.kind==='plant')n.energy=Math.min(100,n.energy+dt*.8);
  if(role==='fungus')for(const n of near)if(n.grief>.05){n.health=Math.min(100,n.health+dt*.6);n.grief=Math.max(0,n.grief-dt*.015);}
  if(role==='well')w.patch('water',e.x,e.z,2.8,4);
  if(role==='nursery')for(const n of near)if(n.kind==='creature'&&n.age<28){n.age+=dt*.25;n.health=Math.min(100,n.health+dt*.5);}
  if(role==='spire')for(const n of near)n.knowledge+=n.genes.mind*dt*.12;
  if(role==='horn')for(const n of near)if(n.kind==='creature'&&n.genes.fang>.65){n.fear=Math.min(1,n.fear+dt*.6);n.health=Math.max(0,n.health-dt*.25);}
  const town=w.state.societies.find(t=>t.id===e.society||distance(t,e)<7);
  if(town&&role==='workshop'&&(town.food||0)>.05){town.food-=dt*.015;town.materials=(town.materials||0)+dt*.05;}
  if(town&&role==='granary')for(const n of near)if(n.kind==='creature'&&n.energy<85&&(town.food||0)>=dt*.06){town.food-=dt*.06;n.energy=Math.min(100,n.energy+dt*2);}
}
export function foodGain(plant){return seedRole(plant)==='fruit'?1.8:1;}
export function materialGain(plant){return seedRole(plant)==='bark'?2.5:1;}
