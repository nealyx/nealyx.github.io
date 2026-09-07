// Seeded geometry keeps stars and their colors stable across frames and resizes.
export const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
export const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
export const vertices = [[0, 1, 0], [.9428, -.3333, 0], [-.4714, -.3333, .8165], [-.4714, -.3333, -.8165]];
export const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
export function createStars(count, seed = 47) {
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const noise = () => random() + random() + random() - 1.5;
  return Array.from({ length: count }, (_, i) => {
    const dust = i % 5 === 0, edge = i % 6;
    const [a, b] = edges[edge].map(n => vertices[n]);
    const t = random(), spread = random() < .12 ? .12 : .028;
    const graph = dust ? [noise() * 4, noise() * 3, noise() * 2] : a.map((v, k) => mix(v, b[k], t) + noise() * spread);
    const radius = Math.pow(random(), .65) * 2.5;
    const angle = (i % 3) * Math.PI * 2 / 3 + radius * 2.2 + noise() * .3;
    const galaxy = [Math.cos(angle) * radius, noise() * (.03 + radius * .09), Math.sin(angle) * radius];
    const side = random() < .5 ? -1 : 1;
    const space = [side * (.8 + random() * 2.1), (random() - .5) * 4, (random() - .5) * 2];
    const bright = random();
    return { graph, galaxy, space, dust,
      color: !dust && edge === 0 ? 2 : random() < .16 ? 1 : 0,
      size: bright > .98 ? 1.7 : bright > .86 ? .95 : .3 + random() * .45,
      alpha: .35 + random() * .65, phase: random() * Math.PI * 2,
      offsetX: 0, offsetY: 0, velocityX: 0, velocityY: 0 };
  });
}
// First transition follows the hero, independent of the number of sections below it.
export function stages(scroll, heroHeight, maxScroll) {
  const space = smooth(scroll / Math.max(1, heroHeight * 1.15));
  const galaxy = smooth((scroll / Math.max(1, maxScroll) - .72) / .26);
  return [1 - space, space * (1 - galaxy), space * galaxy];
}
export function project(x, y, z, scale, cx, cy) {
  if (!Number.isFinite(x + y + z) || z <= -4.5) return null;
  const depth = 5 / (5 + z);
  return { x: cx + x * scale * depth, y: cy - y * scale * depth, depth };
}
