import { PARTICLES, isMobileViewport } from "./constants.js";

export class ParticleSystem {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.particles = [];
    this.globalSchoolAngle = 0;
    this.particleCount = isMobileViewport()
      ? PARTICLES.COUNT_MOBILE
      : PARTICLES.COUNT_DESKTOP;
    this.init();
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    return {
      x: Math.random() * this.canvasWidth,
      y: Math.random() * this.canvasHeight,
      vx: 0,
      vy: 0,
      size: Math.random() * 1.8 + 0.8,
      opacity: Math.random() * 0.5 + 0.4,
      avoidanceX: 0,
      avoidanceY: 0,
      schoolRadius: Math.random() * 200 + 150,
      isAvoiding: false,
    };
  }

  resize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    const newCount = isMobileViewport()
      ? PARTICLES.COUNT_MOBILE
      : PARTICLES.COUNT_DESKTOP;
    if (newCount !== this.particleCount) {
      this.particleCount = newCount;
      this.init();
    }
  }

  update(activeSharks) {
    this.globalSchoolAngle += PARTICLES.SCHOOL_ANGLE_INCREMENT;

    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const schoolCenterX =
      centerX +
      Math.cos(this.globalSchoolAngle * PARTICLES.SCHOOL_CENTER_DRIFT_FACTOR) *
        PARTICLES.SCHOOL_CENTER_RADIUS_X;
    const schoolCenterY =
      centerY +
      Math.sin(this.globalSchoolAngle * PARTICLES.SCHOOL_CENTER_DRIFT_FACTOR) *
        PARTICLES.SCHOOL_CENTER_RADIUS_Y;
    const avoidanceRadiusSquared =
      PARTICLES.AVOIDANCE_RADIUS * PARTICLES.AVOIDANCE_RADIUS;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      let totalAvoidanceX = 0;
      let totalAvoidanceY = 0;
      let isAvoiding = false;

      for (let s = 0; s < activeSharks.length; s++) {
        const shark = activeSharks[s];
        if (shark.opacity <= 0) continue;

        const dx = particle.x - shark.x;
        const dy = particle.y - shark.y;
        const distSquared = dx * dx + dy * dy;

        if (distSquared < avoidanceRadiusSquared && distSquared > 0) {
          isAvoiding = true;
          const distance = Math.sqrt(distSquared);
          const ratio =
            (PARTICLES.AVOIDANCE_RADIUS - distance) / PARTICLES.AVOIDANCE_RADIUS;
          const strength = ratio * ratio * shark.opacity;
          totalAvoidanceX += (dx / distance) * strength * PARTICLES.AVOIDANCE_FORCE;
          totalAvoidanceY += (dy / distance) * strength * PARTICLES.AVOIDANCE_FORCE;
        }
      }

      particle.isAvoiding = isAvoiding;
      particle.avoidanceX = totalAvoidanceX;
      particle.avoidanceY = totalAvoidanceY;

      if (!particle.isAvoiding) {
        const schoolAngle =
          this.globalSchoolAngle + (i / this.particleCount) * Math.PI * 2;
        const targetX =
          schoolCenterX + Math.cos(schoolAngle) * particle.schoolRadius;
        const targetY =
          schoolCenterY + Math.sin(schoolAngle) * particle.schoolRadius * 0.6;

        particle.vx += (targetX - particle.x) * PARTICLES.SCHOOL_FORCE_FACTOR;
        particle.vy += (targetY - particle.y) * PARTICLES.SCHOOL_FORCE_FACTOR;
      }

      particle.vx += particle.avoidanceX * PARTICLES.AVOIDANCE_FACTOR;
      particle.vy += particle.avoidanceY * PARTICLES.AVOIDANCE_FACTOR;

      particle.vx *= PARTICLES.DAMPING;
      particle.vy *= PARTICLES.DAMPING;

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0) particle.x = this.canvasWidth;
      else if (particle.x > this.canvasWidth) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvasHeight;
      else if (particle.y > this.canvasHeight) particle.y = 0;

      if (particle.isAvoiding) {
        particle.opacity = Math.min(
          1,
          particle.opacity + PARTICLES.OPACITY_FADE_RATE_IN
        );
      } else {
        particle.opacity = Math.max(
          PARTICLES.MIN_OPACITY_IDLE,
          particle.opacity - PARTICLES.OPACITY_FADE_RATE_OUT
        );
      }
    }
  }

  draw(ctx, scaleFactor) {
    ctx.strokeStyle = PARTICLES.STROKE_STYLE;
    ctx.lineWidth = PARTICLES.STROKE_WIDTH;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.scale(scaleFactor, scaleFactor);

      const angle = Math.atan2(particle.vy, particle.vx);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(particle.size, 0);
      ctx.lineTo(-particle.size * 0.5, -particle.size * 0.3);
      ctx.lineTo(-particle.size * 0.5, particle.size * 0.3);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-particle.size * 0.5, 0);
      ctx.lineTo(-particle.size, -particle.size * 0.2);
      ctx.lineTo(-particle.size, particle.size * 0.2);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }
  }
}
