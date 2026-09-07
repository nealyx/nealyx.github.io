import { clamp, smooth, mix, createStars, stages, project } from './hero-field.js';

const hero = document.querySelector('.dark-space-theme .hero');
if (hero) init(hero);

function init(hero) {
  const canvas = document.createElement('canvas');
  canvas.id = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  document.body.prepend(canvas);
  const surface = document.createElement('button');
  surface.type = 'button'; surface.className = 'hero-interaction';
  surface.setAttribute('aria-label', 'Rotate the K4 star field. Drag or use arrow keys; Home resets the view.');
  hero.prepend(surface);
  const pause = document.createElement('button');
  pause.type = 'button'; pause.className = 'motion-toggle';
  pause.innerHTML = '<span aria-hidden="true">Ⅱ</span>';
  document.body.append(pause);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let width, height, scale, centerY, heroHeight, maxScroll, backdrop, stars;
  let scroll = window.scrollY, targetScroll = scroll;
  let yaw = .45, dragYaw = 0, dragPitch = 0;
  let time = 0, intro = reduced.matches ? 1 : 0, last = 0, frame = 0;
  let pointerX = -1000, pointerY = -1000, dragging = null;
  const colors = ['224,237,255', '122,185,232', '237,156,106'];
  // Cache soft halos once, instead of blurring every particle on every frame.
  const glows = colors.map(color => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 48;
    const c = sprite.getContext('2d');
    const g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, `rgba(${color},.6)`);
    g.addColorStop(.12, `rgba(${color},.22)`);
    g.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 48, 48);
    return sprite;
  });

  function resize() {
    width = innerWidth; height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    heroHeight = hero.offsetHeight;
    centerY = hero.offsetTop + heroHeight * (width < 700 ? .43 : .5);
    scale = Math.min(width * (width < 700 ? .4 : .245), height * .36);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - height);
    const count = width < 700 ? 1150 : 2200;
    if (!stars || stars.length !== count) stars = createStars(count);
    backdrop = ctx.createRadialGradient(width * .5, height * .45, 0, width * .5, height * .45, Math.max(width, height) * .7);
    backdrop.addColorStop(0, '#04080d'); backdrop.addColorStop(.55, '#050b11'); backdrop.addColorStop(1, '#000000');
    requestDraw();
  }
  function requestDraw() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    const dt = last ? clamp((now - last) / 1000, 0, .05) : 1 / 60;
    last = now;
    if (!paused) {
      time += dt; intro = Math.min(1, intro + dt / 1.8);
      if (!dragging) yaw += dt * .035;
      scroll = mix(scroll, targetScroll, 1 - Math.exp(-dt * 9));
    } else { scroll = targetScroll; intro = 1; }
    draw(dt);
    if (!paused) requestDraw();
  }
  function draw(dt) {
    // Reset opacity before clearing: inherited particle alpha previously left trails.
    ctx.globalAlpha = 1;
    ctx.fillStyle = backdrop; ctx.fillRect(0, 0, width, height);
    const [graphWeight, spaceWeight, galaxyWeight] = stages(scroll, heroHeight, maxScroll);
    const cy = mix(centerY, height * .5, 1 - graphWeight);
    const angleY = yaw + dragYaw, angleX = mix(.25 + dragPitch, -.75, galaxyWeight);
    const sy = Math.sin(angleY), coY = Math.cos(angleY), sx = Math.sin(angleX), coX = Math.cos(angleX);
    const fadeIn = smooth(intro), step = Math.min(dt * 60, 3);
    for (const p of stars) {
      let x = p.graph[0] * graphWeight + p.space[0] * spaceWeight + p.galaxy[0] * galaxyWeight;
      let y = p.graph[1] * graphWeight + p.space[1] * spaceWeight + p.galaxy[1] * galaxyWeight;
      const z = p.graph[2] * graphWeight + p.space[2] * spaceWeight + p.galaxy[2] * galaxyWeight;
      const gather = 1 + (1 - fadeIn) * .4;
      x *= gather; y *= gather;
      // Keep the reading-stage stars anchored at the margins as the shape rotates.
      const rx = x * coY - z * sy, rz = x * sy + z * coY;
      const ry = y * coX - rz * sx, zz = y * sx + rz * coX;
      const point = project(mix(rx, x, spaceWeight), mix(ry, y, spaceWeight), mix(zz, z, spaceWeight), scale, width / 2, cy);
      if (!point) continue;
      if (!paused) {
        const dx = point.x - pointerX, dy = point.y - pointerY;
        const distance = Math.hypot(dx, dy), force = Math.max(0, 1 - distance / 65) * 7 * graphWeight;
        const ox = distance > .01 ? dx / distance * force : 0, oy = distance > .01 ? dy / distance * force : 0;
        p.velocityX = (p.velocityX + (ox - p.offsetX) * .075 * step) * Math.pow(.76, step);
        p.velocityY = (p.velocityY + (oy - p.offsetY) * .075 * step) * Math.pow(.76, step);
        p.offsetX = clamp(p.offsetX + p.velocityX * step, -10, 10);
        p.offsetY = clamp(p.offsetY + p.velocityY * step, -10, 10);
      }
      const px = point.x + p.offsetX, py = point.y + p.offsetY;
      if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;
      const radius = clamp(p.size * point.depth, .25, 2.4);
      const margin = smooth(Math.abs(px - width / 2) / (width * .42));
      const readingAlpha = mix(1, .18 + margin * .55, 1 - graphWeight);
      const twinkle = .9 + Math.sin(time * .65 + p.phase) * .1;
      const alpha = clamp(p.alpha * twinkle * fadeIn * readingAlpha * (p.dust ? .45 : 1));
      if (p.size > .9) {
        ctx.globalAlpha = alpha * .7;
        const size = radius * 14;
        ctx.drawImage(glows[p.color], px - size / 2, py - size / 2, size, size);
      }
      ctx.globalAlpha = alpha; ctx.fillStyle = `rgb(${colors[p.color]})`;
      ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function updatePause() {
    pause.setAttribute('aria-label', paused ? 'Resume background animation' : 'Pause background animation');
    pause.setAttribute('aria-pressed', String(paused));
    pause.title = paused ? 'Resume animation' : 'Pause animation';
    pause.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    last = 0; requestDraw();
  }
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; updatePause(); });
  addEventListener('scroll', () => { targetScroll = window.scrollY; if (paused) requestDraw(); }, { passive: true });
  addEventListener('resize', resize, { passive: true });
  new ResizeObserver(() => { maxScroll = Math.max(1, document.documentElement.scrollHeight - height); }).observe(document.body);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    else requestDraw();
  });
  surface.addEventListener('pointermove', e => {
    if (e.pointerType !== 'touch') { pointerX = e.clientX; pointerY = e.clientY; }
    if (dragging?.id === e.pointerId) {
      dragYaw += (e.clientX - dragging.x) * .006;
      dragPitch = clamp(dragPitch + (e.clientY - dragging.y) * .004, -.7, .7);
      dragging.x = e.clientX; dragging.y = e.clientY; requestDraw();
    }
  });
  surface.addEventListener('pointerleave', () => { pointerX = pointerY = -1000; });
  surface.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    dragging = { id: e.pointerId, x: e.clientX, y: e.clientY };
    surface.setPointerCapture(e.pointerId); surface.classList.add('is-dragging');
  });
  function release() { dragging = null; surface.classList.remove('is-dragging'); pointerX = pointerY = -1000; }
  surface.addEventListener('pointerup', release);
  surface.addEventListener('pointercancel', release);
  surface.addEventListener('lostpointercapture', release);
  surface.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Home') { yaw = .45; dragYaw = dragPitch = 0; }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') dragYaw += e.key === 'ArrowLeft' ? -.12 : .12;
    else dragPitch = clamp(dragPitch + (e.key === 'ArrowUp' ? -.12 : .12), -.7, .7);
    requestDraw();
  });
  resize(); updatePause();
}
