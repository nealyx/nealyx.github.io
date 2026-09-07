import test from 'node:test';
import assert from 'node:assert/strict';
import { layouts, edges, positions } from '../assets/morph-graph.js';
test('morph layouts retain six vertices, all fifteen edges, and finite in-frame positions', () => {
  assert.equal(edges.length, 15);
  assert.equal(new Set(edges.map(e=>e.join('-'))).size,15);
  for(let i=0;i<layouts.length;i++) {
    assert.equal(layouts[i].length,6);
    for(let step=0;step<=100;step++) {
      const points=positions(layouts[i],layouts[(i+1)%layouts.length],step/100);
      assert.ok(points.flat().every(n=>Number.isFinite(n)&&n>=0&&n<=200));
    }
    assert.deepEqual(positions(layouts[i],layouts[(i+1)%layouts.length],0),layouts[i]);
    assert.deepEqual(positions(layouts[i],layouts[(i+1)%layouts.length],1),layouts[(i+1)%layouts.length]);
  }
});
