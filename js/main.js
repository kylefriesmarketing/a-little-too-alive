import {createCatalog} from './catalog-ui.js';
import {SEEDS,MUTATIONS} from './catalog.js';
import {seedLivingWorld} from './ecology.js';
import {anatomy} from './anatomy.js';
import {landAt} from './planet.js';
import {World} from './sim.js';
import {View} from './view.js';
import {GardenAudio} from './audio.js';
import {INGREDIENTS,SAVE_KEY,LIMIT,RADIUS,genesOf,nameOf,kindOf,MILESTONES} from './data.js';
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const button=(text,fn,cls)=>{const b=node('button',text,cls);b.type='button';b.onclick=fn;return b;};
let world=new World(crypto.getRandomValues(new Uint32Array(1))[0]),ownWorld=null,visiting=false,launched=false,paused=false,speed=1,mix=['grass'],selected=null,tool='plant',guide=0,tab='inspect',toastTimer,dirty=true,uiStamp='',lastSave=0,accum=0,lastTime=performance.now(),lastUI=0,lastSync=0;
let harvested=null,catalogUI;
let saveProblem='';
try{const raw=localStorage.getItem(SAVE_KEY);if(raw){world=World.restore(JSON.parse(raw));if(world.state.offline){const gap=Math.min(1800,(Date.now()-world.state.savedAt)/1000);if(gap>10){world.advance(gap);world.emit('while you were away, '+Math.floor(gap/60)+' minutes passed in the garden.','event');}}}}catch(e){saveProblem='Your previous save could not be opened. It has been kept; export it from postcards before starting over.';}
if(!world.state.started&&!saveProblem){seedLivingWorld(world);world.state.started=false;}
document.querySelector('.house-link').addEventListener('click',event=>{try{if(window.parent!==window&&window.parent.__room?.game?.close){event.preventDefault();window.parent.__room.game.close();}}catch{}});
const audio=new GardenAudio();
const view=new View($('world'),onWorldTap);view.reset();
const SAVE_PREFS='a-little-too-alive-prefs';
let prefs={sound:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem(SAVE_PREFS)||'{}')};}catch{}
function toast(text){$('toast').textContent=text;$('toast').classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('on'),5500);}
function save(){if(!launched||visiting||!world.state.started||saveProblem)return;try{world.state.savedAt=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(world.snapshot()));}catch{toast('This browser could not save the garden. Export a postcard to keep it.');}}
function showModal(title,build){$('modal-title').textContent=title;$('modal-content').replaceChildren();build($('modal-content'));if(!$('modal').open)$('modal').showModal();}
function closeModal(){$('modal').close();}
$('modal-close').onclick=closeModal;$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
function launch(guided=false){launched=true;world.state.started=true;guide=guided?(mix.length?2:1):0;$('intro').hidden=true;if(prefs.sound)audio.set(true).then(updateSound).catch(()=>{});if(saveProblem)toast(saveProblem);updateGuide();if(innerWidth<=900&&guided)$('workbench').classList.add('open');}
$('start-free').onclick=()=>launch(false);$('start-guided').onclick=()=>{switchWorld('empty');launch(true);};if(world.state.started)launch();
$('start-empty').onclick=()=>switchWorld('empty');
$('worlds').onclick=showWorlds;
$('planet-view').onclick=()=>view.orbit();
for(const [id,predicate]of [['find-herd',e=>e.kind==='creature'&&anatomy(e.genes).diet==='grazer'],['find-town',e=>e.kind==='home'&&e.phase!=='city'],['find-city',e=>e.phase==='city']])$(id).onclick=()=>{const e=world.state.entities.find(predicate);if(e){inspect(e.id);if(e.phase==='city')view.focus(e);else view.locate(e.x,e.z,22);}else toast('This world has not grown that yet. Plant life and let it develop.');};
function archiveCurrent(){const current=visiting?ownWorld:world;if(!launched||!current?.state.started)return;const entries=JSON.parse(localStorage.getItem('alive-world-archive')||'[]');entries.push({name:current.state.name,at:Date.now(),world:current.snapshot()});localStorage.setItem('alive-world-archive',JSON.stringify(entries));}
function switchWorld(mode,snapshot=null){try{archiveCurrent();}catch{toast('The current world could not be archived. Export it before starting another.');return;}world=snapshot?World.restore(snapshot):new World(crypto.getRandomValues(new Uint32Array(1))[0]);if(mode==='living')seedLivingWorld(world);if(mode==='empty')world.state.name='An unwritten world';world.state.started=true;visiting=false;ownWorld=null;selected=null;view.followId=null;uiStamp='';$('specimen').dataset.id='';$('visitor').hidden=true;paused=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-pressed','false');launched=true;$('intro').hidden=true;guide=0;updateGuide();closeModal();view.reset();view.sync(world,null);dirty=true;setTool(mode==='empty'?'plant':'inspect');drawMix();if(mode==='empty')$('workbench').classList.add('open');save();}
function showWorlds(){showModal('Your worlds',c=>{c.append(node('p','Your current world is archived before you enter another.'),button('Explore a living world',()=>switchWorld('living'),'primary'),button('Start an empty planet',()=>switchWorld('empty'),'secondary'));try{const entries=JSON.parse(localStorage.getItem('alive-world-archive')||'[]');if(entries.length)c.append(node('h3','Saved worlds'));for(const entry of entries.slice().reverse())c.append(button(entry.name+' · '+new Date(entry.at).toLocaleString(),()=>switchWorld('archive',entry.world),'wide'));}catch{c.append(node('p','The world archive could not be read. Your current world is still available.'));}});}
function updateGuide(){const steps={1:'1. choose ingredients at the seed bench. try moss + eye.',2:'2. tap the ground, or “plant in an open spot”.',3:'3. plant a few different experiments near one another.',4:'4. choose inspect. get to know something you made.'};$('guidance').hidden=!guide;$('guidance-text').textContent=steps[guide]||'';}
$('skip-guide').onclick=()=>{guide=0;updateGuide();};
function drawMix(){
  catalogUI?.update(mix,world);
  $('mix').replaceChildren();for(let i=0;i<3;i++){
    const seed=mix[i];if(seed){const b=button(INGREDIENTS[seed].mark,()=>{mix.splice(i,1);harvested=null;drawMix();},'mix-slot filled');b.setAttribute('aria-label','Remove '+INGREDIENTS[seed].name);b.style.setProperty('--seed-color',INGREDIENTS[seed].color);$('mix').appendChild(b);}else $('mix').appendChild(node('div','+','mix-slot'));
  }
  $('recipe-name').textContent=mix.length?nameOf(mix):'something is waiting.';
  const g=mix.length?(harvested?.genes||genesOf(mix)):null;
  $('recipe-desc').textContent=!g?'choose an ingredient to begin.':kindOf(g,mix)==='home'?'shelter with the potential for a pulse.':kindOf(g,mix)==='plant'?'rooted in sunlight. open to suggestions.':'a small life with somewhere else to be.';
  $('plant-mode').disabled=!mix.length||visiting;$('plant-center').disabled=!mix.length||visiting;
  if(guide===1&&mix.length){guide=2;updateGuide();}
}
for(const [key,def]of Object.entries(INGREDIENTS).filter(([key])=>MUTATIONS.includes(key))){
  const b=button('',()=>{if(mix.length===3){toast('Three ingredients per seed. Remove one from the mix to make room.');return;}mix.push(key);harvested=null;drawMix();audio.tone(300+Object.keys(INGREDIENTS).indexOf(key)*45,.14);},'ingredient');
  b.style.setProperty('--seed-color',def.color);b.title=def.desc;b.setAttribute('aria-label','Add '+def.name+'. '+def.desc);b.append(node('span',def.mark,'glyph'),node('span',def.name));$('ingredients').appendChild(b);
}
$('clear-mix').onclick=()=>{mix=[];harvested=null;drawMix();};
catalogUI=createCatalog({choose(seeds){mix=seeds;harvested=null;drawMix();setTool('plant');},thumbnail(id){return view.thumbnail({id:0,seeds:[id],genes:genesOf([id]),kind:kindOf(genesOf([id]),[id]),phase:'mature',age:40,size:1,residents:0});}});drawMix();
const HINTS={plant:'tap the soil to plant. there are no resource costs.',inspect:'touch a living thing to read its story.',graft:'touch a living thing to graft your current mix into it.',love:'touch the world. affection spreads to nearby life.',fear:'touch the world. fear has consequences.',rain:'touch the soil. a pool becomes part of the ecosystem.',mutate:'touch the world to alter traits in a small area.'};
function setTool(t){tool=t;view.tool=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===t));$('tool-hint').textContent=visiting?'a postcard is a visit. the original world stays with its owner.':HINTS[t];if(t!=='plant')$('workbench').classList.remove('open');}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('plant-mode').onclick=()=>{setTool('plant');if(innerWidth<=900)$('workbench').classList.remove('open');toast('tap somewhere on dry land.');};
function plantAt(x,z){
  if(visiting){toast('You are visiting a postcard. Return to your garden to plant.');return;}
  if(!mix.length){toast('Choose at least one ingredient first.');$('workbench').classList.add('open');return;}
  if(saveProblem){showModal('Keep your previous save?',content=>{content.append(node('p',saveProblem),button('Export previous save',()=>download(localStorage.getItem(SAVE_KEY)||'{}','unreadable-garden-backup.json','application/json')),button('Start this new garden',()=>{saveProblem='';closeModal();plantAt(x,z);},'primary'));});return;}
  const e=world.plant(mix,x,z,harvested||{});if(!e){toast(world.state.entities.length>=LIMIT?'This ecosystem is full. Compost a specimen to make space.':'plant on dry land, a little away from its edge.');return;}
  audio.event('plant');selected=e.id;dirty=true;save();if(guide===2){guide=3;updateGuide();}else if(guide===3&&world.state.stats.planted>=3){guide=4;updateGuide();}
}
$('plant-center').onclick=()=>{let p={x:0,z:0};const n=world.state.stats.planted;for(let i=0;i<100;i++){const a=(n+i)*2.399,r=2+((n+i)%8)*.75;p={x:view.cx+Math.cos(a)*r,z:view.cz+Math.sin(a)*r};if(landAt(p.x,p.z)&&!world.state.entities.some(e=>Math.hypot(e.x-p.x,e.z-p.z)<1.2))break;}plantAt(p.x,p.z);};
function inspect(id){selected=id;$('observer').classList.add('open');setTab('inspect');dirty=true;uiStamp='';if(innerWidth<=900)$('observer').classList.add('open');if(guide===4){guide=0;updateGuide();toast('the garden is yours. try eye + heart near brick + heart.');}}
function onWorldTap(p,id){if(!launched)return;
  if(tool==='inspect'||visiting){if(id){inspect(id);view.focus(world.find(id));}return;}
  if(tool==='graft'){if(!id){toast('Graft onto a living specimen.');return;}if(!mix.length){toast('Mix some ingredients first.');return;}world.graft(id,mix,harvested?.genes);selected=id;audio.event('graft');}
  else if(tool==='plant')plantAt(p.x,p.z);
  else world.affect(tool,p.x,p.z);
  dirty=true;save();
}
$('inspect-next').onclick=()=>{const list=world.state.entities;if(!list.length){toast('plant a first life, then come back.');return;}const i=list.findIndex(e=>e.id===selected);const e=list[(i+1)%list.length];inspect(e.id);view.focus(e);};
function setTab(t){tab=t;for(const k of ['inspect','history','goals'])$(k+'-panel').hidden=k!==t;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));uiStamp='';}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function meter(label,key){const row=node('div',undefined,'meter-row'),head=node('div'),val=node('span');val.dataset.value=key;head.append(node('span',label),val);const track=node('div',undefined,'meter'),bar=node('i');bar.dataset.bar=key;track.append(bar);row.append(head,track);return row;}
function buildSpecimen(e){
  const content=$('specimen');content.replaceChildren();content.dataset.id=e.id;
  const type=node('div',undefined,'specimen-kind');type.dataset.field='kind';const title=node('div',e.name,'specimen-name');title.dataset.field='name';const meta=node('div',undefined,'specimen-meta');meta.dataset.field='meta';content.append(type,title,meta);const traits=node('p',undefined,'anatomy-notes');traits.dataset.field='anatomy';content.append(traits);
  for(const [label,key]of [['Vitality','health'],['Affection','love'],['Fear','fear'],['Awareness','knowledge']])content.appendChild(meter(label,key));
  const memory=node('p',e.memory,'memory');memory.dataset.field='memory';content.appendChild(memory);
  const label=node('label','Your influence','control-label');label.htmlFor='specimen-control';const select=node('select');select.id='specimen-control';for(const [v,t]of [['wild','Free will — let it happen'],['gentle','Gentle — no biting or burning'],['rooted','Stay here — no wandering or breeding']]){const o=node('option',t);o.value=v;select.appendChild(o);}select.disabled=visiting;select.value=e.control;select.onchange=()=>{const live=world.find(selected);if(live){live.control=select.value;save();}};content.append(label,select);
  const actions=node('div',undefined,'specimen-actions');actions.append(button('harvest a seed',()=>{const live=world.find(selected);if(!live)return;mix=[...live.seeds];harvested={genes:{...live.genes},memory:live.memory,generation:live.generation};drawMix();setTool('plant');$('workbench').classList.add('open');if(innerWidth<=900)$('observer').classList.remove('open');toast('a seed with its inherited traits. the original keeps living.');}),button('copy a gift',()=>giftSeed(world.find(selected))),button('look closer',()=>{const live=world.find(selected);if(live)view.focus(live);}),button('compost',()=>{if(visiting){toast('Visitors cannot change the original world.');return;}world.remove(selected,'was composted');selected=null;dirty=true;save();}));content.append(actions);
}
function updateUI(){
  catalogUI?.update(mix,world);
  const s=world.state;$('world-name').textContent=s.name;$('world-time').textContent='day '+(1+Math.floor(s.time/60));$('population').textContent=s.entities.length;$('discoveries').textContent=Object.keys(s.discoveries).length;$('towns').textContent=s.societies.length;$('library-count').textContent=Object.keys(s.discoveries).length;
  const e=world.find(selected);$('empty-inspect').hidden=!!e;$('specimen').hidden=!e;
  if(e){if($('specimen').dataset.id!==String(e.id))buildSpecimen(e);const c=$('specimen');c.querySelector('[data-field=kind]').textContent=(e.phase==='city'?'living city':e.kind)+' / '+(e.phase==='seed'?'germinating':e.phase);c.querySelector('[data-field=name]').textContent=e.name;c.querySelector('[data-field=meta]').textContent='generation '+e.generation+' · '+Math.floor(e.age)+'s old'+(e.residents?' · '+e.residents+' neighbors':'');const phenotype=anatomy(e.genes,e.seeds);c.querySelector('[data-field=anatomy]').textContent=e.kind==='creature'?phenotype.legs+' legs · '+phenotype.diet+' · '+(e.activity||'discovering the world')+(e.parentIds.length?' · parents #'+e.parentIds.join(' + #'):''):e.kind==='home'?((world.state.societies.find(t=>t.id===e.society)?.food||0).toFixed(1)+' food · '+(world.state.societies.find(t=>t.id===e.society)?.materials||0).toFixed(1)+' building material'):'Sun-fed life · habitat and food for nearby species';c.querySelector('[data-field=memory]').textContent='“'+e.memory+'”';
    for(const key of ['health','love','fear','knowledge']){const val=key==='health'?e.health:key==='knowledge'?Math.min(100,e.knowledge/25*100):e[key]*100;c.querySelector('[data-value='+key+']').textContent=key==='knowledge'?e.faith:Math.round(val)+'%';c.querySelector('[data-bar='+key+']').style.width=Math.max(0,Math.min(100,val))+'%';}
  }
  const stamp=s.serial+'|'+tab;if(stamp!==uiStamp){uiStamp=stamp;
    $('history').replaceChildren();if(!s.history.length)$('history').append(node('p','nothing has happened. you could change that.','muted'));
    for(const event of s.history.slice(0,25)){const row=node('div',undefined,'note '+event.type);row.append(node('time','day '+(1+Math.floor(event.t/60))),node('p',event.text));$('history').appendChild(row);}
    $('goals').replaceChildren();for(const m of MILESTONES){const row=node('div',undefined,'goal'+(s.milestones[m.id]?' earned':'')),txt=node('div');row.append(node('span',s.milestones[m.id]?'✳':'○'));txt.append(node('strong',m.name),node('p',m.desc));row.append(txt);$('goals').append(row);}
  }
}
function togglePause(){paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-pressed',String(paused));$('pause').setAttribute('aria-label',paused?'Resume world':'Pause world');}
$('pause').onclick=togglePause;document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
$('zoom-in').onclick=()=>view.zoom(.8);$('zoom-out').onclick=()=>view.zoom(1.25);$('reset-camera').onclick=()=>view.reset();
function updateSound(){$('sound').textContent=audio.enabled?'sound on':'sound off';$('sound').setAttribute('aria-pressed',String(audio.enabled));$('sound').setAttribute('aria-label',audio.enabled?'Mute sound':'Enable sound');prefs.sound=audio.enabled;try{localStorage.setItem(SAVE_PREFS,JSON.stringify(prefs));}catch{}}
$('sound').onclick=async()=>{try{await audio.set(!audio.enabled);updateSound();}catch{toast('Sound is unavailable in this browser.');}};
for(const [toggle,panel,other] of [['bench-toggle','workbench','observer'],['notes-toggle','observer','workbench']])$(toggle).onclick=()=>{$(panel).classList.toggle('open');$(other).classList.remove('open');};
$('bench-close').onclick=()=>$('workbench').classList.remove('open');$('observer-close').onclick=()=>$('observer').classList.remove('open');
$('library').onclick=()=>showModal('The field guide',c=>{const ds=Object.values(world.state.discoveries);c.append(node('p',ds.length?'Every discovered recipe can be planted again. Wild offspring also inherit blended traits from their parents.':'Plant something. Your discoveries will find their way here.'));const grid=node('div',undefined,'library-grid');for(const d of ds){const b=button('',()=>{mix=[...d.seeds];harvested={genes:{...d.genes},generation:d.generation};drawMix();setTool('plant');closeModal();$('workbench').classList.add('open');},'discovery-card');b.append(node('span',d.seeds.map(s=>INGREDIENTS[s].mark).join(' '),'glyphs'),node('strong',d.name),node('small',d.seeds.map(s=>INGREDIENTS[s].name).join(' + ')));grid.append(b);}c.append(grid);});
$('help').onclick=()=>showModal('A few questionable suggestions',c=>{
  for(const [title,text]of [['Plant anything','Mix up to three ingredients. Tap the ground, or use “plant in an open spot”. Power is free; consequences are real.'],['Borrow a trait','Choose graft to blend your seed mixture into an existing creation. Inspect → harvest copies its ingredients without removing it.'],['Let life surprise you','Try eye + heart creatures near a brick + heart home. Three aware neighbors can found a society. Loved homes with two residents may grow legs. Three waking homes can join into a living city.'],['Feelings become places','Love bonds and heals. Dread makes hungry, fiery creatures dangerous; frightened plants grow thorns. Grief can leave a pool after a death.'],['Look, listen, interfere','Drag to orbit. Right-drag or Shift-drag to move across the land. Scroll or pinch continuously from a creature to the whole planet. At planet scale, tap a continent to descend. Inspect a specimen to choose free will, gentle behavior, or rooted life. Space pauses; 1 / 2 / 3 change time; Escape closes panels.'],['A growing experiment','Postcards share visitable snapshots. Gift codes copy ingredients, inherited traits, and memory. This first sandbox uses local simulation and procedural art; it has no live multiplayer server or paid AI service.']])c.append(node('h3',title),node('p',text));
  const l=node('label'),input=node('input');input.type='checkbox';input.checked=world.state.offline;input.disabled=visiting;input.onchange=()=>{world.state.offline=input.checked;save();};l.append(input,document.createTextNode('Let my world evolve while away (up to 30 minutes per return).'));c.append(l);
});
$('world-name').onclick=()=>{if(visiting)return;showModal('Name this unreasonable place',c=>{const input=node('input');input.type='text';input.maxLength=40;input.value=world.state.name;input.setAttribute('aria-label','World name');c.append(input,button('Give it a name',()=>{world.state.name=input.value.trim()||'The first garden';save();updateUI();closeModal();},'primary'));});};
async function clipboard(text){try{await navigator.clipboard.writeText(text);return true;}catch{return false;}}
function showCopy(text,title='Your postcard'){showModal(title,c=>{c.append(node('p','Copy this text and send it to someone.'));const area=node('textarea');area.value=text;area.setAttribute('aria-label',title);area.readOnly=true;c.append(area,button('Select all',()=>{area.focus();area.select();}));});}
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function base64(bytes){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function unbase64(text){const binary=atob(text.replaceAll('-','+').replaceAll('_','/'));return Uint8Array.from(binary,c=>c.charCodeAt(0));}
async function encode(payload){const bytes=new TextEncoder().encode(JSON.stringify(payload));if(typeof CompressionStream!=='undefined'){const data=await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();return 'ALIVE1Z.'+base64(new Uint8Array(data));}return 'ALIVE1.'+base64(bytes);}
async function decode(text){if(text.length>300000)throw Error('That postcard is too large.');if(text.includes('#visit='))text=text.slice(text.indexOf('#visit=')+7);text=text.trim();const compressed=text.startsWith('ALIVE1Z.');if(!compressed&&!text.startsWith('ALIVE1.'))throw Error('Paste an ALIVE1 postcard or gift code.');let bytes=unbase64(text.slice(compressed?8:7));if(compressed){const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();const chunks=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>650000){await reader.cancel();throw Error('That postcard expands beyond the world limit.');}chunks.push(value);}}finally{reader.releaseLock();}bytes=new Uint8Array(size);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}}if(bytes.length>650000)throw Error('That postcard is too large.');return JSON.parse(new TextDecoder().decode(bytes));}
async function giftSeed(e){if(!e)return;const code=await encode({type:'seed',seeds:[...e.seeds],genes:{...e.genes},memory:e.memory.slice(0,200),generation:e.generation,name:e.name});if(await clipboard(code))toast('a copy of this seed is on your clipboard. its original stays here.');else showCopy(code,'A seed to give away');}
let pendingGift=null;
async function acceptCode(text){const data=await decode(text);
  if(data.type==='world'){const visitorWorld=World.restore(data.world);if(!visiting){save();ownWorld=world;}world=visitorWorld;world.events=[];visiting=true;selected=null;uiStamp='';$('specimen').dataset.id='';$('visitor').hidden=false;launched=true;$('intro').hidden=true;paused=true;$('pause').textContent='▶';$('pause').setAttribute('aria-pressed','true');setTool('inspect');drawMix();view.reset();dirty=true;closeModal();toast('a visit to '+world.state.name+'. your own garden is safe.');return;}
  if(data.type==='seed'){
    if(visiting)throw Error('Return to your own garden to accept a gift.');
    if(!Array.isArray(data.seeds)||!data.seeds.length||data.seeds.length>3||data.seeds.some(k=>!Object.hasOwn(INGREDIENTS,k))||typeof data.memory!=='string'||data.memory.length>400||typeof data.name!=='string'||data.name.length>100||!Number.isInteger(data.generation)||data.generation<1||data.generation>100000)throw Error('This seed is not valid.');
    const trial=new World();trial.plant(data.seeds,0,0,{genes:data.genes,memory:data.memory,generation:data.generation});World.restore(trial.snapshot());
    pendingGift=data;showModal('A seed from elsewhere',c=>{c.append(node('p',data.name+' · '+data.seeds.map(s=>INGREDIENTS[s].name).join(' + ')),node('p','“'+data.memory+'”'),node('p','Accepting plants one copy in your garden. Its traits may spread through future offspring.'),button('Accept and plant this gift',()=>{const gift=pendingGift;pendingGift=null;const e=world.plant(gift.seeds,0,0,{genes:gift.genes,memory:gift.memory,generation:gift.generation});if(!e){toast('This ecosystem is full. Make room before accepting the gift.');return;}launched=true;$('intro').hidden=true;selected=e.id;dirty=true;save();closeModal();toast('a visitor has taken root.');},'primary'));});return;
  }
  throw Error('This is neither a world postcard nor a seed gift.');
}
$('share').onclick=()=>showModal('Postcards from the unreasonable',c=>{
  c.append(node('p','Send a snapshot of your world. A visitor can explore the copy and send a seed gift back; only you decide what gets planted in your original.'));
  const actions=node('div',undefined,'actions');
  actions.append(button('Copy visit link',async()=>{try{const code=await encode({type:'world',world:world.snapshot()});const url=location.href.split('#')[0]+'#visit='+code;if(await clipboard(url))toast('your world postcard is on the clipboard.');else showCopy(url);}catch(e){toast(e.message);}}),button('Export world file',()=>download(JSON.stringify({type:'world',world:world.snapshot()}),'a-little-too-alive.json','application/json')));c.append(actions);
  if(visiting)c.append(button('Return to my garden',()=>{world=ownWorld;ownWorld=null;visiting=false;selected=null;$('specimen').dataset.id='';$('visitor').hidden=true;paused=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-pressed','false');history.replaceState(null,'',location.pathname+location.search);setTool('plant');drawMix();dirty=true;uiStamp='';closeModal();view.reset();},'primary'));
  c.append(node('h3','Open a postcard or accept a gift'));const area=node('textarea');area.placeholder='Paste a visit link or ALIVE1 code';area.setAttribute('aria-label','World postcard or seed gift code');c.append(area,button('Open this code',async()=>{try{await acceptCode(area.value);}catch(e){toast(e.message);}}));
  const file=node('input');file.type='file';file.accept='.json,application/json';file.setAttribute('aria-label','Import a world postcard file');file.onchange=async()=>{try{if(file.files[0].size>650000)throw Error('That postcard is too large.');await acceptCode(await encode(JSON.parse(await file.files[0].text())));}catch(e){toast(e.message);}};c.append(node('h3','Or open an exported world file'),file);
  if(saveProblem)c.append(button('Export unreadable previous save',()=>download(localStorage.getItem(SAVE_KEY)||'{}','garden-backup.json','application/json')));
});
let recorder=null,recordTimer=null,recordCanvas=null,recordContext=null;
$('record').onclick=()=>{
  if(recorder?.state==='recording'){recorder.stop();return;}
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){toast('Clip recording is unavailable here. Use your device’s screen recorder.');return;}
  recordCanvas=document.createElement('canvas');recordCanvas.width=Math.min(1280,view.renderer.domElement.width);recordCanvas.height=Math.round(recordCanvas.width*view.renderer.domElement.height/view.renderer.domElement.width);recordContext=recordCanvas.getContext('2d');
  const stream=recordCanvas.captureStream(30);const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  try{recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});}catch{stream.getTracks().forEach(t=>t.stop());recordCanvas=null;recordContext=null;toast('This browser could not start recording.');return;}
  const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{clearTimeout(recordTimer);stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType}),url=URL.createObjectURL(blob);showModal('A postcard that moves',c=>{const video=node('video');video.src=url;video.controls=true;video.style.width='100%';const a=node('a','save clip');a.href=url;a.download='a-little-too-alive.'+(recorder.mimeType.includes('mp4')?'mp4':'webm');c.append(video,a,node('p','A silent clip of your world. Keep experimenting; the next one might be stranger.'));$('modal').addEventListener('close',()=>URL.revokeObjectURL(url),{once:true});});$('record').textContent='record clip';$('record').classList.remove('recording');recordCanvas=null;recordContext=null;};
  recorder.start();recordTimer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},20000);$('record').textContent='stop recording';$('record').classList.add('recording');toast('recording up to 20 seconds. let something happen.');
};
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||$('modal').open)return;if(e.code==='Space'){e.preventDefault();togglePause();}if(e.key==='1'||e.key==='2'||e.key==='3')document.querySelector('[data-speed="'+({'1':1,'2':3,'3':12})[e.key]+'"]').click();if(e.key==='Escape'){$('workbench').classList.remove('open');$('observer').classList.remove('open');setTool('inspect');}if(e.key==='+'||e.key==='=')view.zoom(.9);if(e.key==='-')view.zoom(1.1);});
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();lastTime=performance.now();});
function frame(now){
  const delta=Math.min(.15,(now-lastTime)/1000);lastTime=now;
  if(launched&&!paused&&!document.hidden&&!$('modal').open){accum+=delta*speed;let steps=0;while(accum>=.25&&steps++<12){world.tick(.25);accum-=.25;dirty=true;}}
  if(dirty&&now-lastSync>160){view.sync(world,selected);lastSync=now;dirty=false;}
  if(now-lastUI>300){updateUI();lastUI=now;const important=world.events.find(e=>e.type==='milestone'||e.type==='transformation')||world.events.find(e=>e.type==='discovery');if(important){toast(important.text);audio.event(important.type);}world.events=[];}
  view.selected=selected;view.render(world,now/1000);audio.update(world,now/1000);
  if(recordContext){const c=recordContext,w=recordCanvas.width,h=recordCanvas.height;c.drawImage(view.renderer.domElement,0,0,w,h);c.fillStyle='rgba(18,29,24,.7)';c.fillRect(0,h-65,w,65);c.fillStyle='#e8edd3';c.font=Math.max(15,w/48)+'px Georgia';c.fillText('a little too alive.',22,h-36);c.font=Math.max(11,w/80)+'px sans-serif';c.fillText(world.state.history[0]?.text?.slice(0,100)||'everything is a seed.',22,h-14);}
  if(now-lastSave>5000){save();lastSave=now;}requestAnimationFrame(frame);
}
setTool('inspect');view.sync(world,selected);updateUI();requestAnimationFrame(frame);
window.__alive={get world(){return world;},view,get visiting(){return visiting;},get selected(){return selected;},get mix(){return [...mix];},get tool(){return tool;},get paused(){return paused;},setMix(seeds){mix=[...seeds];harvested=null;drawMix();},setTool,inspect,plantAt,acceptCode,encode,decode,save,launch,advance(seconds){world.advance(seconds);dirty=true;view.sync(world,selected);updateUI();},get snapshot(){return world.snapshot();}};
if(location.hash.startsWith('#visit=')){acceptCode(location.hash.slice(7)).catch(e=>toast(e.message));}
