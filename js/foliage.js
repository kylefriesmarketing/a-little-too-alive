import * as T from 'three';
export function foliageGeometry(){const geo=new T.IcosahedronGeometry(1,2),p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=.84+Math.sin(x*15+z*8)*Math.cos(y*13-z*11)*.09+Math.sin(z*21+y*7)*.07;p.setXYZ(i,x*r,y*r,z*r);}geo.computeVertexNormals();return geo;}
