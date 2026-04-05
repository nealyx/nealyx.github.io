const canvas = document.getElementById("network");
const ctx = canvas ? canvas.getContext("2d") : null;

let width = window.innerWidth;
let height = window.innerHeight;
let particles = [];
let ambientOrbs = [];
let symbols = [];

const mouse = {
  x: null,
  y: null,
  radius: 150,
  smoothX: null,
  smoothY: null
};

const config = {
  maxDistance: 145,
  particleColor: "rgba(125, 125, 125, 0.16)",
  speed: 0.42,
  bgColor: "#f5f3ef"
};

function resizeCanvas() {
  if (!canvas || !ctx) return;

  width = window.innerWidth;
  height = window.innerHeight;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createScene();
}

class Particle {
  constructor() {
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * config.speed + 0.12;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.size = Math.random() * 3.6 + 1.8;

    if (!initial) {
      this.x = Math.random() < 0.5 ? -20 : width + 20;
      this.y = Math.random() * height;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -40 || this.x > width + 40 || this.y < -40 || this.y > height + 40) {
      this.reset();
    }

    if (mouse.smoothX !== null && mouse.smoothY !== null) {
      const dx = this.x - mouse.smoothX;
      const dy = this.y - mouse.smoothY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * force * 1.8;
        this.y += Math.sin(angle) * force * 1.8;
      }
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = config.particleColor;
    ctx.fill();
  }
}

