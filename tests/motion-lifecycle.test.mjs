import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as geometry from '../assets/hero-field.js';

// Exercise the actual renderer with both OS preferences and a controlled frame clock.
function renderer(reducedMotion) {
  const frames = new Map(), events = new Map(), nodes = [];
  let id = 0, now = 0, lastPoint;
  const context = new Proxy({
    createRadialGradient: () => ({ addColorStop() {} }),
    arc(x, y) { lastPoint = [x, y]; }
  }, { get: (target, key) => key in target ? target[key] : () => {} });
  const element = () => ({
    listeners: {}, attributes: {}, firstElementChild: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    addEventListener(k, fn) { this.listeners[k] = fn; },
    getContext: () => context
  });
  const hero = { offsetHeight: 700, offsetTop: 0, prepend() {} };
  const document = {
    hidden: false,
    documentElement: { dataset: {}, scrollHeight: 4000 },
    body: { prepend(n) { nodes.push(n); }, append(n) { nodes.push(n); } },
    querySelector: () => hero,
    createElement: element,
    addEventListener(k, fn) { events.set(k, [...(events.get(k) || []), fn]); },
    dispatchEvent(e) { for (const fn of events.get(e.type) || []) fn(e); }
  };
  const preferenceListeners = [];
  const media = { matches: reducedMotion, addEventListener(_, fn) { preferenceListeners.push(fn); } };
  runInNewContext(readFileSync(new URL('../assets/hero-canvas.js', import.meta.url), 'utf8').replace(/^import .*;\n/, ''), {
    ...geometry, document, innerWidth: 1280, innerHeight: 700, devicePixelRatio: 1,
    window: { scrollY: 0 }, matchMedia: () => media, addEventListener() {},
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(key) { frames.delete(key); },
    ResizeObserver: class { observe() {} },
    CustomEvent: class { constructor(type, data) { this.type = type; Object.assign(this, data); } }
  });
  return {
    document, button: nodes.find(n => n.className === 'motion-toggle'), frames,
    step() { const callbacks = [...frames.values()]; frames.clear(); now += 16; callbacks.forEach(fn => fn(now)); return lastPoint; },
    setPreference(value) { media.matches = value; preferenceListeners.forEach(fn => fn({ matches: value })); }
  };
}
for (const reduced of [false, true]) {
  test(`ambient motion starts and remains controllable with reduced motion ${reduced}`, () => {
    const r = renderer(reduced);
    assert.equal(r.document.documentElement.dataset.motionPaused, 'false');
    assert.equal(r.button.attributes['aria-label'], 'Pause animations');
    const first = r.step();
    assert.notDeepEqual(r.step(), first, 'particle positions advance without interaction');
    assert.equal(r.frames.size, 1);
    r.button.listeners.click(); r.step();
    assert.equal(r.frames.size, 0, 'explicit pause stops the loop');
    assert.equal(r.button.attributes['aria-label'], 'Resume animations');
    r.setPreference(!reduced);
    assert.equal(r.document.documentElement.dataset.motionPaused, 'true', 'OS changes do not undo manual pause');
    r.button.listeners.click(); r.step();
    assert.equal(r.frames.size, 1, 'resume restarts the loop');
    r.document.hidden = true;
    r.document.dispatchEvent({ type: 'visibilitychange' });
    assert.equal(r.frames.size, 0, 'hidden tabs release their frame');
    r.document.hidden = false;
    r.document.dispatchEvent({ type: 'visibilitychange' });
    assert.equal(r.frames.size, 1, 'returning to the tab resumes motion');
  });
}
