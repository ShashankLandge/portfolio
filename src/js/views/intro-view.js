import { INTRO } from "../lib/constants.js";

const SKILL_FLICKER_INTERVAL_MS = 220;

function createIntroParticles(width, height) {
  const particles = [];
  for (let i = 0; i < INTRO.PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1 + 0.2,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.3 + 0.1,
    });
  }
  return particles;
}

function drawIntroParticles(ctx, particles, width, height, fadeFactor) {
  ctx.clearRect(0, 0, width, height);
  for (const particle of particles) {
    ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha * fadeFactor})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();

    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class IntroView {
  constructor({
    container,
    canvas,
    nameElement,
    wordElement,
    onExitStart,
    onComplete,
  }) {
    this.container = container;
    this.canvas = canvas;
    this.nameElement = nameElement;
    this.wordElement = wordElement;
    this.onExitStart = onExitStart;
    this.onComplete = onComplete;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.skillIndex = 0;
    this.skillTimerId = null;
    this.startTime = 0;
    this.animationFrameId = null;
    this.completed = false;
    this.exitStartFired = false;
  }

  run() {
    this.sizeCanvas();
    this.particles = createIntroParticles(this.canvas.width, this.canvas.height);
    this.cycleSkillWord();
    this.skillTimerId = window.setInterval(
      () => this.cycleSkillWord(),
      SKILL_FLICKER_INTERVAL_MS
    );
    this.startTime = performance.now();
    this.tick();
  }

  sizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  cycleSkillWord() {
    const word = INTRO.SKILLS[this.skillIndex];
    this.wordElement.textContent = word;
    this.skillIndex = (this.skillIndex + 1) % INTRO.SKILLS.length;
  }

  tick = () => {
    const elapsedMs = performance.now() - this.startTime;
    const elapsedSec = elapsedMs / 1000;

    const nameRevealProgress = Math.min(1, Math.max(0, (elapsedSec - 1) / 2));
    const wordFadeProgress = Math.min(1, Math.max(0, (elapsedSec - 3) / 2));
    const exitProgress = Math.min(1, Math.max(0, (elapsedSec - 5) / 1.5));

    const nameOpacity = easeOutCubic(nameRevealProgress);
    const nameScale = 1 + (1 - easeOutCubic(nameRevealProgress)) * 0.1;
    const nameBlur = (1 - easeOutCubic(nameRevealProgress)) * 2;

    this.nameElement.style.opacity = nameOpacity.toString();
    this.nameElement.style.transform = `scale(${nameScale}) translateZ(0)`;
    this.nameElement.style.filter = `blur(${nameBlur}px)`;

    const wordOpacity = 1 - easeOutCubic(wordFadeProgress);
    const wordScale = 1 - wordFadeProgress * 0.1;
    const wordBlur = wordFadeProgress * 2;
    this.wordElement.style.opacity = wordOpacity.toString();
    this.wordElement.style.transform = `translateY(80px) scale(${wordScale}) translateZ(0)`;
    this.wordElement.style.filter = `blur(${wordBlur}px)`;

    if (wordFadeProgress >= 1 && this.skillTimerId !== null) {
      window.clearInterval(this.skillTimerId);
      this.skillTimerId = null;
    }

    if (exitProgress > 0 && !this.exitStartFired) {
      this.exitStartFired = true;
      if (typeof this.onExitStart === "function") {
        this.onExitStart();
      }
    }

    const containerOpacity = 1 - easeInOutCubic(exitProgress);
    const containerScale = 1 + exitProgress * 0.05;
    this.container.style.opacity = containerOpacity.toString();
    this.container.style.transform = `scale(${containerScale})`;

    const particleFade = 1 - Math.min(1, Math.max(0, (elapsedSec - 2) / 4));
    drawIntroParticles(
      this.ctx,
      this.particles,
      this.canvas.width,
      this.canvas.height,
      particleFade
    );

    if (exitProgress >= 1 && !this.completed) {
      this.completed = true;
      this.cleanup();
      this.onComplete();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.skillTimerId !== null) {
      window.clearInterval(this.skillTimerId);
      this.skillTimerId = null;
    }
    this.container.style.display = "none";
  }
}
