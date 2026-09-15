import {seedModel,sculpt} from './seed-models.js';
import * as T from 'three';
import {anatomy} from './anatomy.js';
const G={sphere:new T.SphereGeometry(1,18,12),cone:new T.ConeGeometry(1,1,10),box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,14),torus:new T.TorusGeometry(1,.065,6,32)};
const palette=new Map();
const bakedMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:.01,side:T.DoubleSide});
function material(color){if(!palette.has(color))palette.set(color,new T.MeshStandardMaterial({color,roughness:.78}));return palette.get(color);}
function part(parent,shape,color,p,s,rotation){const m=new T.Mesh(G[shape],material(color));m.position.set(...p);m.scale.set(...s);if(rotation)m.rotation.set(...rotation);parent.add(m);return m;}
function tube(parent,points,r,color){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,12,r,7,false),material(color));m.userData.temporary=true;parent.add(m);return m;}
function bone(parent,a,b,r,color){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const geo=new T.LatheGeometry([new T.Vector2(0,-.5),new T.Vector2(.72,-.46),new T.Vector2(1,-.25),new T.Vector2(.86,.24),new T.Vector2(.6,.46),new T.Vector2(0,.5)],10),m=new T.Mesh(geo,material(color));m.userData.temporary=true;m.position.copy(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5));m.scale.set(r,v.length(),r);parent.add(m);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
function bake(group){const positions=[],normals=[],colors=[];for(const m of [...group.children]){if(!m.isMesh)continue;m.updateMatrix();const geom=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geom.applyMatrix4(m.matrix);const p=geom.attributes.position,n=geom.attributes.normal,c=m.material.color;for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));const tint=geom.attributes.color;colors.push(tint?tint.getX(i)*c.r:c.r,tint?tint.getY(i)*c.g:c.g,tint?tint.getZ(i)*c.b:c.b);}geom.dispose();if(m.userData.temporary)m.geometry.dispose();if(m.userData.ownMaterial)m.material.dispose();group.remove(m);}if(!positions.length)return;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();const mesh=new T.Mesh(geo,bakedMaterial);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
function eye(g,x,y,z,size){part(g,'sphere','#dac891',[x,y,z],[size,size*.85,size*.65]);part(g,'sphere','#ce921e',[x,y,z+size*.48],[size*.67,size*.7,size*.3]);part(g,'sphere','#101d20',[x,y,z+size*.72],[size*.18,size*.53,size*.17]);part(g,'sphere','#fff8d9',[x-size*.19,y+size*.26,z+size*.8],[size*.15,size*.15,size*.1]);}
function leaf(g,origin,length,width,color,angle=0){const pos=[],idx=[];for(let i=0;i<=8;i++){const t=i/8,w=Math.sin(Math.PI*t)*width;pos.push(-w,t*length,Math.sin(t*Math.PI)*.05,0,t*length,.065*Math.sin(t*Math.PI),w,t*length,Math.sin(t*Math.PI)*.05);if(i<8){const j=i*3;idx.push(j,j+3,j+1,j+1,j+3,j+4,j+1,j+4,j+2,j+2,j+4,j+5);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const m=new T.Mesh(geo,material(color));m.position.set(...origin);m.rotation.z=angle;m.userData.temporary=true;g.add(m);}
function leg(parent,x,z,length,skin,index,thick=.12){const group=new T.Group();group.position.set(x,length,z);parent.add(group);part(group,'sphere',skin,[0,-.1,0],[thick*1.5,.24,thick*1.4]);bone(group,[0,-.1,0],[x*.14,-length*.57,-.12],thick,skin);part(group,'sphere',skin,[x*.14,-length*.57,-.12],[thick*1.15,thick*1.15,thick*1.15]);bone(group,[x*.14,-length*.57,-.12],[x*.08,-length+.1,.1],thick*.62,skin);part(group,'sphere',skin,[x*.08,-length+.08,.2],[thick*1.2,.085,thick*2.2]);for(let j=-1;j<=1;j++)part(group,'cone','#d9c5a1',[x*.08+j*thick*.58,-length+.06,.37],[thick*.23,.17,thick*.23],[Math.PI/2,0,0]);bake(group);group.userData.index=index;return group;}
function plant(root,e){const g=e.genes,stem=g.heat>.4?'#68414a':'#525e32',color=g.water>.4?'#5db4a2':g.heat>.4?'#b55151':'#759e42';const body=root.userData.body;const height=1.5+g.mind*.7+g.song*.8;
  tube(body,[[0,0,0],[-.12,height*.4,0],[.12,height*.8,0],[0,height,0]],.095,stem);
  for(let i=0;i<9;i++){const a=i*2.399,y=.25+i*.12,x=Math.sin(a)*.16,z=Math.cos(a)*.16;const stemtip=[Math.sin(a)*.65,y+.22,Math.cos(a)*.65];bone(body,[x,y,z],stemtip,.03,stem);const blade=part(body,'sphere',i%2?color:'#a5bb63',stemtip,[.42,.035,.15],[0,-a,.2]);blade.rotation.z=Math.sin(a)*.5;}
  if(g.mind>.3){part(body,'sphere',color,[0,height,0],[.3,.32,.28]);eye(body,-.12,height+.04,.25,.105);eye(body,.12,height+.04,.25,.105);}
  for(let i=0;i<6;i++){const a=i*Math.PI/3;leaf(body,[Math.cos(a)*.1,height-.1,Math.sin(a)*.1],.6,.19,g.love>.3?'#d796a7':g.song>.4?'#a688cd':'#c7bf6b',Math.cos(a)*1.2);}
  if(g.fang>.4){part(body,'sphere','#4c2332',[0,height-.15,.24],[.24,.13,.1]);for(let i=-2;i<=2;i++)part(body,'cone','#eae2b4',[i*.075,height-.1,.32],[.025,.14,.025],[0,0,Math.PI]);}
  bake(body);
}
function creature(root,e){const g=e.genes,a=anatomy(g),body=root.userData.body;const base=new T.Color('#aa9756');base.lerp(new T.Color('#338684'),g.water*.8).lerp(new T.Color('#bc6650'),g.heat*.65).lerp(new T.Color('#71957d'),g.flora*.45).lerp(new T.Color('#84618e'),g.song*.28);const skin='#'+base.getHexString(),dark='#'+base.clone().multiplyScalar(.57).getHexString(),belly='#dcc998',crest=g.heat>.4?'#c17640':g.song>.4?'#956ab2':'#cc8e58';
  const h=a.legLength+.18;root.userData.height=h+1+a.neck;
  sculpt(body,[[0,h,-1],[0,h+.05,-.4],[0,h+.08,.4],[0,h+.17,.78]],[.04,a.bulk*.62,.44,.12],skin,{pattern:.6});
  for(let i=0;i<14;i++){const side=i%2?1:-1,z=-.74+Math.floor(i/2)*.24;part(body,'sphere',dark,[side*a.bulk*.55,h+.18+Math.sin(i*3)*.12,z],[.023,.08,.12]);}
  for(let i=0;i<6;i++)part(body,'cone',crest,[0,h+.46,-.7+i*.25],[.08,.22+g.fang*.2,.15],[.25,0,0]);
  if(e.carrying>.1){part(body,'sphere','#84683e',[0,h+.48,-.25],[.25,.18,.32]);for(let i=0;i<3;i++)part(body,'sphere',i%2?'#aaa15e':'#819552',[(i-1)*.12,h+.6,-.25],[.11,.1,.16]);}
  const neckEnd=h+.45+a.neck;
  tube(body,[[0,h+.06,.55],[0,h+.42,.73],[0,neckEnd,.91]],.24,skin);
  const head=new T.Group();head.position.set(0,neckEnd,.9);root.add(head);root.userData.head=head;
  part(head,'sphere',skin,[0,.08,.11],[.3,.25,.46]);part(head,'sphere',belly,[0,-.07,.39],[.26,.13,.39]);part(head,'sphere',skin,[0,.01,.43],[.3,.14,.41]);
  for(const side of [-1,1]){eye(head,side*.24,.17,.37,.085);part(head,'sphere',dark,[side*.14,.075,.79],[.04,.025,.026]);tube(head,[[side*.25,.3,0],[side*.37,.55,-.08],[side*.43,.68+g.mind*.24,-.24]],.045,crest);if(g.fang>.35)for(let i=0;i<3;i++)part(head,'cone','#eee0bc',[side*.25,-.13,.27+i*.13],[.027,.09+g.fang*.13,.034],[0,0,Math.PI]);leaf(head,[side*.28,.17,-.12],.25+a.crest*.35,.09+a.crest*.08,crest,-side*.9);}
  for(let i=0;i<4;i++)leaf(head,[0,.28,-.08-i*.1],.2+a.crest*.35,.055,crest,(i-1)*.12);
  const tail=new T.Group();tail.position.set(0,h,-.85);root.add(tail);root.userData.tail=tail;tube(tail,[[0,0,0],[0,.08,-a.tail*.4],[.12,.38,-a.tail]],.09,skin);for(let i=0;i<3;i++)leaf(tail,[.08,.24,-a.tail*.75],.35+a.crest*.25,.16,crest,(i-1)*.8);
  for(let i=0;i<a.legs;i++){const side=i%2?1:-1,z=a.legs===6?(Math.floor(i/2)-1)*.61:Math.floor(i/2)?-.63:.58;root.userData.legs.push(leg(root,side*a.bulk*.51,z,a.legLength,skin,i));}
  bake(body);bake(head);bake(tail);
}
function tower(g,x,y,z,h,r,roof='#86916e'){
  part(g,'cylinder','#bca87d',[x,y+h*.46,z],[r,h*.92,r]);part(g,'torus','#aa9878',[x,y+h*.77,z],[r*1.04,r*1.04,1],[Math.PI/2,0,0]);
  part(g,'cone',roof,[x,y+h+.12,z],[r*1.45,.5+r*.5,r*1.45]);for(let j=0;j<6;j++){const a=j*Math.PI/3;bone(g,[x+Math.sin(a)*r,y,z+Math.cos(a)*r],[x+Math.sin(a)*r*.95,y+h*.86,z+Math.cos(a)*r*.95],r*.07,'#8b805d');}for(let j=0;j<3;j++)part(g,'torus','#af9b6f',[x,y+h*(.22+j*.22),z],[r*1.04,r*1.04,1],[Math.PI/2,0,0]);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;part(g,'sphere','#476b68',[x+Math.sin(a)*r,y+h*.6,z+Math.cos(a)*r],[.09,.19,.09]);}
  part(g,'cone','#e6d4a7',[x,y+h+.48,z],[.035,.43,.035]);
}
function home(root,e){const b=root.userData.body,city=e.phase==='city',walking=city||e.phase==='walking',g=e.genes,skin='#8e9b7b',top=city?2.6:walking?1.25:.12;root.userData.height=city?6:3;
  if(walking){part(b,'sphere',skin,[0,top-.15,0],city?[2.45,1,3.3]:[1.15,.65,1.4]);part(b,'sphere','#b9ba95',[0,top-.55,.2],city?[2.1,.5,2.8]:[1,.35,1.2]);const head=new T.Group();head.position.set(0,top-.15,city?3:1.35);root.add(head);root.userData.head=head;part(head,'sphere',skin,[0,0,0],city?[.84,.84,1]:[.48,.43,.57]);for(const s of [-1,1]){eye(head,s*(city?.49:.27),.2,city?.75:.45,city?.21:.12);tube(head,[[s*.37,-.1,.5],[s*.45,-.35,.7],[s*.54,-.1,.89]],city?.08:.04,'#dfd2b1');}bake(head);for(let i=0;i<(city?8:4);i++){const x=(i%2?1:-1)*(city?2:1),z=city?(Math.floor(i/2)-1.5)*1.4:(Math.floor(i/2)?-.8:.8);root.userData.legs.push(leg(root,x,z,top,skin,i,city?.29:.18));}}
  part(b,'sphere','#929f68',[0,top,0],city?[2.8,.5,3.25]:[1.4,.22,1.45]);
  if(city){for(let i=0;i<9;i++){const a=i*2.399,r=i===0?0:1.25+Math.sin(i)*.45,x=Math.sin(a)*r,z=Math.cos(a)*r;tower(b,x,top+.25,z,1.8+(i%3)*.65,.27+(i%2)*.16,i%2?'#a99c71':'#697d70');}for(const s of [-1,1]){part(b,'box','#b5a37d',[s*1.3,top+1.1,.2],[.15,.12,3.6]);for(let j=-2;j<=2;j++)bone(b,[s*1.3,top+.25,j*.7],[s*1.3,top+1.1,j*.7],.035,'#d8c7a1');}}
  else{tower(b,0,top,0,1.65,.61,g.love>.3?'#b68670':'#7e9977');tower(b,.66,top,-.15,.9,.3);part(b,'sphere','#304b46',[0,top+.42,.59],[.22,.42,.05]);for(let i=0;i<3;i++)part(b,'box','#cbbb97',[0,top+.03-i*.035,.83+i*.15],[.65,.08,.28]);}
  for(let i=0;i<(city?18:6);i++){const a=i*2.399,r=city?2.5:1.05;part(b,'sphere',i%2?'#769753':'#a6b06d',[Math.sin(a)*r,top+.24,Math.cos(a)*r],[.32,.2,.32]);}
  // Residents are rendered from the actual resident count and carry visible bundles.
  const residents=new T.Group();root.add(residents);root.userData.residents=residents;
  for(let i=0;i<Math.min(city?12:4,e.residents||0);i++){const p=new T.Group(),a=i*2.399,r=city?2.25:1;p.position.set(Math.cos(a)*r,top+.23,Math.sin(a)*r);p.userData.angle=a;p.userData.radius=r;part(p,'sphere','#c5b993',[0,.24,0],[.075,.13,.07]);part(p,'sphere','#d8cfb0',[0,.4,0],[.08,.09,.075]);part(p,'box','#987f55',[0,.25,-.085],[.14,.17,.1]);bone(p,[-.04,.17,0],[-.05,.02,.03],.022,'#455858');bone(p,[.04,.17,0],[.05,.02,-.03],.022,'#455858');bake(p);residents.add(p);}
  bake(b);
}
export function organism(e){const root=new T.Group();root.userData.entityId=e.id;root.userData.body=new T.Group();root.userData.legs=[];root.userData.height=2.5;root.add(root.userData.body);if(seedModel(root,e,{part,tube,bone,bake,eye,leg,leaf,tower}))return root;if(e.kind==='plant')plant(root,e);else if(e.kind==='home')home(root,e);else creature(root,e);return root;}
export function disposeOrganism(root){root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}
export function signature(e){return (e.carrying>.1?'loaded':'empty')+'|'+e.seeds.join('+')+'|'+e.kind+'|'+(['walking','city'].includes(e.phase)?e.phase:'normal')+'|'+(e.kind==='home'?Math.min(e.residents,12):0)+'|'+Object.values(e.genes).map(n=>n.toFixed(2)).join(',');}
