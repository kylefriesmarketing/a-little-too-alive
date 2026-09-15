import {anatomy} from './anatomy.js';
import * as T from 'three';
import {seedRole} from './catalog.js';

// A continuous, colored surface for bodies, pods, shells and roofs.
export function sculpt(parent,points,radii,color,{flatten=1,pattern=0}={}){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),steps=28,sides=18,frames=curve.computeFrenetFrames(steps,false),positions=[],normals=[],colors=[],index=[],base=new T.Color(color),light=base.clone().lerp(new T.Color('#e4d4a7'),.4),dark=base.clone().multiplyScalar(.53);
  for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPointAt(t),k=t*(radii.length-1),a=Math.floor(k),r=T.MathUtils.lerp(radii[a],radii[Math.min(a+1,radii.length-1)],k-a);
    for(let j=0;j<=sides;j++){const u=j/sides*Math.PI*2,n=frames.normals[i].clone().multiplyScalar(Math.cos(u)).addScaledVector(frames.binormals[i],Math.sin(u)*flatten);positions.push(p.x+n.x*r,p.y+n.y*r,p.z+n.z*r);const pigment=Math.sin(t*85+Math.sin(u*5)*2)*Math.cos(u*7-t*20);const c=base.clone().lerp(light,Math.max(0,-n.y)*.65);if(pattern&&pigment>.43)c.lerp(dark,pattern);colors.push(c.r,c.g,c.b);if(i<steps&&j<sides){const q=i*(sides+1)+j;index.push(q,q+1,q+sides+1,q+1,q+sides+2,q+sides+1);}}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(index);geo.computeVertexNormals();const m=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.82}));m.userData.temporary=true;m.userData.ownMaterial=true;parent.add(m);return m;
}

