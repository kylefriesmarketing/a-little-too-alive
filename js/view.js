import * as THREE from 'three';
import {groundAt,RADIUS,INGREDIENTS} from './data.js';
const lerp=(a,b,t)=>a+(b-a)*t;
const G={orb:new THREE.SphereGeometry(1,12,8),cone:new THREE.ConeGeometry(1,1,7),box:new THREE.BoxGeometry(1,1,1),tube:new THREE.CylinderGeometry(1,1,1,9),ring:new THREE.TorusGeometry(1,.12,5,16)};
const mats=new Map();
function mat(color,glow=0){const k=color+':'+glow;if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color,roughness:.85,flatShading:true,emissive:color,emissiveIntensity:glow}));return mats.get(k);}
function part(parent,shape,color,pos,scale,glow=0){const m=new THREE.Mesh(G[shape],mat(color,glow));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function eye(parent,x,y,z,s=.11){part(parent,'orb','#ede7ce',[x,y,z],[s,s,s*.7]);part(parent,'orb','#243328',[x,y,z+s*.62],[s*.45,s*.55,s*.35]);}
function hash(n){return (Math.sin(n*127.1+311.7)*43758.5453123)%1;}
export class View {
  constructor(container,onTap,onDrag){
    this.container=container;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#263630');this.scene.fog=new THREE.FogExp2('#263630',.013);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;container.appendChild(this.renderer.domElement);
    this.camera=new THREE.PerspectiveCamera(36,1,.1,160);this.target=new THREE.Vector3(0,0,0);this.yaw=.72;this.pitch=.88;this.distance=56;this.cameraPosition();
    this.scene.add(new THREE.HemisphereLight('#e4efcf','#405553',2));
    const sun=new THREE.DirectionalLight('#ffe5b6',3.3);sun.position.set(-18,29,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;sun.shadow.normalBias=.055;sun.shadow.bias=-.0004;this.scene.add(sun);
    const fill=new THREE.DirectionalLight('#aac6e5',.8);fill.position.set(12,8,-18);this.scene.add(fill);
    this.entities=new Map();this.patches=new Map();this.links=new THREE.Group();this.scene.add(this.links);this.bubbles=new Map();this.makeIsland();
    this.selection=new THREE.Mesh(new THREE.RingGeometry(.82,.86,48),new THREE.MeshBasicMaterial({color:'#edf2b9',transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));this.selection.rotation.x=-Math.PI/2;this.selection.visible=false;this.scene.add(this.selection);
    this.cursor=new THREE.Mesh(new THREE.RingGeometry(.5,.54,40),new THREE.MeshBasicMaterial({color:'#d8e6a4',transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));this.cursor.rotation.x=-Math.PI/2;this.cursor.visible=false;this.scene.add(this.cursor);
    this.ray=new THREE.Raycaster();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.4);this.pointer=new THREE.Vector2();this.tool='plant';this.selected=null;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.bind(onTap,onDrag);this.resize();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
  }
  cameraPosition(){this.camera.position.set(this.target.x+Math.sin(this.yaw)*Math.cos(this.pitch)*this.distance,this.target.y+Math.sin(this.pitch)*this.distance,this.target.z+Math.cos(this.yaw)*Math.cos(this.pitch)*this.distance);this.camera.lookAt(this.target);this.camera.updateMatrixWorld();}
  resize(){const w=this.container.clientWidth||innerWidth,h=this.container.clientHeight||innerHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);}
  zoom(n){this.distance=Math.max(14,Math.min(79,this.distance*n));this.cameraPosition();}
  reset(){this.distance=innerWidth<700?69:56;this.yaw=.72;this.pitch=.88;this.target.set(0,0,0);this.cameraPosition();}
  focus(e){this.target.set(e.x,0,e.z);this.distance=26;this.cameraPosition();}
  makeIsland(){
    const root=new THREE.Group();this.scene.add(root);
    const earth=new THREE.Mesh(new THREE.CylinderGeometry(RADIUS-.1,RADIUS*.88,2.8,64),mat('#594c39'));earth.position.y=-1.76;earth.receiveShadow=true;root.add(earth);
    const underside=new THREE.Mesh(new THREE.CylinderGeometry(RADIUS*.88,12,2.1,64),mat('#3b4030'));underside.position.y=-3.6;root.add(underside);
    const geo=new THREE.PlaneGeometry(RADIUS*2,RADIUS*2,70,70);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;const colors=[];const green=new THREE.Color('#93a779'),edge=new THREE.Color('#626e4d'),sand=new THREE.Color('#c0ae87');
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),d=Math.hypot(x,z);pos.setY(i,groundAt(x,z));const v=(Math.sin(x*.43)+Math.cos(z*.6)+Math.sin(z*.2+x*.8))*.15+.5;const c=green.clone().lerp(edge,Math.max(0,(d-12)/7));c.lerp(sand,Math.max(0,v-.6)*.65);colors.push(c.r,c.g,c.b);}
    const index=[];for(let i=0;i<geo.index.count;i+=3){const a=geo.index.getX(i),b=geo.index.getX(i+1),c=geo.index.getX(i+2);if([a,b,c].every(k=>Math.hypot(pos.getX(k),pos.getZ(k))<RADIUS))index.push(a,b,c);}geo.setIndex(index);geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    this.ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));this.ground.receiveShadow=true;root.add(this.ground);
    // Inert stones and grass at the edge frame a genuinely empty starting world.
    for(let i=0;i<80;i++){const a=i*2.399,r=13.4+Math.abs(hash(i))*3,x=Math.cos(a)*r,z=Math.sin(a)*r;
      const rock=part(root,'orb',i%3?'#92977b':'#b7b99c',[x,groundAt(x,z)+.08,z],[.15+Math.abs(hash(i+9))*.3,.12+Math.abs(hash(i+3))*.2,.2+Math.abs(hash(i+6))*.25]);rock.rotation.set(i*.4,i*.7,0);
      if(i%3===0)for(let j=0;j<3;j++){const grass=part(root,'cone','#758361',[x+j*.15,groundAt(x,z)+.3,z+.25],[.07,.7,.07]);grass.rotation.z=(j-1)*.35;}}
    // Water and its ring catch the light below the little suspended ecosystem.
    const water=new THREE.Mesh(new THREE.CircleGeometry(90,80),new THREE.MeshStandardMaterial({color:'#354a43',roughness:.5,metalness:.15}));water.rotation.x=-Math.PI/2;water.position.y=-5.1;water.receiveShadow=true;this.scene.add(water);
    for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(19+i*4,19.07+i*4,100),new THREE.MeshBasicMaterial({color:'#7c9880',transparent:true,opacity:.13,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-5.06;this.scene.add(ring);}
    const dust=new THREE.BufferGeometry(),d=[];for(let i=0;i<110;i++)d.push(Math.sin(i*9.3)*22,2+Math.abs(Math.sin(i*8.8))*10,Math.cos(i*5.3)*22);dust.setAttribute('position',new THREE.Float32BufferAttribute(d,3));this.dust=new THREE.Points(dust,new THREE.PointsMaterial({color:'#efdab2',size:.055,transparent:true,opacity:.5}));this.scene.add(this.dust);
  }
  makeEntity(e){
    const root=new THREE.Group();root.userData.entityId=e.id;const g=e.genes;const body=new THREE.Group();root.add(body);root.userData.body=body;root.userData.legs=[];
    const base=new THREE.Color(e.kind==='plant'?'#adc781':e.kind==='home'?'#d5b79a':'#e4b7b0');
    if(g.heat>.4)base.lerp(new THREE.Color('#df8b63'),g.heat*.5);if(g.water>.4)base.lerp(new THREE.Color('#81bebc'),g.water*.5);if(g.song>.4)base.lerp(new THREE.Color('#b6a0cf'),g.song*.4);const skin='#'+base.getHexString();
    if(e.kind==='plant'){
      part(body,'tube','#77845b',[0,.5,0],[.09,.9,.09]);
      for(let i=0;i<4;i++){const a=i*2.4;const leaf=part(body,'orb',skin,[Math.cos(a)*.3,.35+i*.17,Math.sin(a)*.3],[.37,.085,.18]);leaf.rotation.set(.25,a,.45);}
      part(body,'orb',g.fang>.5?'#d6a095':skin,[0,1.1,0],[.36,.32,.31]);
      if(g.mind>.3){eye(body,-.12,1.14,.27,.12);eye(body,.12,1.14,.27,.12);}
      if(g.fang>.4){part(body,'orb','#46322b',[0,.98,.28],[.25,.13,.06]);for(let i=-1;i<=1;i++){const t=part(body,'cone','#eee3bf',[i*.12,1.01,.34],[.045,.15,.06]);t.rotation.z=Math.PI;}}
      if(g.love>.3){const bloom=part(body,'orb','#eca2af',[0,1.32,0],[.15,.17,.14],.12);root.userData.heart=bloom;}
      if(g.song>.4){const cap=part(body,'cone','#b9a2d7',[0,1.4,0],[.32,.2,.32]);cap.rotation.z=.2;}
    } else if(e.kind==='home'){
      part(body,'orb',skin,[0,.65,0],[.68,.68,.55]);
      part(body,'box',skin,[0,.48,0],[1.08,.75,.83]);
      const roof=part(body,'cone',g.love>.3?'#a77870':'#708c68',[0,1.25,0],[.95,.66,.82]);roof.rotation.y=Math.PI/4;
      part(body,'orb','#514a3d',[0,.3,.48],[.16,.26,.035]);
      for(const x of [-.29,.29]){part(body,'orb','#e9dda0',[x,.75,.48],[.13,.15,.04],.4);if(g.mind>.3)part(body,'orb','#26392c',[x,.75,.52],[.05,.06,.03]);}
      if(g.love>.3){const h=part(body,'orb','#df8c9c',[0,1.03,.33],[.17,.2,.14],.25);root.userData.heart=h;}
      if(g.flora>.4)for(let i=0;i<3;i++)part(body,'orb','#a6ba79',[i*.22-.2,1.53,-.1],[.18,.18,.18]);
      if(g.fang>.4)for(let i=-1;i<=1;i++){const t=part(body,'cone','#f1e2b8',[i*.14,.38,.53],[.055,.17,.06]);t.rotation.z=Math.PI;}
      if(e.phase==='walking'||e.phase==='city'){
        for(let i=0;i<4;i++){const x=i<2?-.47:.47,z=i%2?-.34:.34;const leg=new THREE.Group();leg.position.set(x,.35,z);body.add(leg);part(leg,'tube','#a48770',[0,-.25,0],[.075,.55,.075]);part(leg,'orb','#d3b792',[.08,-.51,.08],[.18,.09,.13]);root.userData.legs.push(leg);}body.position.y=.5;
      }
      if(e.phase==='city')for(let i=0;i<3;i++){const a=i*2.1;const b=part(body,'tube',skin,[Math.cos(a)*.56,1.1,Math.sin(a)*.5],[.23,1.5,.23]);part(body,'cone','#9e7c79',[b.position.x,1.9,b.position.z],[.35,.4,.35]);eye(body,b.position.x,1.5,b.position.z+.23,.09);}
    } else {
      part(body,'orb',skin,[0,.45,0],[.4,.33,.5]);part(body,'orb',skin,[0,.73,.27],[.32,.28,.31]);
      eye(body,-.125,.8,.52,g.mind>.4?.14:.09);eye(body,.125,.8,.52,g.mind>.4?.14:.09);
      for(let i=0;i<4;i++){const leg=new THREE.Group();leg.position.set(i<2?-.23:.23,.28,i%2?-.27:.28);body.add(leg);part(leg,'orb',skin,[0,-.12,0],[.10,.21,.09]);root.userData.legs.push(leg);}
      if(g.fang>.4){for(const x of [-.16,.16]){const fang=part(body,'cone','#f2e6c9',[x,.55,.5],[.065,.22,.06]);fang.rotation.z=Math.PI;}}
      if(g.love>.3){const h=part(body,'orb','#e98da3',[0,.57,.7],[.12,.11,.055],.18);root.userData.heart=h;}
      if(g.flora>.3){const leaf=part(body,'orb','#a9c17c',[0,1.02,.16],[.11,.28,.07]);leaf.rotation.z=.5;}
      if(g.song>.4)for(const x of [-.21,.21]){const ear=part(body,'cone','#c3aada',[x,1.03,.16],[.10,.4,.08]);ear.rotation.z=x*1.4;}
      if(g.heat>.4)part(body,'orb','#edb473',[0,.7,-.27],[.2,.2,.2],.6);
    }
    if(root.userData.heart)root.userData.heart.userData.baseScale=root.userData.heart.scale.clone();
    this.scene.add(root);return root;
  }
  signature(e){return e.kind+'|'+(['walking','city'].includes(e.phase)?e.phase:'normal')+'|'+Object.values(e.genes).map(n=>n.toFixed(2)).join(',');}
  sync(world,selected){
    const s=world.state;this.selected=selected;const alive=new Set(s.entities.map(e=>e.id));
    for(const [id,m] of this.entities)if(!alive.has(id)){this.scene.remove(m);this.entities.delete(id);this.bubbles.get(id)?.remove();this.bubbles.delete(id);}
    for(const e of s.entities){let m=this.entities.get(e.id);const key=this.signature(e);if(!m||m.userData.key!==key){if(m)this.scene.remove(m);m=this.makeEntity(e);m.userData.key=key;this.entities.set(e.id,m);}}
    const present=new Set(s.patches.map(p=>p.id));for(const [id,m] of this.patches)if(!present.has(id)){this.scene.remove(m);m.geometry.dispose();m.material.dispose();this.patches.delete(id);}
    for(const p of s.patches)if(!this.patches.has(p.id)){
      const color={water:'#669fa2',fire:'#e5a15a',thorns:'#5b5d37'}[p.type];const geometry=p.type==='thorns'?new THREE.ConeGeometry(p.r,.9,7):new THREE.CircleGeometry(p.r,32);
      const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,transparent:true,opacity:.66,roughness:.25,emissive:color,emissiveIntensity:p.type==='fire'?.5:.05,side:THREE.DoubleSide,depthWrite:false}));if(p.type!=='thorns')m.rotation.x=-Math.PI/2;m.position.set(p.x,groundAt(p.x,p.z)+.09,p.z);this.scene.add(m);this.patches.set(p.id,m);
    }
    // Visible bonds are generated from affection, not decorative random lines.
    for(const m of [...this.links.children]){this.links.remove(m);m.geometry.dispose();m.material.dispose();}
    let count=0;for(const e of s.entities)if(e.love>.6){const friend=s.entities.find(n=>n.id>e.id&&n.love>.4&&Math.hypot(n.x-e.x,n.z-e.z)<4);if(friend&&count++<28){const a=new THREE.Vector3(e.x,groundAt(e.x,e.z)+.14,e.z),b=new THREE.Vector3(friend.x,groundAt(friend.x,friend.z)+.14,friend.z);const mid=a.clone().lerp(b,.5);mid.y+=.23;const curve=new THREE.QuadraticBezierCurve3(a,mid,b);const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(14)),new THREE.LineBasicMaterial({color:'#f2bdc7',transparent:true,opacity:.55}));this.links.add(l);}}
  }
  render(world,time){
    const s=world.state;const selected=world.find(this.selected);this.selection.visible=!!selected;
    if(selected){this.selection.position.set(selected.x,groundAt(selected.x,selected.z)+.07,selected.z);this.selection.scale.setScalar(selected.size*1.15);}
    for(const e of s.entities){const m=this.entities.get(e.id);if(!m)continue;const ageScale=e.age<3?.08+e.age*.06:e.age<10?.26+(e.age-3)*.105:1;const breathe=this.reduced?1:1+Math.sin(time*1.5+e.motion)*.025;
      m.position.set(e.x,groundAt(e.x,e.z),e.z);m.scale.set(ageScale*e.size,ageScale*e.size*breathe,ageScale*e.size);m.rotation.y=e.kind==='plant'?e.motion:Math.PI/2-e.heading;
      if(e.kind==='plant'&&!this.reduced)m.rotation.z=Math.sin(time*.9+e.motion)*.035;
      if(!this.reduced&&e.control!=='rooted')m.userData.legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(time*(e.phase==='city'?2:5)+i*Math.PI)*.22;});
      if(m.userData.heart)m.userData.heart.scale.copy(m.userData.heart.userData.baseScale).multiplyScalar(1+(this.reduced?0:Math.sin(time*5+e.motion)*.11));
      // Heart mesh scaling belongs to a normalized pulse multiplier.
      const text=e.speechUntil>s.time?e.speech:null;
      if(text){let bubble=this.bubbles.get(e.id);if(!bubble){bubble=document.createElement('div');bubble.className='speech';document.getElementById('speech-layer').appendChild(bubble);this.bubbles.set(e.id,bubble);}bubble.textContent=text;const pt=new THREE.Vector3(e.x,groundAt(e.x,e.z)+2.3*e.size,e.z).project(this.camera);bubble.style.left=((pt.x+1)*.5*innerWidth)+'px';bubble.style.top=((-pt.y+1)*.5*innerHeight)+'px';bubble.hidden=pt.z>1||this.bubbles.size>9&&e.id!==this.selected;
      }else if(this.bubbles.has(e.id)){this.bubbles.get(e.id).remove();this.bubbles.delete(e.id);}
    }
    if(!this.reduced)this.dust.rotation.y=time*.006;
    for(const p of s.patches){const mesh=this.patches.get(p.id);if(mesh){mesh.material.opacity=Math.min(.65,p.life/12);if(p.type==='fire'&&!this.reduced)mesh.scale.setScalar(1+Math.sin(time*5+p.id)*.12);}}
    this.renderer.render(this.scene,this.camera);
  }
  point(clientX,clientY){const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const ground=this.ray.ray.intersectPlane(this.plane,new THREE.Vector3());if(!ground)return null;return {x:ground.x,z:ground.z};}
  hit(clientX,clientY){this.point(clientX,clientY);this.scene.updateMatrixWorld(true);const hits=this.ray.intersectObjects([...this.entities.values()],true);if(!hits.length)return null;let o=hits[0].object;while(o&&!o.userData.entityId)o=o.parent;return o?.userData.entityId||null;}
  bind(onTap,onDrag){
    const c=this.renderer.domElement;const pointers=new Map();let start=null,last=null,pinch=0,moved=false;
    c.addEventListener('contextmenu',e=>e.preventDefault());
    c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){start={x:e.clientX,y:e.clientY};last={...start};moved=false;}else{moved=true;const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
    c.addEventListener('pointermove',e=>{
      const pt=this.point(e.clientX,e.clientY);if(pt&&Math.hypot(pt.x,pt.z)<RADIUS){this.cursor.visible=this.tool!=='inspect';this.cursor.position.set(pt.x,groundAt(pt.x,pt.z)+.08,pt.z);this.cursor.scale.setScalar(['love','fear','rain','mutate'].includes(this.tool)?7:1);}else this.cursor.visible=false;
      if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){const p=[...pointers.values()],n=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch>0)this.zoom(pinch/n);pinch=n;moved=true;return;}
      if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>6)moved=true;
      if(moved&&last){this.yaw-=(e.clientX-last.x)*.006;this.pitch=Math.max(.3,Math.min(1.4,this.pitch+(e.clientY-last.y)*.004));this.cameraPosition();onDrag?.();}
      last={x:e.clientX,y:e.clientY};
    });
    c.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);if(!moved&&start){const pt=this.point(e.clientX,e.clientY);if(pt)onTap(pt,this.hit(e.clientX,e.clientY));}if(!pointers.size){start=null;last=null;}else moved=true;});
    c.addEventListener('pointercancel',()=>{pointers.clear();start=null;last=null;moved=true;});c.addEventListener('pointerleave',()=>{this.cursor.visible=false;});
    c.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(e.deltaY*.001));},{passive:false});
  }
}
