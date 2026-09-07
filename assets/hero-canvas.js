/*!
 * hero-canvas.js  —  Multi-stage space particle background
 */
(function () {
  'use strict';

  var CFG = {
    bgColor:        '#000000', 
    nodeBright:     '#ffffff', 
    accentColor:    '#f0643a', 
    particleCount:  2000,      
    rotateSpeed:    0.00015,
  };

  var canvas, ctx, W, H, raf;
  var yaw = 0, pitch = 0.35;
  var mouseX = -1000, mouseY = -1000;
  var scrollY = 0, maxScroll = 1;
  var lastTime = 0;
  var particles = [];
  var loadProgress = 0;

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

    ctx = canvas.getContext('2d', { alpha: false }); // Optimize for black background
    resize();
    buildParticles();

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', function() { 
      scrollY = window.scrollY; 
      maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    }, { passive: true });
    
    window.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });
    
    window.addEventListener('mouseout', function(e) {
      mouseX = -1000; mouseY = -1000;
    }, { passive: true });
    
    canvas.addEventListener('pointerdown', function() { canvas.style.cursor = 'grabbing'; });
    window.addEventListener('pointerup', function() { canvas.style.cursor = 'grab'; });
    
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
    
    var bgCount = Math.floor(CFG.particleCount * 0.3);
    var shapeCount = CFG.particleCount - bgCount;
    var nodeCount = Math.floor(shapeCount * 0.35);
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
        var dx = (Math.random()-0.5)*0.15, dy = (Math.random()-0.5)*0.15, dz = (Math.random()-0.5)*0.15;
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
    
    for (var i = 0; i < pyramidPositions.length; i++) {
      var side = Math.random() > 0.5 ? 1 : -1;
      var spaceX = side * (3.5 + Math.random() * 2.0); 
      var spaceY = (Math.random() - 0.5) * 8.0;
      var spaceZ = (Math.random() - 0.5) * 4.0;
      var posSpace = [spaceX, spaceY, spaceZ];
      
      // High quality spiral galaxy formulation
      var arms = 3; // 3 elegant arms
      var armIndex = Math.floor(Math.random() * arms);
      var armAngle = (armIndex / arms) * Math.PI * 2;
      
      // Cubed random gives dense center, sparse edges
      var u = Math.random();
      var dist = u * u * u * 4.5; 
      
      var angle = dist * 1.8 + armAngle; // Wind the spiral
      
      var spread = 0.05 + (dist * 0.12); // Tighter at core
      // Add a slight gaussian-like scattering
      var r1 = (Math.random() + Math.random() + Math.random() - 1.5);
      var r2 = (Math.random() + Math.random() + Math.random() - 1.5);
      var r3 = (Math.random() + Math.random() + Math.random() - 1.5);
      
      var gx = Math.cos(angle) * dist + r1 * spread;
      var gz = Math.sin(angle) * dist + r2 * spread;
      var gy = r3 * spread * 0.4; // flat disk
      var posGalaxy = [gx, gy, gz];
      
      var posStart = randomSpherePoint(6 + Math.random() * 6);
      
      particles.push({
        pStart: posStart,
        pPyr: pyramidPositions[i],
        pSpace: posSpace,
        pGal: posGalaxy,
        isAccent: isAccents[i],
        r: Math.random() * 1.5 + 0.6,
        a: Math.random() * 0.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.002 + 0.001,
        drift: [ (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2 ],
        jOff: [0,0,0],
        jVel: [0,0,0]
      });
    }
  }

  function project(x, y, z, activePitch, activeYaw) {
    var cosY = Math.cos(activeYaw), sinY = Math.sin(activeYaw);
    var xr =  x * cosY + z * sinY;
    var zr = -x * sinY + z * cosY;
    var cosP = Math.cos(activePitch), sinP = Math.sin(activePitch);
    var yr2 =  y * cosP - zr * sinP;
    var zr2 =  y * sinP + zr * cosP;
    var fov = 3.5, s = fov / (fov + zr2);
    var scale = Math.min(W, H) * 0.28;
    return [W / 2 + xr * s * scale, H / 2 + yr2 * s * scale, s];
  }

  function easeInOutQuad(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; }

  function loop(now) {
    var dt = Math.min(now - lastTime, 50);
    lastTime = now;

    if (loadProgress < 1) {
      loadProgress += dt / 2500;
      if (loadProgress > 1) loadProgress = 1;
    }

    yaw += CFG.rotateSpeed * dt;
    var basePitch = 0.35;

    draw(now, basePitch, yaw, dt);
    raf = requestAnimationFrame(loop);
  }

  function draw(now, activePitch, activeYaw, dt) {
    // Pure black, opaque fill
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    var scrollRatio = scrollY / Math.max(maxScroll, 1000); 
    
    var scrollPitchOffset = Math.min(scrollRatio / 0.15, 1) * 0.8;
    var currentPitch = activePitch + scrollPitchOffset;
    var currentYaw = activeYaw;

    var pSpace = Math.max(0, Math.min((scrollRatio - 0.15) / 0.20, 1));
    var wPyr = 1 - pSpace;
    var wSpace = pSpace;
    var wGal = 0;

    if (scrollRatio > 0.7) {
      var pGal = Math.max(0, Math.min((scrollRatio - 0.70) / 0.25, 1));
      wSpace = 1 - pGal;
      wGal = pGal;
      currentPitch = currentPitch * (1-pGal) + (-0.5) * pGal;
      currentYaw = currentYaw * (1-pGal) + (now * 0.0002) * pGal; 
    }
    
    wPyr = easeInOutQuad(wPyr);
    wSpace = easeInOutQuad(wSpace);
    wGal = easeInOutQuad(wGal);
    var loadEase = easeInOutQuad(loadProgress);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      
      var bx = p.pPyr[0] * wPyr + p.pSpace[0] * wSpace + p.pGal[0] * wGal;
      var by = p.pPyr[1] * wPyr + p.pSpace[1] * wSpace + p.pGal[1] * wGal;
      var bz = p.pPyr[2] * wPyr + p.pSpace[2] * wSpace + p.pGal[2] * wGal;
      
      var cx = p.pStart[0] * (1-loadEase) + bx * loadEase;
      var cy = p.pStart[1] * (1-loadEase) + by * loadEase;
      var cz = p.pStart[2] * (1-loadEase) + bz * loadEase;

      var driftAmt = Math.sin(now * p.speed + p.phase);
      cx += p.drift[0] * driftAmt;
      cy += p.drift[1] * driftAmt;
      cz += p.drift[2] * driftAmt;
      
      if ((wPyr > 0.8 || wGal > 0.8) && loadEase > 0.9) {
          cx += Math.sin(now * 0.001 + p.phase) * 0.02;
          cy += Math.cos(now * 0.0013 + p.phase) * 0.02;
          cz += Math.sin(now * 0.0017 + p.phase) * 0.02;
      }

      var projRaw = project(cx, cy, cz, currentPitch, currentYaw);
      var rPx = projRaw[0], rPy = projRaw[1];
      
      var dx = rPx - mouseX;
      var dy = rPy - mouseY;
      var distSq = dx*dx + dy*dy;
      
      // ULTRA-SMALL, THICK HOVER SPAN
      var hoverRadius = 35; // Tiny radius
      
      if (distSq < hoverRadius*hoverRadius) {
        var dist = Math.sqrt(distSq);
        var force = (hoverRadius - dist) / hoverRadius;
        
        // Micro-push to keep the span small and dense
        p.jVel[0] += (dx / dist) * force * 0.015;
        p.jVel[1] += (dy / dist) * force * 0.015;
        p.jVel[2] += (Math.random() - 0.5) * force * 0.005; 
      }
      
      // Extremely stiff, highly controlled spring physics
      p.jVel[0] += -p.jOff[0] * 0.40; // Very high stiffness
      p.jVel[1] += -p.jOff[1] * 0.40;
      p.jVel[2] += -p.jOff[2] * 0.40;
      
      p.jVel[0] *= 0.50; // Heavy damping, snaps back immediately, zero wobble
      p.jVel[1] *= 0.50;
      p.jVel[2] *= 0.50;
      
      p.jOff[0] += p.jVel[0];
      p.jOff[1] += p.jVel[1];
      p.jOff[2] += p.jVel[2];

      cx += p.jOff[0];
      cy += p.jOff[1];
      cz += p.jOff[2];

      var proj = project(cx, cy, cz, currentPitch, currentYaw);
      var px = proj[0], py = proj[1], sc = proj[2];
      
      var dotR = p.r * sc;
      if (dotR < 0.1 || sc < 0.1) continue;

      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      
      if (p.isAccent && wPyr > 0.5) {
        ctx.fillStyle = CFG.accentColor;
        var pulse = (Math.sin(now * 0.003 + p.phase) + 1) * 0.5;
        ctx.globalAlpha = Math.min((0.6 + pulse * 0.4) * wPyr, 1);
      } else {
        if (wGal > 0.5) {
          // Galaxy coloring matching the image (bright white/blue core, orange outer elements)
          var distToCenter = Math.sqrt(p.pGal[0]*p.pGal[0] + p.pGal[2]*p.pGal[2]);
          if (distToCenter < 1.5) ctx.fillStyle = '#ffffff';
          else if (Math.random() > 0.8) ctx.fillStyle = '#ffb380'; // orange stars
          else if (Math.random() > 0.5) ctx.fillStyle = '#99ccff'; // blue stars
          else ctx.fillStyle = '#e6f2ff';
          ctx.globalAlpha = p.a * Math.min(sc, 2.0);
        } else if (wPyr > 0.5) {
          ctx.fillStyle = CFG.nodeBright;
          ctx.globalAlpha = Math.min(p.a * 1.5 * sc * wPyr, 1); 
        } else {
          ctx.fillStyle = CFG.nodeBright;
          ctx.globalAlpha = p.a * Math.min(sc, 1.5);
        }
      }
      ctx.fill();
    }
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#hero-canvas { position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none; }',
      '.hero { cursor: grab; }',
      '.hero:active { cursor: grabbing; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
