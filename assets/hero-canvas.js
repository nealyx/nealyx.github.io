/*!
 * hero-canvas.js  —  Particle constellation hero for nealyx.github.io
 * Full-screen canvas, mouse parallax, drag-to-rotate, scroll-reactive dispersion.
 * Particles form a glowing K4 graph and scatter on scroll.
 */
(function () {
  'use strict';

  var CFG = {
    bgColor:        '#0d0e0b',
    nodeBright:     '#f5f3ec',
    edgeColor:      '#f5f3ec',
    accentColor:    '#a95738',
    particleCount:  1200, // Lots of particles to form the shape
    nodeRadius:     2.5,
    rotateSpeed:    0.00015,
    parallaxDepth:  0.06,
    dragSensitivity:0.006,
    scrollScatter:  400, // pixels of scroll to fully scatter
  };

  var canvas, ctx, W, H, raf;
  var yaw = 0, pitch = 0.35;
  var targetYaw = 0, targetPitch = 0.35;
  var dragging = false, lastX = 0, lastY = 0;
  var mouseNX = 0, mouseNY = 0;
  var scrollY = 0;
  var lastTime = 0;
  var particles = [];

  // Regular tetrahedron vertices (radius ~1)
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
    buildParticles();

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
    
    // Initial scroll check
    scrollY = window.scrollY;

    injectStyles();
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function resize() {
    var section = document.querySelector('.hero');
    W = canvas.width  = section.offsetWidth;
    H = canvas.height = section.offsetHeight;
  }

  // Generate a random point uniformly on a sphere
  function randomSpherePoint(radius) {
    var u = Math.random();
    var v = Math.random();
    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);
    var x = radius * Math.sin(phi) * Math.cos(theta);
    var y = radius * Math.sin(phi) * Math.sin(theta);
    var z = radius * Math.cos(phi);
    return [x, y, z];
  }

  function buildParticles() {
    particles = [];
    
    // Distribute particles among nodes, edges, and background
    var bgCount = Math.floor(CFG.particleCount * 0.4);
    var shapeCount = CFG.particleCount - bgCount;
    var nodeCount = Math.floor(shapeCount * 0.3);
    var edgeCount = shapeCount - nodeCount;
    
    // Background stars (ambient)
    for (var i = 0; i < bgCount; i++) {
      var pt = randomSpherePoint(2.5 + Math.random() * 2.5);
      particles.push(createParticle(pt, pt, false));
    }
    
    // Nodes
    var perNode = Math.floor(nodeCount / NODES.length);
    for (var n = 0; n < NODES.length; n++) {
      for (var i = 0; i < perNode; i++) {
        // slight jitter around node
        var dx = (Math.random()-0.5)*0.15;
        var dy = (Math.random()-0.5)*0.15;
        var dz = (Math.random()-0.5)*0.15;
        var t = [NODES[n][0]+dx, NODES[n][1]+dy, NODES[n][2]+dz];
        var s = randomSpherePoint(2.0 + Math.random() * 3.0);
        particles.push(createParticle(t, s, true, n===0 || n===1)); // highlight some if needed
      }
    }
    
    // Edges
    var perEdge = Math.floor(edgeCount / EDGES.length);
    for (var e = 0; e < EDGES.length; e++) {
      var n1 = NODES[EDGES[e][0]];
      var n2 = NODES[EDGES[e][1]];
      var isAccent = EDGES[e][2];
      for (var i = 0; i < perEdge; i++) {
        var tParam = Math.random();
        var dx = (Math.random()-0.5)*0.08;
        var dy = (Math.random()-0.5)*0.08;
        var dz = (Math.random()-0.5)*0.08;
        var tx = n1[0] + (n2[0]-n1[0])*tParam + dx;
        var ty = n1[1] + (n2[1]-n1[1])*tParam + dy;
        var tz = n1[2] + (n2[2]-n1[2])*tParam + dz;
        var s = randomSpherePoint(2.0 + Math.random() * 3.0);
        particles.push(createParticle([tx,ty,tz], s, true, isAccent));
      }
    }
  }

  function createParticle(target, scatter, isShape, isAccent) {
    return {
      t: target,      // target pos (forming the shape)
      s: scatter,     // scattered pos (when scrolled)
      c: [0,0,0],     // current 3d pos
      isShape: isShape,
      isAccent: isAccent,
      r: Math.random() * 1.5 + 0.5, // radius
      a: Math.random() * 0.5 + 0.2, // alpha
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.002 + 0.001,
      // Continuous random drift even when stationary
      drift: [ (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2 ]
    };
  }

  function project(x, y, z) {
    var py = yaw   + mouseNX * CFG.parallaxDepth;
    var pp = pitch + mouseNY * CFG.parallaxDepth;
    var cosY = Math.cos(py), sinY = Math.sin(py);
    var xr =  x * cosY + z * sinY;
    var zr = -x * sinY + z * cosY;
    var cosP = Math.cos(pp), sinP = Math.sin(pp);
    var yr2 =  y * cosP - zr * sinP;
    var zr2 =  y * sinP + zr * cosP;
    var fov = 3.5, s = fov / (fov + zr2);
    var scale = Math.min(W, H) * 0.28;
    return [W / 2 + xr * s * scale, H / 2 + yr2 * s * scale, s];
  }

  function loop(now) {
    var dt = Math.min(now - lastTime, 50);
    lastTime = now;

    targetYaw += CFG.rotateSpeed * dt;
    yaw   += (targetYaw   - yaw)   * 0.06;
    pitch += (targetPitch - pitch) * 0.06;

    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = CFG.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Scatter factor based on scroll
    // 0 = perfectly formed shape, 1 = fully scattered
    var scatterFactor = Math.min(Math.max(scrollY / CFG.scrollScatter, 0), 1);
    // easing
    scatterFactor = scatterFactor * scatterFactor * (3 - 2 * scatterFactor);

    // Global fade out as you scroll very deep
    var globalFade = Math.max(0, 1 - (scrollY - CFG.scrollScatter) / (H * 0.5));
    if (globalFade <= 0) return; // don't draw if fully faded

    ctx.globalAlpha = globalFade;

    // Draw connecting lines only when shape is mostly formed
    var lineFade = Math.max(0, 1 - scatterFactor * 3); // fades out very fast on scroll
    if (lineFade > 0) {
      var projNodes = NODES.map(function(n) { return project(n[0], n[1], n[2]); });
      for (var e = 0; e < EDGES.length; e++) {
        var edge = EDGES[e];
        var p1 = projNodes[edge[0]], p2 = projNodes[edge[1]];
        var avgS = (p1[2] + p2[2]) / 2;
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        if (edge[2]) {
          ctx.strokeStyle = CFG.accentColor;
          ctx.lineWidth = 1.5 * avgS;
          ctx.globalAlpha = (0.5 + avgS * 0.3) * lineFade * globalFade;
        } else {
          ctx.strokeStyle = CFG.edgeColor;
          ctx.lineWidth = 1.0 * avgS;
          ctx.globalAlpha = (0.15 + avgS * 0.3) * lineFade * globalFade;
        }
        ctx.stroke();
      }
    }

    // Draw Particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      
      // Interpolate between target shape and scattered position
      var curScatter = p.isShape ? scatterFactor : 1; 
      
      // Calculate continuous drift
      var driftAmt = Math.sin(now * p.speed + p.phase);
      
      var cx = p.t[0] * (1 - curScatter) + p.s[0] * curScatter + p.drift[0] * driftAmt * curScatter;
      var cy = p.t[1] * (1 - curScatter) + p.s[1] * curScatter + p.drift[1] * driftAmt * curScatter;
      var cz = p.t[2] * (1 - curScatter) + p.s[2] * curScatter + p.drift[2] * driftAmt * curScatter;
      
      // Add a tiny bit of "breathing" noise even when formed
      if (p.isShape && curScatter < 0.1) {
          cx += Math.sin(now * 0.001 + p.phase) * 0.02;
          cy += Math.cos(now * 0.0013 + p.phase) * 0.02;
          cz += Math.sin(now * 0.0017 + p.phase) * 0.02;
      }

      var proj = project(cx, cy, cz);
      var px = proj[0], py = proj[1], sc = proj[2];
      
      var dotR = p.r * sc;
      if (dotR < 0.1) continue;

      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      
      if (p.isShape && p.isAccent && curScatter < 0.8) {
        ctx.fillStyle = CFG.accentColor;
        // Make accent particles pulse slightly
        var pulse = (Math.sin(now * 0.003 + p.phase) + 1) * 0.5; // 0 to 1
        ctx.globalAlpha = (0.4 + pulse * 0.6) * globalFade;
      } else {
        ctx.fillStyle = CFG.nodeBright;
        ctx.globalAlpha = p.a * Math.min(sc, 1.5) * globalFade;
      }
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Bottom vignette -> fades into page bg
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
      '.hero .graph-figure { background:rgba(245,243,236,0.04); border:1px solid rgba(245,243,236,0.1); border-radius:6px; backdrop-filter:blur(6px); transition: opacity 0.3s; }',
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
