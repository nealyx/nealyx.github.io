/*!
 * hero-canvas.js  —  Multi-stage space particle background
 */
(function () {
  'use strict';

  var CFG = {
    bgColor:        '#040506', // deep space
    nodeBright:     '#f5f3ec',
    edgeColor:      '#f5f3ec',
    accentColor:    '#a95738',
    particleCount:  1500, 
    rotateSpeed:    0.00015,
    parallaxDepth:  0.06,
    dragSensitivity:0.006,
  };

  var canvas, ctx, W, H, raf;
  var yaw = 0, pitch = 0.35;
  var targetYaw = 0, targetPitch = 0.35;
  var dragging = false, lastX = 0, lastY = 0;
  var mouseNX = 0, mouseNY = 0;
  var scrollY = 0, maxScroll = 1;
  var lastTime = 0;
  var particles = [];
  var loadProgress = 0; // 0 to 1 over first 2 seconds

  // K4 Tetrahedron Vertices (Radius ~1)
  var NODES = [
    [ 0,        1,       0      ],
    [ 0.9428,  -0.3333,  0      ],
    [-0.4714,  -0.3333,  0.8165 ],
    [-0.4714,  -0.3333, -0.8165 ],
  ];
  var EDGES = [[0,1,true],[0,2,false],[0,3,false],[1,2,false],[1,3,false],[2,3,false]];

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);

    ctx = canvas.getContext('2d');
    resize();
    buildParticles();

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', function() { 
      scrollY = window.scrollY; 
      maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    }, { passive: true });
    
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
    
    scrollY = window.scrollY;
    maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);

    injectStyles();
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
  }

  function randomSpherePoint(radius) {
    var u = Math.random(), v = Math.random();
    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);
    var x = radius * Math.sin(phi) * Math.cos(theta);
    var y = radius * Math.sin(phi) * Math.sin(theta);
    var z = radius * Math.cos(phi);
    return [x, y, z];
  }

  function buildParticles() {
    particles = [];
    
    // 1. Assign Pyramid Positions
    var bgCount = Math.floor(CFG.particleCount * 0.4);
    var shapeCount = CFG.particleCount - bgCount;
    var nodeCount = Math.floor(shapeCount * 0.3);
    var edgeCount = shapeCount - nodeCount;
    
    var pyramidPositions = [];
    var isAccents = [];
    
    for (var i = 0; i < bgCount; i++) {
      pyramidPositions.push(randomSpherePoint(2.5 + Math.random() * 2.5));
      isAccents.push(false);
    }
    
    var perNode = Math.floor(nodeCount / NODES.length);
    for (var n = 0; n < NODES.length; n++) {
      for (var i = 0; i < perNode; i++) {
        var dx = (Math.random()-0.5)*0.15;
        var dy = (Math.random()-0.5)*0.15;
        var dz = (Math.random()-0.5)*0.15;
        pyramidPositions.push([NODES[n][0]+dx, NODES[n][1]+dy, NODES[n][2]+dz]);
        isAccents.push(n===0 || n===1);
      }
    }
    
    var perEdge = Math.floor(edgeCount / EDGES.length);
    for (var e = 0; e < EDGES.length; e++) {
      var n1 = NODES[EDGES[e][0]], n2 = NODES[EDGES[e][1]];
      for (var i = 0; i < perEdge; i++) {
        var tParam = Math.random();
        var dx = (Math.random()-0.5)*0.08, dy = (Math.random()-0.5)*0.08, dz = (Math.random()-0.5)*0.08;
        pyramidPositions.push([n1[0] + (n2[0]-n1[0])*tParam + dx, n1[1] + (n2[1]-n1[1])*tParam + dy, n1[2] + (n2[2]-n1[2])*tParam + dz]);
        isAccents.push(EDGES[e][2]);
      }
    }
    
    // Generate all particles
    for (var i = 0; i < pyramidPositions.length; i++) {
      // 2. Space/Edge Positions (Left and right columns)
      var side = Math.random() > 0.5 ? 1 : -1;
      var spaceX = side * (3.5 + Math.random() * 2.0); // push to edges
      var spaceY = (Math.random() - 0.5) * 8.0;
      var spaceZ = (Math.random() - 0.5) * 4.0;
      var posSpace = [spaceX, spaceY, spaceZ];
      
      // 3. Galaxy Positions (Spiral)
      var arm = Math.random() > 0.5 ? 0 : Math.PI;
      var dist = Math.random() * 3.0;
      var angle = dist * 2.5 + arm;
      var spread = 0.2 + (dist * 0.1);
      var gx = Math.cos(angle) * dist + (Math.random()-0.5)*spread;
      var gz = Math.sin(angle) * dist + (Math.random()-0.5)*spread;
      var gy = (Math.random()-0.5) * 0.3; // flat disk
      var posGalaxy = [gx, gy, gz];
      
      // Random starting point for the load animation
      var posStart = randomSpherePoint(6 + Math.random() * 6);
      
      particles.push({
        pStart: posStart,
        pPyr: pyramidPositions[i],
        pSpace: posSpace,
        pGal: posGalaxy,
        isAccent: isAccents[i],
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.002 + 0.001,
        drift: [ (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2 ]
      });
    }
  }

  function project(x, y, z, activePitch, activeYaw) {
    var py = activeYaw   + mouseNX * CFG.parallaxDepth;
    var pp = activePitch + mouseNY * CFG.parallaxDepth;
    var cosY = Math.cos(py), sinY = Math.sin(py);
    var xr =  x * cosY + z * sinY;
    var zr = -x * sinY + z * cosY;
    var cosP = Math.cos(pp), sinP = Math.sin(pp);
    var yr2 =  y * cosP - zr * sinP;
    var zr2 =  y * sinP + zr * cosP;
    var fov = 3.5, s = fov / (fov + zr2);
    // Dynamic scale based on screen size so galaxy/pyramid fit
    var scale = Math.min(W, H) * 0.28;
    return [W / 2 + xr * s * scale, H / 2 + yr2 * s * scale, s];
  }

  // Easing function
  function easeInOutQuad(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; }

  function loop(now) {
    var dt = Math.min(now - lastTime, 50);
    lastTime = now;

    // Load animation progress (0 to 1 over 2.5 seconds)
    if (loadProgress < 1) {
      loadProgress += dt / 2500;
      if (loadProgress > 1) loadProgress = 1;
    }

    targetYaw += CFG.rotateSpeed * dt;
    yaw   += (targetYaw   - yaw)   * 0.06;
    pitch += (targetPitch - pitch) * 0.06;

    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    
    // Deep space gradient
    var bgGrd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H));
    bgGrd.addColorStop(0, '#0a0b0d');
    bgGrd.addColorStop(1, '#020202');
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, W, H);

    // Calculate stage progresses based on scrollY
    var scrollRatio = scrollY / Math.max(maxScroll, 1000); // 0 at top, 1 at bottom
    
    // T = 0.00 -> 0.15: Shift Pyramid angle
    var scrollPitchOffset = Math.min(scrollRatio / 0.15, 1) * 0.8;
    var activePitch = pitch + scrollPitchOffset;
    var activeYaw = yaw;

    // T = 0.15 -> 0.35: Dissipate to Space
    var pSpace = Math.max(0, Math.min((scrollRatio - 0.15) / 0.20, 1));
    var wPyr = 1 - pSpace;
    var wSpace = pSpace;
    var wGal = 0;

    // T = 0.70 -> 0.95: Space to Galaxy
    if (scrollRatio > 0.7) {
      var pGal = Math.max(0, Math.min((scrollRatio - 0.70) / 0.25, 1));
      wSpace = 1 - pGal;
      wGal = pGal;
      
      // Galaxy has its own tilt
      activePitch = activePitch * (1-pGal) + (-0.5) * pGal;
      activeYaw = activeYaw * (1-pGal) + (now * 0.0002) * pGal; // gentle auto-spin for galaxy
    }
    
    // Easing for smooth transitions
    wPyr = easeInOutQuad(wPyr);
    wSpace = easeInOutQuad(wSpace);
    wGal = easeInOutQuad(wGal);

    var loadEase = easeInOutQuad(loadProgress);

    // Draw Particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      
      // 1. Calculate base position blending all states
      var bx = p.pPyr[0] * wPyr + p.pSpace[0] * wSpace + p.pGal[0] * wGal;
      var by = p.pPyr[1] * wPyr + p.pSpace[1] * wSpace + p.pGal[1] * wGal;
      var bz = p.pPyr[2] * wPyr + p.pSpace[2] * wSpace + p.pGal[2] * wGal;
      
      // 2. Blend with load animation start position
      var cx = p.pStart[0] * (1-loadEase) + bx * loadEase;
      var cy = p.pStart[1] * (1-loadEase) + by * loadEase;
      var cz = p.pStart[2] * (1-loadEase) + bz * loadEase;

      // 3. Add continuous drift
      var driftAmt = Math.sin(now * p.speed + p.phase);
      cx += p.drift[0] * driftAmt;
      cy += p.drift[1] * driftAmt;
      cz += p.drift[2] * driftAmt;
      
      // Tiny "breathing" noise when in rigid shapes (Pyramid or Galaxy)
      if ((wPyr > 0.8 || wGal > 0.8) && loadEase > 0.9) {
          cx += Math.sin(now * 0.001 + p.phase) * 0.02;
          cy += Math.cos(now * 0.0013 + p.phase) * 0.02;
          cz += Math.sin(now * 0.0017 + p.phase) * 0.02;
      }

      var proj = project(cx, cy, cz, activePitch, activeYaw);
      var px = proj[0], py = proj[1], sc = proj[2];
      
      var dotR = p.r * sc;
      if (dotR < 0.1 || sc < 0.1) continue;

      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      
      // Color logic: Accent color only visible in Pyramid state
      if (p.isAccent && wPyr > 0.5) {
        ctx.fillStyle = CFG.accentColor;
        var pulse = (Math.sin(now * 0.003 + p.phase) + 1) * 0.5;
        ctx.globalAlpha = (0.4 + pulse * 0.6);
      } else {
        // In galaxy state, add a slight warm/blue tint based on radius
        if (wGal > 0.5) {
          var distToCenter = Math.sqrt(p.pGal[0]*p.pGal[0] + p.pGal[2]*p.pGal[2]);
          if (distToCenter < 1.0) ctx.fillStyle = '#ffeedd'; // core
          else if (distToCenter < 2.0) ctx.fillStyle = '#f5f3ec';
          else ctx.fillStyle = '#cceeff'; // outer arms
        } else {
          ctx.fillStyle = CFG.nodeBright;
        }
        ctx.globalAlpha = p.a * Math.min(sc, 1.5);
      }
      ctx.fill();
    }
    
    // Optional: Draw faint Pyramid lines ONLY when fully loaded and scroll=0
    var lineOpacity = Math.max(0, 1 - (scrollRatio / 0.05)) * Math.max(0, (loadProgress - 0.8) / 0.2);
    if (lineOpacity > 0.01) {
       // We can just rely on the particles for the shape to match Astra exactly,
       // but subtle connecting lines are nice. Let's skip the lines for a pure particle feel, 
       // as requested ("stars that make up the pyramid").
    }

    ctx.globalAlpha = 1;
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#hero-canvas { position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none; }', // canvas is behind everything, no pointer events so page works
      // The hero section must catch pointer events for the mouse rotation to work!
      '.hero { pointer-events: auto; }', 
    ].join('\n');
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
