import test from 'node:test';
import assert from 'node:assert/strict';
import { createStars, project, stages } from '../assets/hero-field.js';

test('star geometry and colors remain stable on resize', () => {
  assert.deepEqual(createStars(1150), createStars(2200).slice(0, 1150));
});
test('scroll stages stay continuous, bounded, and preserve total particle weight', () => {
  for (const max of [0, 600, 5000, 14000]) {
    let previous = stages(0, 700, max);
    for (let scroll = 0; scroll <= max; scroll++) {
      const weights = stages(scroll, 700, max);
      assert.ok(weights.every(w => w >= 0 && w <= 1));
      assert.ok(Math.abs(weights.reduce((a,b) => a+b) - 1) < 1e-12);
      assert.ok(weights.every((w,i) => Math.abs(w - previous[i]) < .02));
      previous = weights;
    }
  }
});
test('projection rejects the camera plane and invalid positions', () => {
  for (const z of [-100, -5, -4.5, NaN, Infinity]) assert.equal(project(1, 1, z, 200, 600, 400), null);
  for (const star of createStars(2200)) {
    for (const position of [star.graph, star.space, star.galaxy]) {
      const p = project(...position, 200, 600, 400);
      assert.ok(p && Number.isFinite(p.x + p.y + p.depth));
    }
  }
});
