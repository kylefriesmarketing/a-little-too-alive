import {distance,validPosition,landAt} from './planet.js';
import {moveLife,updateSettlements} from './ecology.js';
import { VERSION,LIMIT,RADIUS,GENE_KEYS,INGREDIENTS,genesOf,kindOf,nameOf } from './data.js';
const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
const dist = distance;
const clone = v => JSON.parse(JSON.stringify(v));
const TOWNS = ['Softmouth','Little Elsewhere','The Warm Place','New Almost','Moss Mercy','The Unfolding','Tender Teeth','Hush'];
export class World {
  constructor(seed=91726) {
    this.state = {version:VERSION, started:false, name:'The first garden', seed:seed>>>0, rng:seed>>>0, time:0, nextId:1, entities:[], patches:[], societies:[], discoveries:{}, milestones:{}, history:[], offline:false, savedAt:Date.now(), stats:{planted:0,born:0,lost:0,grafted:0}, serial:0};
    this.events=[];
  }
  random() { this.state.rng=(Math.imul(this.state.rng,1664525)+1013904223)>>>0;return this.state.rng/4294967296; }
  emit(text,type='event',entity=null) {
    const e={id:++this.state.serial,t:this.state.time,text,type,x:entity?.x??0,z:entity?.z??0};
    this.state.history.unshift(e);this.state.history.length=Math.min(90,this.state.history.length);this.events.push(e);
  }
  milestone(id,text,entity) {
    if(this.state.milestones[id])return;
    this.state.milestones[id]=true;this.emit(text,'milestone',entity);
  }
  find(id) {return this.state.entities.find(e=>e.id===id);}
  discover(e) {
    const key=[...e.seeds].sort().join('+');
    if(!this.state.discoveries[key]) {
      this.state.discoveries[key]={name:e.name,seeds:[...e.seeds],genes:{...e.genes},generation:e.generation};
      this.emit(e.name.toLowerCase()+'. a new way to be alive.','discovery',e);
    }
  }
  plant(seeds,x,z,extra={}) {
    if(!Array.isArray(seeds)||!seeds.length||seeds.length>3||seeds.some(s=>!Object.hasOwn(INGREDIENTS,s)))throw new Error('Choose one to three known ingredients.');
    if(!landAt(x,z)) return null;
    if(this.state.entities.length>=LIMIT)return null;
    const genes=extra.genes?Object.fromEntries(GENE_KEYS.map(k=>[k,clamp(extra.genes[k]||0)])):genesOf(seeds);
    const e={id:this.state.nextId++, seeds:[...seeds], genes, name:nameOf(seeds,genes), kind:kindOf(genes), x,z, age:0, energy:80, health:100, love:genes.love*.25, fear:0, grief:0, knowledge:0, faith:'unaware', generation:extra.generation||1, parentIds:extra.parentIds||[], memory:extra.memory||'a first breath in unfamiliar soil.', control:'wild', phase:'seed', motion:this.random()*6.28, heading:this.random()*6.28, reproAt:28+this.random()*15, talkAt:10+this.random()*20, society:null, residents:0, size:1, pulse:0, bornAt:this.state.time};
    this.state.entities.push(e);this.state.started=true;
    if(extra.birth) {this.state.stats.born++;} else {this.state.stats.planted++;this.milestone('life','you planted something. it took that personally.',e);}
    this.discover(e);return e;
  }
  graft(id,seeds,inherited=null) {
    const e=this.find(id);if(!e)return null;
    const donor=inherited||genesOf(seeds);for(const k of GENE_KEYS)e.genes[k]=clamp(e.genes[k]*.8+donor[k]*.65);
    e.seeds=[...new Set([...seeds,...e.seeds])].slice(0,3);e.kind=kindOf(e.genes);e.name=nameOf(e.seeds,e.genes);e.pulse=1;e.memory='the hand changed what i was.';this.state.stats.grafted++;this.discover(e);this.emit(e.name.toLowerCase()+' grows around its new inheritance.','graft',e);return e;
  }
  affect(tool,x,z) {
    const near=this.state.entities.filter(e=>Math.hypot(e.x-x,e.z-z)<4.2);
    if(tool==='rain')this.patch('water',x,z,2.7,75);
    for(const e of near) {
      e.pulse=1;
      if(tool==='love'){e.love=clamp(e.love+.55);e.fear*=.5;e.health=Math.min(100,e.health+12);e.knowledge+=e.genes.mind*2;}
      if(tool==='fear'){e.fear=clamp(e.fear+.65);e.love*=.65;e.knowledge+=e.genes.mind*3;}
      if(tool==='rain'){e.energy=Math.min(100,e.energy+22);e.grief*=.5;e.health=Math.min(100,e.health+8);}
      if(tool==='mutate'){const key=GENE_KEYS[Math.floor(this.random()*GENE_KEYS.length)];e.genes[key]=clamp(e.genes[key]+.4);e.kind=kindOf(e.genes);e.memory='something impossible has become part of me.';}
    }
    if(near.length)this.emit(({love:'a little affection spreads further than you intended.',fear:'they do not know why. they remember who.',rain:'the soil drinks. so does everything else.',mutate:'the rules of inheritance have become a suggestion.'})[tool],'intervention',near[0]);
    return near.length;
  }
  patch(type,x,z,r,life) {
    const old=this.state.patches.find(p=>p.type===type&&Math.hypot(p.x-x,p.z-z)<2);
    if(old){old.life=Math.max(old.life,life);old.r=Math.max(old.r,r);return;}
    if(this.state.patches.length>=35)this.state.patches.shift();
    this.state.patches.push({id:this.state.nextId++,type,x,z,r,life});
  }
  remove(id,reason='returned to the soil') {
    const e=this.find(id);if(!e)return;
    this.state.entities=this.state.entities.filter(o=>o.id!==id);this.state.stats.lost++;
    for(const n of this.state.entities)if(dist(e,n)<5){n.grief=clamp(n.grief+.25+n.genes.love*.35);n.fear=clamp(n.fear+.12);n.memory='i remember '+e.name.toLowerCase()+'.';}
    this.patch('water',e.x,e.z,1+e.genes.water*2,70);this.emit(e.name.toLowerCase()+' '+reason+'. something will grow here.','loss',e);
  }
  tick(dt=.25) {
    if(!Number.isFinite(dt)||dt<=0||dt>1)throw new Error('Simulation steps must be at most one second.');
    const s=this.state;s.time+=dt;
    for(const p of s.patches)p.life-=dt;s.patches=s.patches.filter(p=>p.life>0);
    const population=[...s.entities];const births=[];const deaths=[];
    for(const e of population) {
      if(!this.find(e.id))continue;
      e.age+=dt;e.pulse=Math.max(0,e.pulse-dt*.55);
      if(e.age<3){e.phase='seed';continue;}
      if(e.phase==='seed'){e.phase='growing';e.pulse=1;}
      if(e.phase==='growing'&&e.age>9)e.phase='mature';
      const near=population.filter(n=>n.id!==e.id&&dist(e,n)<4.6);
      const friends=near.filter(n=>n.genes.fang<.65||n.control==='gentle');
      const water=s.patches.filter(p=>p.type==='water'&&Math.hypot(e.x-p.x,e.z-p.z)<p.r);
      e.love=clamp(e.love+(friends.length*.009*e.genes.love-.004)*dt);
      e.fear=clamp(e.fear-dt*.012);e.grief=clamp(e.grief-dt*.006);
      e.energy=clamp(e.energy+dt*(e.kind==='plant'?2.5:e.kind==='home'?.65:-.32-e.genes.heat*.24)+water.length*dt*2,0,100);
      if(e.energy<15)e.health-=dt*.35;else e.health=Math.min(100,e.health+dt*.1);
      e.knowledge+=dt*e.genes.mind*(.07+friends.length*.016+e.genes.song*.04);
      const rules=s.societies.find(c=>Math.hypot(c.x-e.x,c.z-e.z)<6&&c.rule);
      if(rules?.rule==='kinship'){e.love=clamp(e.love+dt*.015);e.health=Math.min(100,e.health+dt*.1);}
      if(rules?.rule==='shelter')e.fear*=Math.pow(.97,dt);
      if(rules?.rule==='hunger')e.energy=Math.min(100,e.energy+dt*.25);
      if(e.kind==='creature'||e.phase==='walking'||e.phase==='city')moveLife(this,e,dt,population);
      if(e.kind==='creature'&&e.energy<85){
        const meal=near.find(n=>n.kind==='plant'&&n.age>6&&dist(e,n)<1.7);
        if(meal){e.energy=Math.min(100,e.energy+dt*4);meal.energy-=dt*1.2;
          if(e.genes.fang>.6&&e.control!=='gentle'){meal.health-=dt*1.6;meal.fear=clamp(meal.fear+dt*.05);}}
      }
      if(e.genes.heat>.6&&e.genes.fang>.45&&e.fear>.55&&e.control!=='gentle'){
        this.patch('fire',e.x,e.z,1.7,12);for(const n of near)if(dist(e,n)<2){n.health-=dt*2;n.fear=clamp(n.fear+dt*.06);}
      }
      for(const p of s.patches)if(p.type==='fire'&&Math.hypot(p.x-e.x,p.z-e.z)<p.r&&!water.length){e.health-=dt*(1-e.genes.heat)*.8;e.fear=clamp(e.fear+dt*.025);}
      if(e.grief>.6&&e.genes.water+e.genes.love>.6)this.patch('water',e.x,e.z,2.1,70);
      if(e.fear>.7&&e.kind==='plant')this.patch('thorns',e.x,e.z,1.1,35);
      if(e.kind==='home') {
        const residents=near.filter(n=>n.kind==='creature'&&n.genes.mind>.3&&n.age>8);
        e.residents=residents.length;
        if(residents.length>=3&&!e.society) {
          let town=s.societies.find(c=>Math.hypot(c.x-e.x,c.z-e.z)<6);
          if(!town){town={id:s.nextId++,name:TOWNS[s.societies.length%TOWNS.length],x:e.x,z:e.z,age:0,rule:null};s.societies.push(town);this.milestone('civilization','they named this place '+town.name.toLowerCase()+'. nobody asked you.',e);}
          e.society=town.id;for(const n of residents)n.society=town.id;
        }
        if(e.genes.love>.35&&e.love>.5&&residents.length>=2&&e.age>24&&e.phase==='mature') {
          e.phase='walking';e.pulse=1;e.memory='home is where i decide to go.';
          this.milestone('walking','the house grew legs. its residents have not noticed yet.',e);
          this.emit('a hearthling is leaving. the village is coming with it.','transformation',e);
        }
        if(e.phase==='walking') {
          const homes=near.filter(n=>n.kind==='home'&&n.phase==='walking'&&n.id>e.id);
          if(homes.length>=2&&e.age>40) {
            const merged=homes.slice(0,2);e.phase='city';e.size=2.1;e.name='The Walking '+(s.societies.find(c=>c.id===e.society)?.name||'Almost');e.residents+=merged.reduce((n,h)=>n+h.residents,0);
            s.entities=s.entities.filter(n=>!merged.includes(n));e.memory='three homes. one heartbeat.';e.pulse=1;
            this.milestone('city','three houses shared a heartbeat. the city is now one animal.',e);
          }
        }
      }
      if(e.knowledge>8&&e.faith==='unaware'){e.faith=e.fear>.35?'afraid':'curious';e.speech='someone keeps touching the sky.';e.speechUntil=s.time+6;}
      if(e.knowledge>17&&e.faith!=='aware'){e.faith='aware';e.speech='are we your garden, or your experiment?';e.speechUntil=s.time+7;this.milestone('god','one of them looked up. "are we your garden, or your experiment?"',e);}
      if(e.age>e.talkAt) {e.talkAt=e.age+24+this.random()*22;
        if(e.genes.mind+e.genes.song>.7){e.speech=e.fear>.5?'the sky did that on purpose.':e.grief>.5?'something is missing.':e.phase==='walking'?'the view keeps changing.':e.love>.6?'can we keep this feeling?':e.society?'we should put a name on this place.':'i think i am getting used to existing.';e.speechUntil=s.time+5;}}
      if((e.kind!=='plant'||near.filter(n=>n.kind==='plant').length<5)&&e.age>e.reproAt&&e.energy>50&&e.health>45&&e.kind!=='home'&&e.control!=='rooted'&&s.entities.length+births.length<LIMIT){
        e.reproAt=e.age+30+this.random()*25;
        const mate=near.find(n=>n.age>24&&n.energy>40&&n.kind===e.kind&&n.control!=='rooted');
        if(mate||e.kind==='plant'){
          const g={};for(const k of GENE_KEYS)g[k]=clamp((e.genes[k]+(mate?.genes[k]??e.genes[k]))/2);
          if(this.random()<.16){const k=GENE_KEYS[Math.floor(this.random()*GENE_KEYS.length)];g[k]=clamp(g[k]+.3);}
          const seeds=[...new Set([...e.seeds,...(mate?.seeds||[])])].slice(0,3);
          const a=this.random()*Math.PI*2;births.push({seeds,x:e.x+Math.cos(a)*1.6,z:e.z+Math.sin(a)*1.6,genes:g,generation:Math.max(e.generation,mate?.generation||1)+1,parentIds:mate?[e.id,mate.id]:[e.id],memory:'born of '+e.name.toLowerCase()+(mate?' and '+mate.name.toLowerCase():'')+'.'});e.energy-=22;
          if(mate&&e.seeds.join()!==mate.seeds.join())this.milestone('hybrid','two things you made have made something you did not.','x' in e?e:null);
        }
      }
      if(e.health<=0||e.age>1100+e.genes.flora*900)deaths.push(e.id);
    }
    updateSettlements(this,dt);
    for(const b of births)this.plant(b.seeds,b.x,b.z,{...b,birth:true});
    for(const id of deaths)this.remove(id);
    for(const town of s.societies){town.age+=dt;if(!town.rule&&town.age>55){
      const locals=s.entities.filter(e=>Math.hypot(e.x-town.x,e.z-town.z)<6);
      if(locals.length<3)continue;
      const love=locals.reduce((n,e)=>n+e.genes.love,0),fang=locals.reduce((n,e)=>n+e.genes.fang,0);
      town.rule=love>fang?'kinship':fang>locals.length*.45?'hunger':'shelter';
      this.milestone('rules',town.name.toLowerCase()+' made '+town.rule+' a law of nature.',town);
      this.emit('around '+town.name.toLowerCase()+', '+({kinship:'affection now heals living things.',hunger:'hunger feeds itself.',shelter:'fear fades faster near home.'})[town.rule],'law',town);
    }}
  }
  advance(seconds) {const n=Math.floor(Math.min(1800,Math.max(0,seconds))*4);for(let i=0;i<n;i++)this.tick(.25);this.events=[];return n/4;}
  snapshot() {return clone(this.state);}
  static restore(raw) {
    const migrated=clone(raw);if(migrated?.version===1)migrated.version=VERSION;
    validate(migrated);const w=new World(migrated.seed);w.state=migrated;w.events=[];return w;
  }
}
export function validate(s) {
  const fail=()=>{throw new Error('This postcard is not a valid A Little Too Alive world.');};
  if(!s||s.version!==VERSION||typeof s.name!=='string'||s.name.length>64||!Number.isFinite(s.time)||s.time<0||!Number.isInteger(s.nextId)||s.nextId<1||!Number.isInteger(s.rng)||!Number.isInteger(s.seed)||typeof s.offline!=='boolean')fail();
  if(!Array.isArray(s.entities)||s.entities.length>LIMIT||!Array.isArray(s.patches)||s.patches.length>35||!Array.isArray(s.societies)||s.societies.length>LIMIT||!Array.isArray(s.history)||s.history.length>90||!s.stats||!s.discoveries||!s.milestones)fail();
  if(typeof s.started!=='boolean'||!Number.isFinite(s.savedAt)||!Number.isInteger(s.serial)||s.serial<0)fail();
  for(const k of ['planted','born','lost','grafted'])if(!Number.isInteger(s.stats[k])||s.stats[k]<0)fail();
  for(const val of Object.values(s.milestones))if(val!==true)fail();
  const ids=new Set();
  for(const e of s.entities){
    if(!Number.isInteger(e.id)||e.id<1||ids.has(e.id)||e.id>=s.nextId||!Array.isArray(e.seeds)||!e.seeds.length||e.seeds.length>3||e.seeds.some(k=>!Object.hasOwn(INGREDIENTS,k))||!e.genes)fail();ids.add(e.id);
    for(const k of ['x','z','age','energy','health','love','fear','grief','knowledge','generation','motion','heading','reproAt','talkAt','residents','size','pulse','bornAt'])if(!Number.isFinite(e[k]))fail();
    if(!Array.isArray(e.parentIds)||e.parentIds.length>2||e.parentIds.some(id=>!Number.isInteger(id)||id<1))fail();
    if(e.carrying!==undefined&&(!Number.isFinite(e.carrying)||e.carrying<0||e.carrying>10))fail();
    if(e.activity!==undefined&&(typeof e.activity!=='string'||e.activity.length>80))fail();
    if(e.age<0||e.generation<1||!Number.isInteger(e.generation)||e.generation>100000)fail();
    if(!validPosition(e.x,e.z)||e.size<.1||e.size>4||!['plant','home','creature'].includes(e.kind)||!['wild','gentle','rooted'].includes(e.control)||!['seed','growing','mature','walking','city'].includes(e.phase))fail();
    for(const k of GENE_KEYS)if(!Number.isFinite(e.genes[k])||e.genes[k]<0||e.genes[k]>1)fail();
    for(const k of ['name','memory','faith'])if(typeof e[k]!=='string'||e[k].length>400)fail();
    if(e.speech!==undefined&&(typeof e.speech!=='string'||e.speech.length>400||!Number.isFinite(e.speechUntil)))fail();
  }
  for(const p of s.patches){if(!['water','thorns','fire'].includes(p.type)||!['x','z','r','life','id'].every(k=>Number.isFinite(p[k]))||p.r<0||p.r>10)fail();}
  for(const c of s.societies){for(const k of ['food','materials','built','population'])if(c[k]!==undefined&&(!Number.isFinite(c[k])||c[k]<0))fail();if(typeof c.name!=='string'||c.name.length>80||!['x','z','id','age'].every(k=>Number.isFinite(c[k]))||![null,'kinship','hunger','shelter'].includes(c.rule))fail();}
  for(const h of s.history)if(typeof h.text!=='string'||h.text.length>1000||!['id','t','x','z'].every(k=>Number.isFinite(h[k])))fail();
  if(Object.keys(s.discoveries).length>300)fail();
  for(const d of Object.values(s.discoveries))if(typeof d.name!=='string'||d.name.length>100||!Array.isArray(d.seeds)||d.seeds.length>3||d.seeds.some(k=>!Object.hasOwn(INGREDIENTS,k)))fail();
  return true;
}
