const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/kylef/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(__dirname,'../test-output');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const facts={};const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.stack));
  await page.goto('http://127.0.0.1:8431/a-little-too-alive/');await page.waitForFunction(()=>window.__alive);
  assert.equal(await page.locator('#intro').isVisible(),true);await page.click('#start-free');assert.equal(await page.locator('#intro').isVisible(),false);
  await page.click('#plant-center');await page.waitForFunction(()=>__alive.world.state.entities.length===1);await page.click('#pause');
  const first=await page.evaluate(()=>__alive.snapshot);assert.equal(first.entities[0].name,'Watchfern');
  await page.click('#clear-mix');await page.getByRole('button',{name:/^Add Brick\./}).click();await page.getByRole('button',{name:/^Add Heart\./}).click();assert.equal(await page.locator('#recipe-name').textContent(),'Hearthling');
  const target=await page.evaluate(async()=>{const T=await import('three');const p=new T.Vector3(3,.4,0).project(__alive.view.camera);return{x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight};});
  await page.mouse.click(target.x,target.y);assert.equal(await page.evaluate(()=>__alive.world.state.entities.length),2);
  await page.evaluate(()=>__alive.advance(12));await page.evaluate(()=>__alive.inspect(__alive.world.state.entities[1].id));await page.waitForTimeout(500);
  await page.selectOption('#specimen-control','gentle');assert.equal(await page.evaluate(()=>__alive.world.state.entities[1].control),'gentle');
  await page.getByRole('button',{name:'harvest a seed',exact:true}).click();assert.deepEqual(await page.evaluate(()=>__alive.mix),['brick','heart']);
  await page.evaluate(()=>__alive.save());const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('a-little-too-alive-save')));await page.reload();await page.waitForFunction(()=>window.__alive);assert.equal(await page.evaluate(()=>__alive.world.state.stats.planted),saved.stats.planted);await page.click('#pause');
  facts.persistence={entities:saved.entities.length,kind:saved.entities[1].kind,control:saved.entities[1].control};
  const postcard=await page.evaluate(async()=>{const snapshot=__alive.snapshot;snapshot.name='A stranger’s garden';return __alive.encode({type:'world',world:snapshot});});
  const before=await page.evaluate(()=>JSON.stringify({...JSON.parse(localStorage.getItem('a-little-too-alive-save')),savedAt:0}));await page.evaluate(code=>__alive.acceptCode(code),postcard);assert.equal(await page.evaluate(()=>__alive.visiting),true);assert.equal(await page.evaluate(()=>JSON.stringify({...JSON.parse(localStorage.getItem('a-little-too-alive-save')),savedAt:0})),before);
  await page.click('#share');await page.getByRole('button',{name:'Return to my garden',exact:true}).click();assert.equal(await page.evaluate(()=>__alive.visiting),false);assert.equal(await page.evaluate(()=>__alive.world.state.name),'The first garden');
  if(!await page.evaluate(()=>__alive.paused))await page.click('#pause');
  await page.evaluate(async()=>{const e=__alive.world.state.entities[0];await __alive.acceptCode(await __alive.encode({type:'seed',seeds:e.seeds,genes:e.genes,memory:'a gift from the far garden.',generation:4,name:e.name}));});
  const beforeGift=await page.evaluate(()=>__alive.world.state.entities.length);assert.equal(beforeGift,2);await page.getByRole('button',{name:'Accept and plant this gift',exact:true}).click();assert.equal(await page.evaluate(()=>__alive.world.state.entities.length),3);assert.equal(await page.evaluate(()=>__alive.world.state.entities.at(-1).memory),'a gift from the far garden.');facts.postcards='visits preserve own save; gifts require explicit acceptance';
  await page.evaluate(()=>{for(let i=0;i<30;i++){const seeds=[['moss','eye'],['moss','heart'],['brick','heart'],['eye','heart'],['tooth','moss'],['echo','eye'],['brick','eye']][i%7];__alive.world.plant(seeds,Math.cos(i*2.4)*(3+i%7),Math.sin(i*2.4)*(3+i%7));}__alive.world.affect('love',0,0);__alive.advance(60);__alive.view.sync(__alive.world,__alive.selected);});
  await page.waitForTimeout(1000);await page.screenshot({path:path.join(out,'desktop.png')});
  facts.desktop=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,entities:__alive.world.state.entities.length,draws:__alive.view.renderer.info.render.calls,triangles:__alive.view.renderer.info.render.triangles,canvas:[__alive.view.renderer.domElement.width,__alive.view.renderer.domElement.height]}));assert.equal(facts.desktop.overflow,false);
  await page.click('#record');await page.waitForTimeout(1300);await page.click('#record');await page.waitForSelector('#modal video');facts.recording=await page.locator('#modal video').evaluate(v=>({hasBlob:v.src.startsWith('blob:'),ready:v.readyState}));assert.equal(facts.recording.hasBlob,true);await page.click('#modal-close');
  await page.click('#sound');facts.sound=await page.locator('#sound').getAttribute('aria-pressed');assert.equal(facts.sound,'true');
  await page.emulateMedia({reducedMotion:'reduce'});
  const mobileCtx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const mobile=await mobileCtx.newPage();mobile.on('pageerror',e=>errors.push(e.stack));await mobile.goto('http://127.0.0.1:8431/a-little-too-alive/');await mobile.waitForFunction(()=>window.__alive);
  await mobile.tap('#start-guided');await mobile.tap('#plant-center');await mobile.tap('#bench-close');const pos=await mobile.evaluate(async()=>{const T=await import('three'),p=new T.Vector3(-3,.4,0).project(__alive.view.camera);return {x:(p.x+1)/2*innerWidth,y:(1-p.y)/2*innerHeight};});await mobile.touchscreen.tap(pos.x,pos.y);await mobile.waitForTimeout(400);assert.equal(await mobile.evaluate(()=>__alive.world.state.stats.planted),2);
  await mobile.tap('#notes-toggle');await mobile.tap('#observer-close');await mobile.tap('#bench-toggle');await mobile.screenshot({path:path.join(out,'mobile.png')});
  facts.mobile=await mobile.evaluate(()=>{const els=['bench-toggle','notes-toggle','pause','plant-center'];return{overflow:document.documentElement.scrollWidth>innerWidth,population:__alive.world.state.stats.planted,targets:els.map(id=>{const b=document.getElementById(id).getBoundingClientRect();return{id,w:b.width,h:b.height,inViewport:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight};})};});assert.equal(facts.mobile.overflow,false);assert.ok(facts.mobile.targets.every(t=>t.inViewport));
  facts.errors=errors;fs.writeFileSync(path.join(out,'browser-facts.json'),JSON.stringify(facts,null,2));console.log(JSON.stringify(facts,null,2));assert.equal(errors.length,0);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