class AmbientOrb {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * 90 + 50;
    this.vx = (Math.random() - 0.5) * 0.18;
    this.vy = (Math.random() - 0.5) * 0.18;
    this.opacity = Math.random() * 0.05 + 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -150) this.x = width + 150;
    if (this.x > width + 150) this.x = -150;
    if (this.y < -150) this.y = height + 150;
    if (this.y > height + 150) this.y = -150;
  }

  draw() {
    let offsetX = 0;
    let offsetY = 0;

    if (mouse.smoothX !== null && mouse.smoothY !== null) {
      offsetX = (mouse.smoothX - width / 2) * 0.008;
      offsetY = (mouse.smoothY - height / 2) * 0.008;
    }

    const x = this.x + offsetX;
    const y = this.y + offsetY;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.radius);
    gradient.addColorStop(0, `rgba(212, 175, 55, ${this.opacity})`);
    gradient.addColorStop(1, "rgba(212, 175, 55, 0)");

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class FloatingSymbol {
  constructor() {
    this.availableSymbols = ["π", "Σ", "Ω", "θ", "∫", "∆"];
    this.reset(true);
  }

  reset(initial = false) {
    this.char =
      this.availableSymbols[Math.floor(Math.random() * this.availableSymbols.length)];

    const centerX = width / 2;
    const centerY = height / 2;
    let x = Math.random() * width;
    let y = Math.random() * height;

    while (
      x > centerX - 220 &&
      x < centerX + 220 &&
      y > centerY - 160 &&
      y < centerY + 160
    ) {
      x = Math.random() * width;
      y = Math.random() * height;
    }

    this.x = x;
    this.y = y;

    this.size = Math.random() * 16 + 18;
    this.opacity = Math.random() * 0.11 + 0.06;

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.18 + 0.04;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.phase = Math.random() * Math.PI * 2;

    if (!initial) {
      this.x = Math.random() < 0.5 ? -30 : width + 30;
      this.y = Math.random() * height;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.phase += 0.01;

    if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
      this.reset();
    }

    if (mouse.smoothX !== null && mouse.smoothY !== null) {
      const dx = this.x - mouse.smoothX;
      const dy = this.y - mouse.smoothY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 140) {
        const force = (140 - dist) / 140;
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * force * 0.8;
        this.y += Math.sin(angle) * force * 0.8;
      }
    }
  }

  draw() {
    const pulse = 0.85 + Math.sin(this.phase) * 0.15;
    const alpha = this.opacity * pulse;

    ctx.save();
    ctx.font = `${this.size}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = `rgba(212, 175, 55, ${alpha * 0.6})`;
    ctx.shadowBlur = 10;
    ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
    ctx.fillText(this.char, this.x, this.y);
    ctx.restore();
  }
}

function createScene() {
  particles = [];
  ambientOrbs = [];
  symbols = [];

  const particleCount = Math.max(65, Math.floor((width * height) / 18000));
  const finalParticleCount = Math.min(particleCount, 125);

  for (let i = 0; i < finalParticleCount; i++) {
    particles.push(new Particle());
  }

  const orbCount = Math.max(4, Math.min(8, Math.floor(width / 260)));
  for (let i = 0; i < orbCount; i++) {
    ambientOrbs.push(new AmbientOrb());
  }

  const symbolCount = Math.min(22, Math.max(12, Math.floor(width / 90)));
  for (let i = 0; i < symbolCount; i++) {
    symbols.push(new FloatingSymbol());
  }
}

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < config.maxDistance) {
        const opacity = 1 - distance / config.maxDistance;

        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(130, 130, 130, ${opacity * 0.16})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
  }
}

function drawMouseConnections() {
  if (mouse.smoothX === null || mouse.smoothY === null) return;

  for (const particle of particles) {
    const dx = particle.x - mouse.smoothX;
    const dy = particle.y - mouse.smoothY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < mouse.radius) {
      const opacity = 1 - distance / mouse.radius;

      ctx.beginPath();
      ctx.moveTo(mouse.smoothX, mouse.smoothY);
      ctx.lineTo(particle.x, particle.y);
      ctx.strokeStyle = `rgba(212, 175, 55, ${opacity * 0.32})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size + 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, ${opacity * 0.38})`;
      ctx.fill();
    }
  }
}

function drawMouseGlow() {
  if (mouse.smoothX === null || mouse.smoothY === null) return;

  const glow = ctx.createRadialGradient(
    mouse.smoothX,
    mouse.smoothY,
    0,
    mouse.smoothX,
    mouse.smoothY,
    180
  );

  glow.addColorStop(0, "rgba(212, 175, 55, 0.12)");
  glow.addColorStop(0.35, "rgba(212, 175, 55, 0.06)");
  glow.addColorStop(1, "rgba(212, 175, 55, 0)");

  ctx.beginPath();
  ctx.fillStyle = glow;
  ctx.arc(mouse.smoothX, mouse.smoothY, 180, 0, Math.PI * 2);
  ctx.fill();
}

function updateMouseSmoothing() {
  if (mouse.x === null || mouse.y === null) {
    if (mouse.smoothX !== null && mouse.smoothY !== null) {
      mouse.smoothX += (width / 2 - mouse.smoothX) * 0.02;
      mouse.smoothY += (height / 2 - mouse.smoothY) * 0.02;
    }
    return;
  }

  if (mouse.smoothX === null || mouse.smoothY === null) {
    mouse.smoothX = mouse.x;
    mouse.smoothY = mouse.y;
  } else {
    mouse.smoothX += (mouse.x - mouse.smoothX) * 0.12;
    mouse.smoothY += (mouse.y - mouse.smoothY) * 0.12;
  }
}

function animateBackground() {
  if (!ctx) return;

  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, width, height);

  updateMouseSmoothing();

  for (const orb of ambientOrbs) {
    orb.update();
    orb.draw();
  }

  for (const symbol of symbols) {
    symbol.update();
    symbol.draw();
  }

  drawMouseGlow();

  for (const particle of particles) {
    particle.update();
    particle.draw();
  }

  drawConnections();
  drawMouseConnections();

  requestAnimationFrame(animateBackground);
}

const titleElement = document.getElementById("animated-name");

function buildAnimatedName() {
  if (!titleElement) return [];

  const name = titleElement.dataset.name || "Neal Shandilya";
  titleElement.innerHTML = "";

  const letters = [...name].map((char, index) => {
    const span = document.createElement("span");
    span.className = "title-letter";
    span.textContent = char === " " ? "\u00A0" : char;
    span.dataset.index = index;

    if (char === " ") {
      span.classList.add("is-space");
    }

    titleElement.appendChild(span);
    return span;
  });

  return letters;
}

function triggerGoldLetterWaveOnce() {
  if (!titleElement) return;

  const allLetters = [...titleElement.querySelectorAll(".title-letter")];
  const activeLetters = allLetters.filter((letter) => !letter.classList.contains("is-space"));
  const middle = (activeLetters.length - 1) / 2;

  activeLetters.forEach((letter, visualIndex) => {
    const distanceFromCenter = Math.abs(visualIndex - middle);
    const delay = distanceFromCenter * 40;

    setTimeout(() => {
      letter.classList.remove("wave-gold");
      void letter.offsetWidth;
      letter.classList.add("wave-gold");

      setTimeout(() => {
        letter.classList.remove("wave-gold");
      }, 500);
    }, delay);
  });
}

function runNameIntro() {
  if (!titleElement) return;

  const letters = buildAnimatedName();
  const activeLetters = letters.filter((letter) => !letter.classList.contains("is-space"));
  const middle = (activeLetters.length - 1) / 2;
  let latestDelay = 0;

  activeLetters.forEach((letter, visualIndex) => {
    const distanceFromCenter = Math.abs(visualIndex - middle);
    const direction = visualIndex < middle ? -1 : 1;

    const startX = direction * (36 + distanceFromCenter * 12);
    const startY = -18 + distanceFromCenter * 4;
    const delay = 180 + distanceFromCenter * 110;
    latestDelay = Math.max(latestDelay, delay);

    letter.style.transform = `translate(${startX}px, ${startY}px) scale(0.9)`;
    letter.style.opacity = "0";

    setTimeout(() => {
      letter.classList.add("settled");
      letter.style.transform = "translate(0px, 0px) scale(1)";
      letter.style.opacity = "1";
    }, delay);
  });

  setTimeout(() => {
    triggerGoldLetterWaveOnce();
  }, latestDelay + 30);
}

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});

window.addEventListener("resize", () => {
  resizeCanvas();
});

resizeCanvas();
runNameIntro();
animateBackground();

/* PROOF MODAL */

const proofCards = document.querySelectorAll(".proof-card");
const proofModal = document.getElementById("proofModal");
const proofModalImg = document.getElementById("proofModalImg");
const proofModalTitle = document.getElementById("proofModalTitle");
const proofModalDesc = document.getElementById("proofModalDesc");
const proofModalClose = document.getElementById("proofModalClose");
const proofModalBackdrop = document.querySelector(".proof-modal-backdrop");

function openProofModal(card) {
  if (!proofModal || !proofModalImg || !proofModalTitle || !proofModalDesc) return;

  const img = card.dataset.img;
  const title = card.dataset.title;
  const desc = card.dataset.desc;

  proofModalImg.src = img;
  proofModalImg.alt = title;
  proofModalTitle.textContent = title;
  proofModalDesc.textContent = desc;

  proofModal.classList.add("active");
  proofModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeProofModal() {
  if (!proofModal) return;

  proofModal.classList.remove("active");
  proofModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

proofCards.forEach((card) => {
  card.addEventListener("click", () => openProofModal(card));
});

if (proofModalClose) {
  proofModalClose.addEventListener("click", closeProofModal);
}

if (proofModalBackdrop) {
  proofModalBackdrop.addEventListener("click", closeProofModal);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeProofModal();
  }
});

/* ===== INSPIRED 3D TILT CARDS ===== */

(function () {
  const tiltTargets = document.querySelectorAll(
    ".glass-card, .nav-wave-btn, .read-more-btn, .tac-card"
  );

  tiltTargets.forEach((card) => {
    if (card.classList.contains("proof-card")) return;

    card.classList.add("tilt-card");

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      const maxTilt = 8;
      const rx = (-dy / (rect.height / 2)) * maxTilt;
      const ry = (dx / (rect.width / 2)) * maxTilt;

      card.style.transform =
        `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;

      const px = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const py = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);

      card.style.setProperty("--mx", px + "%");
      card.style.setProperty("--my", py + "%");
      card.classList.add("tilt-active");

      card.style.boxShadow =
        "0 28px 60px rgba(0,0,0,0.10), 0 0 28px rgba(212,175,55,0.16)";
      card.style.borderColor = "rgba(212,175,55,0.30)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.boxShadow = "";
      card.style.borderColor = "";
      card.classList.remove("tilt-active");
    });
  });
})();