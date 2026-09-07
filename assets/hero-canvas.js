/*!
 * hero-canvas.js  —  Particle constellation hero for nealyx.github.io
 * Full-screen canvas, mouse parallax, drag-to-rotate, scroll-fade.
 * Particles form a glowing K4 graph (4 nodes, all 6 edges).
 */
(function () {
  'use strict';

  var CFG = {
    bgColor:        '#0d0e0b',
    nodeBright:     '#f5f3ec',
    edgeColor:      '#f5f3ec',
    accentColor:    '#a95738',
    starCount:      200,
    nodeRadius:     4.5,
    glowRadius:     28,
    edgeWidth:      1.2,
    rotateSpeed:    0.00018,
    parallaxDepth:  0.045,
    dragSensitivity:0.006,
    scrollFade:     0.7,
  };

  var canvas, ctx, W, H, raf;
  var yaw = 0, pitch = 0.35;
  var targetYaw = 0, targetPitch = 0.35;
  var dragging = false, lastX = 0, lastY = 0;
  var mouseNX = 0, mouseNY = 0;
  var scrollY = 0;
  var lastTime = 0;
  var stars = [];

  // Regular tetrahedron vertices
  var NODES = [
    [ 0,        1,       0      ],
    [ 0.9428,  -0.3333,  0      ],
    [-0.4714,  -0.3333,  0.8165 ],
    [-0.4714,  -0.3333, -0.8165 ],
  ];
  // [i, j, isAccent]
  var EDGES = [[0,1,true],[0,2,false],[0,3,false],[1,2,false],[1,3,false],[2,3,false]];

  function init() {
    var section = document.querySelector('.hero');
    if (!section) return;

    canvas = document.createElement('canvas');
    canvas.id = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    section.insertBefore(canvas, section.firstChild);

    ctx = canvas.getContext('2d');
    resize();
    buildStars();

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', function() { scrollY = window.scrollY; }, { passive: true });
    window.addEventListener('mousemove', function(e) {
      if (dragging) return;
      mouseNX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseNY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    canvas.addEventListener('pointerdown', function(e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('pointermove', function(e) {
      if (!dragging) return;
      targetYaw   += (e.clientX - lastX) * CFG.dragSensitivity;
      targetPitch += (e.clientY - lastY) * CFG.dragSensitivity;
      targetPitch  = Math.max(-1.2, Math.min(1.2, targetPitch));
      lastX = e.clientX; lastY = e.clientY;
    }, { passive: true });
    window.addEventListener('pointerup', function() {
      dragging = false; canvas.style.cursor = 'grab';
    });

    injectStyles();
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function resize() {
    var section = document.querySelector('.hero');
    W = canvas.width  = section.offsetWidth;
    H = canvas.height = section.offsetHeight;
  }

  function buildStars() {
    stars = [];
    for (var i = 0; i < CFG.starCount; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 1.1 + 0.2,
        a: Math.random() * 0.4 + 0.1,
        dx: (Math.random() - 0.5) * 0.000035,
        dy: (Math.random() - 0.5) * 0.000035,
      });
    }
  }

  function project(node) {
    var x = node[0], y = node[1], z = node[2];
    var py = yaw   + mouseNX * CFG.parallaxDepth;
    var pp = pitch + mouseNY * CFG.parallaxDepth;
    var cosY = Math.cos(py), sinY = Math.sin(py);
    var xr =  x * cosY + z * sinY;
    var zr = -x * sinY + z * cosY;
    var cosP = Math.cos(pp), sinP = Math.sin(pp);
    var yr2 =  y * cosP - zr * sinP;
    var zr2 =  y * sinP + zr * cosP;
    var fov = 3.2, s = fov / (fov + zr2);
    var scale = Math.min(W, H) * 0.27;
    return [W / 2 + xr * s * scale, H / 2 + yr2 * s * scale, s];
  }

  function loop(now) {
    var dt = Math.min(now - lastTime, 50);
    lastTime = now;

    targetYaw += CFG.rotateSpeed * dt;
    yaw   += (targetYaw   - yaw)   * 0.06;
    pitch += (targetPitch - pitch) * 0.06;

    var fade = Math.max(0, 1 - scrollY / (H * CFG.scrollFade));
    draw(dt, fade);
    raf = requestAnimationFrame(loop);
  }

  function draw(dt, fade) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = CFG.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x = (s.x + s.dx * dt + 1) % 1;
      s.y = (s.y + s.dy * dt + 1) % 1;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#c8c9c0';
      ctx.globalAlpha = s.a * fade;
      ctx.fill();
    }

    ctx.globalAlpha = fade;

    var proj = NODES.map(project);

    // Edges
    for (var e = 0; e < EDGES.length; e++) {
      var edge = EDGES[e];
      var p1 = proj[edge[0]], p2 = proj[edge[1]];
      var avgS = (p1[2] + p2[2]) / 2;
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      if (edge[2]) {
        ctx.strokeStyle = CFG.accentColor;
        ctx.lineWidth = CFG.edgeWidth * 2 * avgS;
        ctx.globalAlpha = (0.7 + avgS * 0.3) * fade;
      } else {
        ctx.strokeStyle = CFG.edgeColor;
        ctx.lineWidth = CFG.edgeWidth * avgS;
        ctx.globalAlpha = (0.22 + avgS * 0.4) * fade;
      }
      ctx.stroke();
    }

    // Nodes
    for (var n = 0; n < proj.length; n++) {
      var px = proj[n][0], py = proj[n][1], sc = proj[n][2];
      var glowR = CFG.glowRadius * sc;
      var dotR  = CFG.nodeRadius * sc;
      var grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      grd.addColorStop(0,   'rgba(245,243,236,0.3)');
      grd.addColorStop(0.5, 'rgba(245,243,236,0.06)');
      grd.addColorStop(1,   'rgba(245,243,236,0)');
      ctx.globalAlpha = fade;
      ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = CFG.nodeBright;
      ctx.globalAlpha = (0.85 + sc * 0.15) * fade;
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Bottom vignette → fades into page bg
    var vgrd = ctx.createLinearGradient(0, H * 0.6, 0, H);
    vgrd.addColorStop(0, 'rgba(13,14,11,0)');
    vgrd.addColorStop(1, 'rgba(245,243,236,0.12)');
    ctx.fillStyle = vgrd; ctx.fillRect(0, H * 0.6, W, H * 0.4);
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.hero { position:relative; overflow:hidden; }',
      '#hero-canvas { position:absolute; inset:0; width:100%; height:100%; z-index:0; cursor:grab; display:block; }',
      '.hero > *:not(#hero-canvas) { position:relative; z-index:1; }',
      '.hero .hero-copy h1,',
      '.hero .hero-copy { color:var(--paper); }',
      '.hero .hero-copy .hero-intro { color:rgba(197,197,190,0.88); }',
      '.hero .hero-copy .eyebrow { color:rgba(169,87,56,0.95); }',
      '.hero .hero-copy .text-link { color:var(--paper); opacity:0.7; }',
      '.hero .hero-copy .text-link:hover { opacity:1; }',
      '.hero .graph-figure { background:rgba(245,243,236,0.04); border:1px solid rgba(245,243,236,0.1); border-radius:6px; backdrop-filter:blur(6px); }',
      '.hero .figure-top { color:rgba(245,243,236,0.5) !important; }',
      '@keyframes hero-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }',
      '.hero .text-link[href="#work"] span { display:inline-block; animation:hero-bounce 2s ease-in-out infinite; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