export function seedModel(root,e,k){
  const role=seedRole(e);if(!role)return false;
  const {part,tube,bone,bake,eye,leg,leaf,tower}=k,b=root.userData.body;
  const colors={grass:'#8eb34c',flower:'#e998b0',fruit:'#729b4c',bark:'#527d5d',fungus:'#bca1ce',reed:'#64b3a0'};
  if(e.kind==='plant'){
    if(role==='grass'||role==='reed'){
      for(let i=0;i<(role==='grass'?26:14);i++){const a=i*2.4,r=.2+(i%4)*.13,x=Math.cos(a)*r,z=Math.sin(a)*r,h=(role==='reed'?1.8:.65)*(1+(i%5)*.15);tube(b,[[x,0,z],[x*.85,h*.55,z],[x+Math.cos(a)*.4,h,z+Math.sin(a)*.35]],role==='reed'?.022:.012,colors[role]);leaf(b,[x,h*.3,z],h*.65,role==='grass'?.045:.075,i%2?'#9cbd6c':colors[role],Math.sin(a)*.8);if(role==='reed')part(b,'sphere','#b49960',[x+Math.cos(a)*.4,h,z+Math.sin(a)*.35],[.065,.22,.065]);}root.userData.height=role==='reed'?3:1.2;
    }else if(role==='fungus'){
      for(let i=0;i<7;i++){const a=i*2.4,r=i===0?0:.35+(i%3)*.14,h=.3+(i%3)*.3,x=Math.cos(a)*r,z=Math.sin(a)*r;bone(b,[x,0,z],[x,h,z],.07,'#d6cba5');sculpt(b,[[x,h-.05,z],[x,h+.04,z],[x,h+.23,z]],[.32+(i%3)*.12,.26+(i%3)*.12,.01],i%2?'#bc8fab':'#779baa',{flatten:1,pattern:.4});for(let j=0;j<4;j++)part(b,'sphere','#e4dbc0',[x+Math.cos(j*1.57)*.19,h+.17,z+Math.sin(j*1.57)*.19],[.035,.025,.035]);}root.userData.height=1.3;
    }else if(role==='flower'){
      for(let i=0;i<5;i++){const a=i*2.4,x=Math.sin(a)*.5,z=Math.cos(a)*.5,h=1+(i%3)*.32;tube(b,[[x*.4,0,z*.4],[x,h*.65,z*.6],[x,h,z]],.023,'#608a53');for(let j=0;j<7;j++){const angle=j*Math.PI*2/7,p=part(b,'sphere',j%2?'#e99fad':'#d276a8',[x+Math.sin(angle)*.19,h+.05,z+Math.cos(angle)*.19],[.12,.055,.23]);p.rotation.y=angle;}part(b,'sphere','#f1cc65',[x,h+.11,z],[.115,.07,.115]);for(let j=0;j<3;j++)leaf(b,[x*.6,.2+j*.2,z*.6],.48,.095,'#719b61',(j-1)*.7);}root.userData.height=2;
    }else{
      const h=role==='bark'?4.8:3.1;sculpt(b,[[0,0,0],[-.12,h*.4,.02],[.12,h*.75,0],[0,h,0]],[.3,.18,.12,.01],'#796b49',{pattern:.3});
      for(let i=0;i<11;i++){const a=i*2.399,y=h*(.38+(i%5)*.1),r=role==='bark'?1.15:.9,x=Math.cos(a)*r,z=Math.sin(a)*r;tube(b,[[0,y-.3,0],[x*.65,y,z*.65],[x,y+.3,z]],.045,'#736b46');for(let j=0;j<9;j++){const ang=j*2.399;const l=part(b,'sphere',j%3?'#71994f':'#adc06b',[x+Math.sin(ang)*.32,y+.27+Math.cos(j)*.13,z+Math.cos(ang)*.32],[.31,.04,.115],[.2,ang,.25]);if(role==='fruit'&&j%3===0)part(b,'sphere','#d78a58',[l.position.x,l.position.y-.16,l.position.z],[.11,.13,.11]);}}
      for(let i=0;i<5;i++){const a=i*1.256;tube(b,[[0,.15,0],[Math.cos(a)*.4,.08,Math.sin(a)*.4],[Math.cos(a)*.7,0,Math.sin(a)*.7]],.08,'#746849');}root.userData.height=h+.4;
    }
    if(e.genes.mind>.7){eye(b,-.09,.4,.2,.07);eye(b,.09,.4,.2,.07);}bake(b);return true;
  }
  if(e.kind==='creature'){
    const flying=role==='wing',beetle=role==='shell',upright=role==='hand',predator=role==='claw',guardian=role==='horn',skin=beetle?'#467d75':predator?'#ad7756':upright?'#8395a6':guardian?'#a8a075':'#c4a271';
    const h=flying?.72:beetle?.48:upright?1.05:guardian?1.2:.9;
    if(flying){root.userData.wings=[];sculpt(b,[[0,.7,-.6],[0,.77,0],[0,.84,.45]],[.01,.13,.08],'#7a5b7c',{pattern:.5});for(const side of [-1,1]){const wing=new T.Group();wing.position.set(side*.06,.78,0);root.add(wing);root.userData.wings.push(wing);for(let i=0;i<2;i++){const p=part(wing,'sphere',i?'#9c89c5':'#c59ac9',[side*(.5+i*.12),0,.1-i*.45],[.65,.025,.38]);p.rotation.y=side*(.3+i*.45);part(wing,'sphere','#e8c983',[side*.85,.027,.13-i*.48],[.13,.018,.17]);tube(wing,[[0,0,0],[side*.5,.03,0],[side*1.02,0,.15-i*.5]],.012,'#6f557c');}bake(wing);}eye(b,-.085,.9,.4,.06);eye(b,.085,.9,.4,.06);root.userData.height=1.2;root.userData.fly=true;
    }else{
      sculpt(b,[[0,h,-.92],[0,h+.1,-.4],[0,h+.12,.28],[0,h+.12,.65]],[.02,beetle?.55:guardian?.58:.38,beetle?.48:.4,.18],skin,{flatten:beetle?.65:1,pattern:.6});
      if(beetle){for(const side of [-1,1])sculpt(b,[[side*.06,h+.25,.48],[side*.25,h+.31,0],[side*.13,h+.22,-.78]],[.04,.38,.025],side>0?'#4b8976':'#477e77',{flatten:.6,pattern:.7});for(let i=0;i<4;i++)tube(b,[[-.36,h+.34,-.5+i*.24],[0,h+.51,-.5+i*.24],[.36,h+.34,-.5+i*.24]],.015,'#9cbd8d');}
      const head=new T.Group(),hy=upright?1.9:beetle?.6:predator?1.04:h+.66;head.position.set(0,hy,.65);root.add(head);root.userData.head=head;
      if(!beetle)sculpt(b,[[0,h,.35],[0,h+.35,.5],[0,hy,.65]],[.27,.22,.14],skin,{pattern:.45});
      sculpt(head,[[0,0,-.16],[0,.04,.12],[0,-.04,predator?.75:.49]],[.09,.24,.07],skin,{pattern:.45});eye(head,-.18,.13,.2,.075);eye(head,.18,.13,.2,.075);
      for(const side of [-1,1]){if(!beetle){leaf(head,[side*.16,.18,-.02],.32,.07,predator?'#6d514d':'#cbbc91',-side*.9);if(guardian||role==='hoof'){sculpt(head,[[side*.16,.19,-.08],[side*.37,.58,-.15],[side*.36,guardian?1.04:.73,-.24]],[.095,.055,0],'#dbca98');if(guardian)sculpt(head,[[side*.3,.5,-.13],[side*.57,.68,-.1],[side*.63,.88,-.19]],[.04,.025,0],'#dbca98');}}if(predator)for(let j=0;j<3;j++)part(head,'cone','#efdbb0',[side*.1,-.08,.3+j*.1],[.026,.13,.026],[0,0,Math.PI]);if(beetle)tube(head,[[side*.13,.1,.18],[side*.3,.35,.37],[side*.39,.27,.6]],.016,'#b9ba7c');}
      const legs=upright?2:beetle?6:anatomy(e.genes).legs;for(let i=0;i<legs;i++){const side=i%2?1:-1,z=upright?0:beetle?(Math.floor(i/2)-1)*.48:Math.floor(i/2)?-.57:.39;root.userData.legs.push(leg(root,side*(beetle?.42:upright?.21:.31),z,h,skin,i,beetle?.055:guardian?.14:.09));}
      if(upright){for(const side of [-1,1])tube(b,[[side*.17,1.7,.58],[side*.43,1.25,.66],[side*.35,1.05,.91]],.075,skin);part(b,'sphere','#786147',[0,1.38,.16],[.28,.27,.13]);part(b,'torus','#d0b47e',[0,1.35,.12],[.29,.29,1],[Math.PI/2,0,0]);}
      if(!beetle&&!upright){const tail=new T.Group();tail.position.set(0,h,-.8);root.add(tail);root.userData.tail=tail;sculpt(tail,[[0,0,0],[.12,.1,-.5],[.3,.35,-1.35]],[.15,.07,0],skin,{pattern:.65});bake(tail);}
      if(e.carrying>.1){part(b,'sphere','#ae8354',[0,h+.35,-.25],[.24,.16,.25]);for(let i=0;i<3;i++)part(b,'sphere','#cfb368',[(i-1)*.1,h+.45,-.23],[.07,.09,.08]);}
      bake(head);root.userData.height=upright?2.4:guardian?2.9:beetle?1.1:2.1;
    }
    bake(b);return true;
  }
  if(e.kind==='home'&&(e.phase==='walking'||e.phase==='city'))return false;
  if(e.kind==='home'){
    const stone='#c6b68d',wood='#836e4d',roof='#668c86';root.userData.height=3.2;
    // Steps and a raised stone foundation give every building a readable footprint.
    part(b,'cylinder','#9c9979',[0,.09,0],[1.15,.18,1.15]);for(let i=0;i<3;i++)part(b,'box',stone,[0,.04+i*.06,1.1-i*.18],[.68,.12,.3]);
    const arch=(x,y,z,r)=>{const m=new T.Mesh(new T.TorusGeometry(r,.065,7,24,Math.PI),new T.MeshStandardMaterial({color:stone}));m.position.set(x,y+r,z);m.userData.temporary=true;m.userData.ownMaterial=true;b.add(m);bone(b,[x-r,y,z],[x-r,y+r,z],.065,stone);bone(b,[x+r,y,z],[x+r,y+r,z],.065,stone);};
    if(role==='well'){
      for(let i=0;i<14;i++){const a=i*Math.PI/7;const p=part(b,'box',i%2?stone:'#a4a78d',[Math.cos(a)*.58,.36,Math.sin(a)*.58],[.23,.49,.2]);p.rotation.y=-a;}part(b,'cylinder','#63bdc7',[0,.3,0],[.48,.025,.48]);for(const side of [-1,1]){bone(b,[side*.75,.15,0],[side*.65,1.65,0],.085,wood);arch(side*.65,1.1,0,.05);}bone(b,[-.8,1.65,0],[.8,1.65,0],.06,wood);tube(b,[[0,1.65,0],[0,1.1,0],[.03,.66,0]],.014,'#d5bc81');sculpt(b,[[0,1.63,0],[0,1.9,0],[0,2.1,0]],[.95,.67,.01],roof,{flatten:1});root.userData.height=2.3;
    }else if(role==='spire'){
      tower(b,0,.12,0,2.8,.44,'#75839b');for(const side of [-1,1]){bone(b,[side*.8,.1,0],[side*.34,2,0],.08,stone);arch(side*.57,.14,.15,.2);}for(let i=0;i<3;i++)part(b,'torus','#cabc8c',[0,3.25,0],[.53,.53,.53],[i*.9,i*.75,0]);part(b,'sphere','#8bc2d0',[0,3.25,0],[.18,.18,.18]);root.userData.height=4;
    }else if(role==='nursery'){
      for(let i=0;i<8;i++){const a=i*Math.PI/4;bone(b,[Math.sin(a)*.9,.1,Math.cos(a)*.9],[Math.sin(a)*.62,1.35,Math.cos(a)*.62],.07,wood);}sculpt(b,[[0,1.05,0],[0,1.35,0],[0,1.8,0]],[1.03,.8,.02],'#baa0a6');for(let i=0;i<4;i++){const a=i*1.57;part(b,'sphere','#a7b776',[Math.cos(a)*.65,.2,Math.sin(a)*.65],[.3,.13,.3]);}arch(0,.1,.92,.3);root.userData.height=2;
    }else if(role==='workshop'){
      part(b,'box',stone,[0,.65,0],[1.6,1.1,1.15]);part(b,'box',wood,[0,1.25,0],[1.8,.12,1.4]);for(let i=0;i<9;i++)part(b,'box',i%2?'#729087':roof,[(i-4)*.2,1.35+Math.sin(i/8*Math.PI)*.4,0],[.21,.09,1.6]);tower(b,.58,.8,-.3,1.3,.17,'#9c8c79');arch(0,.14,.6,.35);part(b,'box','#3b5553',[0,.62,.585],[.58,.86,.04]);for(let i=0;i<3;i++)bone(b,[-.75,.2,.9+i*.13],[.4,.2,.9+i*.13],.09,wood);root.userData.height=2.5;
    }else{
      const tall=role==='granary';tower(b,0,.12,0,tall?2:1.65,tall?.67:.72,tall?'#b1a46c':roof);arch(0,.13,.72,.29);part(b,'sphere','#344e4b',[0,.55,.725],[.24,.4,.035]);if(tall)for(let i=0;i<7;i++)part(b,'torus','#a48751',[0,.5+i*.2,0],[.7,.7,1],[Math.PI/2,0,0]);else{tower(b,.65,.12,-.2,1,.3,roof);for(let i=0;i<6;i++)leaf(b,[Math.sin(i)*.9,.15,Math.cos(i)*.9],.5,.14,'#91aa67',i*.2);}
    }
    bake(b);return true;
  }
  return false;
}
