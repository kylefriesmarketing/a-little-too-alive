// Shared geography: the renderer and simulation sample the same continuous globe.
export const PLANET_RADIUS=400;
export const LONGITUDE_LIMIT=Math.PI*PLANET_RADIUS;
export const LATITUDE_LIMIT=Math.PI*PLANET_RADIUS/2-1;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
function hash(x,y,z){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
export function noise(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),a=smooth(x-ix),b=smooth(y-iy),c=smooth(z-iz);return lerp(lerp(lerp(hash(ix,iy,iz),hash(ix+1,iy,iz),a),lerp(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),a),b),lerp(lerp(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),a),lerp(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),a),b),c);}
export function normalAt(x,z){const a=x/PLANET_RADIUS,b=z/PLANET_RADIUS,c=Math.cos(b);return [Math.sin(a)*c,Math.sin(b),Math.cos(a)*c];}
export function coordsOf(v){const r=Math.hypot(v.x,v.y,v.z);return {x:Math.atan2(v.x,v.z)*PLANET_RADIUS,z:Math.asin(Math.max(-1,Math.min(1,v.y/r)))*PLANET_RADIUS};}
export function elevationNormal(nx,ny,nz){
  const a=noise(nx*2.6+12,ny*2.6+5,nz*2.6+8),b=noise(nx*6+4,ny*6+17,nz*6+9),c=noise(nx*16+3,ny*16+4,nz*16+12);
  const continent=(a-.49)*50+(b-.5)*10;
  const d=Math.acos(Math.max(-1,Math.min(1,nz)))*PLANET_RADIUS;
  const homeland=4.3-Math.pow(d/65,4)*8;
  const base=Math.max(continent,homeland);
  const ridge=Math.pow(1-Math.abs(c*2-1),3)*Math.max(0,base-6)*.38*Math.min(1,d/90);
  const fine=(noise(nx*95+8,ny*95+2,nz*95+8)-.5)*.15;
  return base+ridge+fine;
}
export function groundAt(x,z){return elevationNormal(...normalAt(x,z));}
export function surfaceAt(x,z,lift=0){const n=normalAt(x,z),r=PLANET_RADIUS+groundAt(x,z)+lift;return n.map(v=>v*r);}
export function validPosition(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<=LONGITUDE_LIMIT&&Math.abs(z)<=LATITUDE_LIMIT;}
export function landAt(x,z){return validPosition(x,z)&&groundAt(x,z)>.3;}
export function distance(a,b){const dx=Math.min(Math.abs(a.x-b.x),2*LONGITUDE_LIMIT-Math.abs(a.x-b.x))*Math.cos((a.z+b.z)/2/PLANET_RADIUS);return Math.hypot(dx,a.z-b.z);}
export function wrapped(x){return ((x+LONGITUDE_LIMIT)%(2*LONGITUDE_LIMIT)+2*LONGITUDE_LIMIT)%(2*LONGITUDE_LIMIT)-LONGITUDE_LIMIT;}
