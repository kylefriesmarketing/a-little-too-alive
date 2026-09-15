import * as T from 'three';
export function foliageCards(){
 const positions=[],normals=[],uv=[];for(let i=0;i<3;i++){const geo=new T.PlaneGeometry(2,1.65).toNonIndexed();geo.rotateY(i*Math.PI/3);for(let j=0;j<geo.attributes.position.count;j++){positions.push(geo.attributes.position.getX(j),geo.attributes.position.getY(j),geo.attributes.position.getZ(j));normals.push(geo.attributes.normal.getX(j),geo.attributes.normal.getY(j),geo.attributes.normal.getZ(j));uv.push(geo.attributes.uv.getX(j),geo.attributes.uv.getY(j));}geo.dispose();}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return geo;
}
export function foliageMaterial(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');let seed=91823;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<420;i++){const angle=random()*Math.PI*2,r=Math.sqrt(random()),x=128+Math.cos(angle)*r*104,y=128+Math.sin(angle)*r*94;c.save();c.translate(x,y);c.rotate(angle+random());const hue=80+random()*27,light=26+random()*33;c.fillStyle=`hsl(${hue},35%,${light}%)`;c.beginPath();c.ellipse(0,0,6+random()*6,2+random()*3,0,0,Math.PI*2);c.fill();c.strokeStyle='rgba(204,215,124,.28)';c.lineWidth=.6;c.beginPath();c.moveTo(-6,0);c.lineTo(6,0);c.stroke();c.restore();}
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map,alphaTest:.38,roughness:1,side:T.DoubleSide,color:'#ffffff'});
}
export function makeSky(scene){
 const uniforms={up:{value:new T.Vector3(0,1,0)},space:{value:0}};
 const mesh=new T.Mesh(new T.SphereGeometry(6500,24,12),new T.ShaderMaterial({uniforms,side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 direction;uniform vec3 up;uniform float space;void main(){float altitude=dot(normalize(direction),up);vec3 horizon=vec3(.81,.87,.82),zenith=vec3(.22,.49,.64);vec3 sky=mix(horizon,zenith,smoothstep(-.06,.75,altitude));sky=mix(sky,vec3(.022,.055,.083),space);gl_FragColor=vec4(sky,1.);}',fog:false}));mesh.renderOrder=-100;mesh.frustumCulled=false;scene.add(mesh);return {mesh,uniforms};
}
