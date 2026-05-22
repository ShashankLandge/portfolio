import { PARTICLES, SHARK, isMobileViewport } from "./constants.js";

const TRAIL_AGE_NORMALIZER = SHARK.TRAIL_LIFE_TICKS;

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
    for (let particleIndex = 0; particleIndex < this.particleCount; particleIndex++) {
      this.particles.push(this.createParticle(particleIndex));
    }
  }

  createParticle(particleIndex) {
    return {
      x: Math.random() * this.canvasWidth,
      y: Math.random() * this.canvasHeight,
      vx: 0,
      vy: 0,
      size: Math.random() * 1.6 + 0.7,
      opacity: Math.random() * 0.5 + 0.4,
      schoolRadius: Math.random() * 200 + 150,
      noiseSeed: particleIndex * 13.37 + Math.random() * 100,
      isAvoiding: false,
    };
  }

  resize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    const desiredCount = isMobileViewport()
      ? PARTICLES.COUNT_MOBILE
      : PARTICLES.COUNT_DESKTOP;
    if (desiredCount !== this.particleCount) {
      this.particleCount = desiredCount;
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

    const headAvoidanceRadiusSq =
      PARTICLES.AVOIDANCE_RADIUS * PARTICLES.AVOIDANCE_RADIUS;
    const trailAvoidanceRadiusSq =
      PARTICLES.TRAIL_AVOIDANCE_RADIUS * PARTICLES.TRAIL_AVOIDANCE_RADIUS;
    const maxSpeedSq = PARTICLES.MAX_SPEED * PARTICLES.MAX_SPEED;

    const noiseTime = this.globalSchoolAngle * 0.6;

    for (let particleIndex = 0; particleIndex < this.particles.length; particleIndex++) {
      const particle = this.particles[particleIndex];

      let avoidanceForceX = 0;
      let avoidanceForceY = 0;
      let isAvoiding = false;

      for (let sharkIndex = 0; sharkIndex < activeSharks.length; sharkIndex++) {
        const shark = activeSharks[sharkIndex];
        if (shark.opacity <= 0) continue;

        const dxHead = particle.x - shark.x;
        const dyHead = particle.y - shark.y;
        const headDistSq = dxHead * dxHead + dyHead * dyHead;

        if (headDistSq < headAvoidanceRadiusSq && headDistSq > 0.001) {
          isAvoiding = true;
          const headDistance = Math.sqrt(headDistSq);
          const headRatio =
            (PARTICLES.AVOIDANCE_RADIUS - headDistance) / PARTICLES.AVOIDANCE_RADIUS;
          const headStrength = headRatio * headRatio * shark.opacity;
          avoidanceForceX +=
            (dxHead / headDistance) * headStrength * PARTICLES.AVOIDANCE_FORCE;
          avoidanceForceY +=
            (dyHead / headDistance) * headStrength * PARTICLES.AVOIDANCE_FORCE;
        }

        const trail = shark.trail;
        for (let trailIndex = 0; trailIndex < trail.length; trailIndex++) {
          const sample = trail[trailIndex];
          const dxTrail = particle.x - sample.x;
          const dyTrail = particle.y - sample.y;
          const trailDistSq = dxTrail * dxTrail + dyTrail * dyTrail;

          if (trailDistSq >= trailAvoidanceRadiusSq || trailDistSq < 0.001) continue;

          const trailDistance = Math.sqrt(trailDistSq);
          const lifeRemaining = 1 - sample.age / TRAIL_AGE_NORMALIZER;
          const trailRatio =
            (PARTICLES.TRAIL_AVOIDANCE_RADIUS - trailDistance) /
            PARTICLES.TRAIL_AVOIDANCE_RADIUS;
          const trailStrength =
            trailRatio * trailRatio * lifeRemaining * shark.opacity;
          if (trailStrength <= 0) continue;
          isAvoiding = true;
          avoidanceForceX +=
            (dxTrail / trailDistance) * trailStrength * PARTICLES.TRAIL_AVOIDANCE_FORCE;
          avoidanceForceY +=
            (dyTrail / trailDistance) * trailStrength * PARTICLES.TRAIL_AVOIDANCE_FORCE;
        }
      }

      particle.isAvoiding = isAvoiding;

      if (!isAvoiding) {
        const schoolAngle =
          this.globalSchoolAngle + (particleIndex / this.particleCount) * Math.PI * 2;
        const schoolTargetX =
          schoolCenterX + Math.cos(schoolAngle) * particle.schoolRadius;
        const schoolTargetY =
          schoolCenterY + Math.sin(schoolAngle) * particle.schoolRadius * 0.6;

        particle.vx += (schoolTargetX - particle.x) * PARTICLES.SCHOOL_FORCE_FACTOR;
        particle.vy += (schoolTargetY - particle.y) * PARTICLES.SCHOOL_FORCE_FACTOR;

        const wanderAngle =
          Math.sin(noiseTime + particle.noiseSeed) *
            Math.cos(particle.x * PARTICLES.WANDER_NOISE_SCALE + particle.noiseSeed) *
            Math.PI;
        particle.vx += Math.cos(wanderAngle) * PARTICLES.WANDER_NOISE_FACTOR;
        particle.vy += Math.sin(wanderAngle) * PARTICLES.WANDER_NOISE_FACTOR;
      }

      particle.vx += avoidanceForceX * PARTICLES.AVOIDANCE_FACTOR;
      particle.vy += avoidanceForceY * PARTICLES.AVOIDANCE_FACTOR;

      particle.vx *= PARTICLES.DAMPING;
      particle.vy *= PARTICLES.DAMPING;

      const speedSq = particle.vx * particle.vx + particle.vy * particle.vy;
      if (speedSq > maxSpeedSq) {
        const speedScale = PARTICLES.MAX_SPEED / Math.sqrt(speedSq);
        particle.vx *= speedScale;
        particle.vy *= speedScale;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0) particle.x = this.canvasWidth;
      else if (particle.x > this.canvasWidth) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvasHeight;
      else if (particle.y > this.canvasHeight) particle.y = 0;

      if (isAvoiding) {
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

    this.applyAlignment();
  }

  applyAlignment() {
    const alignmentRadiusSq =
      PARTICLES.ALIGNMENT_RADIUS * PARTICLES.ALIGNMENT_RADIUS;

    for (let particleIndex = 0; particleIndex < this.particles.length; particleIndex++) {
      const particle = this.particles[particleIndex];
      if (particle.isAvoiding) continue;

      let neighborSumVx = 0;
      let neighborSumVy = 0;
      let neighborCount = 0;

      const neighborWindow = 8;
      const start = Math.max(0, particleIndex - neighborWindow);
      const end = Math.min(this.particles.length, particleIndex + neighborWindow);

      for (let neighborIndex = start; neighborIndex < end; neighborIndex++) {
        if (neighborIndex === particleIndex) continue;
        const neighbor = this.particles[neighborIndex];
        const dx = neighbor.x - particle.x;
        const dy = neighbor.y - particle.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < alignmentRadiusSq) {
          neighborSumVx += neighbor.vx;
          neighborSumVy += neighbor.vy;
          neighborCount += 1;
        }
      }

      if (neighborCount > 0) {
        const averageVx = neighborSumVx / neighborCount;
        const averageVy = neighborSumVy / neighborCount;
        particle.vx += (averageVx - particle.vx) * PARTICLES.ALIGNMENT_FACTOR;
        particle.vy += (averageVy - particle.vy) * PARTICLES.ALIGNMENT_FACTOR;
      }
    }
  }

  draw(ctx, scaleFactor) {
    ctx.strokeStyle = PARTICLES.STROKE_STYLE;
    ctx.lineWidth = PARTICLES.STROKE_WIDTH;

    for (let particleIndex = 0; particleIndex < this.particles.length; particleIndex++) {
      const particle = this.particles[particleIndex];

      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.translate(particle.x, particle.y);
      ctx.scale(scaleFactor, scaleFactor);

      const heading = Math.atan2(particle.vy, particle.vx);
      ctx.rotate(heading);

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
