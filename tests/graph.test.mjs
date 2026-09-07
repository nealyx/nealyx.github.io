import test from 'node:test';
import assert from 'node:assert/strict';
import {edges, initialColors, findTriangles} from '../src/assets/graph.js';
test('every one of the 32,768 two-colorings of K6 has a correctly identified triangle',()=>{
 for(let mask=0;mask<2**15;mask++){
  const colors=edges.map((_,i)=>(mask>>i)&1);
  const triangles=findTriangles(colors);
  assert.ok(triangles.length>0,`No triangle in coloring ${mask}`);
  for(const triangle of triangles){
   const vertices=new Set(triangle.edges.flatMap(i=>edges[i]));
   assert.equal(vertices.size,3);
   assert.deepEqual([...vertices].sort(),triangle.vertices);
   assert.ok(triangle.edges.every(i=>colors[i]===triangle.color));
  }
 }
});
test('the starting five-cycle avoids triangles on its first five vertices',()=>{
 assert.equal(findTriangles(initialColors).filter(t=>!t.vertices.includes(5)).length,0);
});
