export const points = [[245,48],[425,139],[413,352],[241,431],[63,324],[75,125]];
export const edges = points.flatMap((p,a)=>points.slice(a+1).map((q,j)=>[a,a+j+1]));
export const initialColors = edges.map(([a,b]) => ((b-a===1 || b-a===4) && b<5) ? 0 : 1);
/** Return every monochromatic triangle; no randomness or DOM dependency. */
export function findTriangles(colors) {
  const index = (a,b) => edges.findIndex(([x,y])=>x===a && y===b);
  const found=[];
  for(let a=0;a<4;a++)for(let b=a+1;b<5;b++)for(let c=b+1;c<6;c++){
    const ids=[index(a,b),index(a,c),index(b,c)];
    if(ids.every(i=>colors[i]===colors[ids[0]]))found.push({vertices:[a,b,c],edges:ids,color:colors[ids[0]]});
  }
  return found;
}
