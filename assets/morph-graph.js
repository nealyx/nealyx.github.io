// All layouts retain the same K6 edges and highlighted triangle.
export const layouts = [
  [[100,18],[170,58],[170,138],[100,178],[30,138],[30,58]],
  [[100,24],[176,154],[141,100],[100,143],[59,100],[24,154]],
  [[52,45],[148,45],[170,100],[148,155],[52,155],[30,100]],
  [[70,22],[160,48],[182,132],[130,176],[40,152],[18,68]]
];
export const edges = layouts[0].flatMap((_, a) => layouts[0].slice(a + 1).map((_, i) => [a, a + i + 1]));
export function positions(from, to, progress) {
  const t = Math.max(0, Math.min(1, progress));
  const ease = t * t * (3 - 2 * t);
  return from.map((p, i) => p.map((v, j) => v + (to[i][j] - v) * ease));
}
if (typeof document !== 'undefined') {
  const figure = document.querySelector('.problem-figure');
  if (figure) animate(figure);
}
function animate(figure) {
  const svg = figure.querySelector('svg');
  const paths = [...svg.querySelectorAll('path')];
  const circles = [...svg.querySelectorAll('circle')];
  if (paths.length !== 15 || circles.length !== 6) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'change-shape';
  button.textContent = 'Change shape ↗'; figure.append(button);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches || document.documentElement.dataset.motionPaused === 'true';
  let visible = false, frame = 0, last = 0, elapsed = 0, next = 1;
  let from = layouts[0], to = layouts[1], current = layouts[0];
  function render(points) {
    paths.forEach((p, i) => { const [a,b] = edges[i]; p.setAttribute('d', `M${points[a]}L${points[b]}`); });
    circles.forEach((c, i) => { c.setAttribute('cx', points[i][0]); c.setAttribute('cy', points[i][1]); });
  }
  function wake() { if (!frame && visible && !paused && !document.hidden) frame = requestAnimationFrame(tick); }
  function tick(now) {
    frame = 0;
    if (paused || !visible || document.hidden) { last = 0; return; }
    elapsed += last ? Math.min(now - last, 50) : 0; last = now;
    // Hold each arrangement briefly, then smoothly interpolate the vertices.
    current = positions(from, to, (elapsed - 1600) / 3400); render(current);
    if (elapsed >= 5000) { from = to; next = (next + 1) % layouts.length; to = layouts[next]; elapsed = 0; }
    wake();
  }
  button.addEventListener('click', () => {
    from = current; next = (next + 1) % layouts.length; to = layouts[next]; elapsed = 1600; last = 0;
    if (paused || reduced.matches) { current = to; from = to; render(current); }
    else wake();
  });
  document.addEventListener('site-motion-change', e => { paused = e.detail.paused; last = 0; wake(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; last = 0; wake(); });
  document.addEventListener('visibilitychange', () => { last = 0; wake(); });
  new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting); last = 0;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; } else wake();
  }, { threshold: .1 }).observe(figure);
}
