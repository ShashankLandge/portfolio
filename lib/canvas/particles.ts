import { PARTICLES, SHARK, isMobileViewport } from "./constants";
import type { Shark } from "./shark";

const TRAIL_AGE_NORMALIZER = SHARK.TRAIL_LIFE_TICKS;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
  size: number;
  opacity: number;
  noiseSeed: number;
  isAvoiding: boolean;
  isSpawning: boolean;
  isRemoving: boolean;
  fearTint: number;
};

/**
 * Dense, shape-holding fish school.
 *
 * - Initial positions are rejection-sampled inside a deformed ellipse, so the
 *   whole shape is filled (not a ring).
 * - A spatial hash grid drives O(1) neighbour queries for boid rules and
 *   reverse-queries for shark / trail avoidance.
 * - Soft containment keeps fish inside the breathing school shape; compression
 *   pulls them gently toward the school centroid, refilling voids after a
 *   shark passes and preventing any sub-flock from leaving the central region.
 */
export class ParticleSystem {
  canvasWidth: number;
  canvasHeight: number;
  cellSize: number;
  cellSizeInv: number;
  grid: Map<number, number[]>;
  particles: Particle[];
  shapePhase: number;
  particleCount: number;
  targetParticleCount: number;
  baseParticleCount: number;
  performanceScale: number;
  fpsSamples: number[];
  adaptiveCooldownFrames: number;
  particleChangeCooldown: number;
  fearColor: "red" | "green" | "blue";

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.cellSize = PARTICLES.GRID_CELL_SIZE;
    this.cellSizeInv = 1 / this.cellSize;
    this.grid = new Map();
    this.particles = [];
    this.shapePhase = 0;
    this.baseParticleCount = isMobileViewport()
      ? PARTICLES.COUNT_MOBILE
      : PARTICLES.COUNT_DESKTOP;
    this.particleCount = this.baseParticleCount;
    this.targetParticleCount = this.baseParticleCount;
    this.performanceScale = PARTICLES.MAX_PARTICLE_SCALE;
    this.fpsSamples = [];
    this.adaptiveCooldownFrames = 0;
    this.particleChangeCooldown = 0;
    this.fearColor = "red";
    this.init();
  }

  setFearColor(color: "red" | "green" | "blue"): void {
    this.fearColor = color;
  }

  spawnParticle(anchor?: Particle): Particle {
    const cx = this.canvasWidth / 2;
    const cy = this.canvasHeight / 2;
    const { rx, ry } = this.computeSchoolRadii();

    const initialSpeed = 0.3 + Math.random() * 0.3;
    const initialAngle = Math.random() * Math.PI * 2;
    let x: number;
    let y: number;
    let vx: number;
    let vy: number;

    if (anchor) {
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetRadius = Math.random() * 24 + 6;
      x = anchor.x + Math.cos(offsetAngle) * offsetRadius;
      y = anchor.y + Math.sin(offsetAngle) * offsetRadius;
      vx = anchor.vx + (Math.random() - 0.5) * 0.4;
      vy = anchor.vy + (Math.random() - 0.5) * 0.4;
      if (vx === 0 && vy === 0) {
        vx = Math.cos(initialAngle) * initialSpeed;
        vy = Math.sin(initialAngle) * initialSpeed;
      }
    } else {
      let dx: number;
      let dy: number;
      do {
        dx = (Math.random() * 2 - 1) * rx;
        dy = (Math.random() * 2 - 1) * ry;
      } while ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1);

      x = cx + dx;
      y = cy + dy;
      vx = Math.cos(initialAngle) * initialSpeed;
      vy = Math.sin(initialAngle) * initialSpeed;
    }

    x = Math.max(0, Math.min(this.canvasWidth, x));
    y = Math.max(0, Math.min(this.canvasHeight, y));

    const seed = this.particles.length * 13.37 + Math.random() * 100;
    return {
      x,
      y,
      vx,
      vy,
      fx: 0,
      fy: 0,
      size: Math.random() * 1.0 + 0.55,
      opacity: 0,
      noiseSeed: seed,
      isAvoiding: false,
      isSpawning: true,
      isRemoving: false,
      fearTint: 0,
    };
  }

  adjustParticleCount(desiredCount: number): void {
    this.targetParticleCount = desiredCount;

    const activeParticles = this.particles.filter((p) => !p.isRemoving);
    const activeCount = activeParticles.length;
    if (activeCount === desiredCount) {
      this.particleCount = this.particles.length;
      return;
    }

    if (this.particleChangeCooldown > 0) {
      this.particleChangeCooldown -= 1;
      return;
    }

    const delta = desiredCount - activeCount;
    const step = Math.sign(delta);
    this.particleChangeCooldown = PARTICLES.ADAPTIVE_PARTICLE_CHANGE_INTERVAL;

    if (step > 0) {
      const anchorSource = activeCount > 0 ? activeParticles : undefined;
      const anchor =
        anchorSource?.[Math.floor(Math.random() * anchorSource.length)];
      this.particles.push(this.spawnParticle(anchor));
    } else {
      const removable = activeParticles.slice();
      if (removable.length > 0) {
        const removeIndex = Math.floor(Math.random() * removable.length);
        const particle = removable.splice(removeIndex, 1)[0];
        particle.isRemoving = true;
        if (particle.opacity > 0.6) particle.opacity = 0.6;
      }
    }

    this.particleCount = this.particles.length;
  }

  adaptToPerformance(fps: number): void {
    if (fps <= 0) return;

    this.fpsSamples.push(fps);
    if (this.fpsSamples.length > PARTICLES.ADAPTIVE_FPS_RING_SIZE) {
      this.fpsSamples.shift();
    }

    if (this.adaptiveCooldownFrames > 0) {
      this.adaptiveCooldownFrames -= 1;
    }

    if (this.fpsSamples.length < PARTICLES.ADAPTIVE_FPS_MIN_SAMPLES) {
      return;
    }

    const sorted = [...this.fpsSamples].sort((a, b) => a - b);
    const trim = Math.floor(sorted.length * 0.15);
    const trimmed = sorted.slice(trim, sorted.length - trim);
    const meanFps =
      trimmed.reduce((sum, sample) => sum + sample, 0) / trimmed.length;

    if (this.adaptiveCooldownFrames <= 0) {
      if (meanFps < PARTICLES.ADAPTIVE_SUSTAINED_LOW) {
        this.performanceScale = Math.max(
          PARTICLES.MIN_PARTICLE_SCALE,
          this.performanceScale - PARTICLES.ADAPTIVE_SCALE_STEP_DOWN
        );
        this.adaptiveCooldownFrames = PARTICLES.ADAPTIVE_COOLDOWN_FRAMES;
        this.fpsSamples = [];
      } else if (meanFps > PARTICLES.ADAPTIVE_SUSTAINED_HIGH) {
        this.performanceScale = Math.min(
          PARTICLES.MAX_PARTICLE_SCALE,
          this.performanceScale + PARTICLES.ADAPTIVE_SCALE_STEP_UP
        );
        this.adaptiveCooldownFrames = PARTICLES.ADAPTIVE_COOLDOWN_FRAMES;
        this.fpsSamples = [];
      }
    }

    this.performanceScale = Math.min(
      PARTICLES.MAX_PARTICLE_SCALE,
      Math.max(PARTICLES.MIN_PARTICLE_SCALE, this.performanceScale)
    );

    const desiredCount = Math.max(
      40,
      Math.round(this.baseParticleCount * this.performanceScale)
    );
    this.adjustParticleCount(desiredCount);
  }

  init(): void {
    this.particles = [];
    const cx = this.canvasWidth / 2;
    const cy = this.canvasHeight / 2;
    const { rx, ry } = this.computeSchoolRadii();

    for (let i = 0; i < this.particleCount; i++) {
      // Rejection-sample inside the base ellipse so the whole shape is filled
      // from the very first frame — no spiral-in.
      let dx: number;
      let dy: number;
      do {
        dx = (Math.random() * 2 - 1) * rx;
        dy = (Math.random() * 2 - 1) * ry;
      } while ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1);

      // Small initial velocity so the school is alive from frame zero.
      const initialSpeed = 0.3 + Math.random() * 0.3;
      const initialAngle = Math.random() * Math.PI * 2;

      this.particles.push({
        x: cx + dx,
        y: cy + dy,
        vx: Math.cos(initialAngle) * initialSpeed,
        vy: Math.sin(initialAngle) * initialSpeed,
        fx: 0,
        fy: 0,
        size: Math.random() * 1.0 + 0.55,
        opacity: Math.random() * 0.2 + 0.78,
        noiseSeed: i * 13.37 + Math.random() * 100,
        isAvoiding: false,
        isRemoving: false,
        fearTint: 0,
      });
    }
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    const nextBaseCount = isMobileViewport()
      ? PARTICLES.COUNT_MOBILE
      : PARTICLES.COUNT_DESKTOP;
    if (nextBaseCount !== this.baseParticleCount) {
      this.baseParticleCount = nextBaseCount;
    }

    const desiredCount = Math.max(
      40,
      Math.round(this.baseParticleCount * this.performanceScale)
    );
    this.adjustParticleCount(desiredCount);
  }

  computeSchoolRadii(): { rx: number; ry: number } {
    const minDim = Math.min(this.canvasWidth, this.canvasHeight);
    return {
      rx: minDim * PARTICLES.SCHOOL_RADIUS_X_FACTOR,
      ry: minDim * PARTICLES.SCHOOL_RADIUS_Y_FACTOR,
    };
  }

  // Deformed-ellipse boundary radius at angle theta from the school centroid.
  // Three cosine harmonics on theta keep the shape organic (not a perfect
  // ellipse) and slowly breathing over time.
  shapeBoundary(theta: number, rx: number, ry: number, time: number): number {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const ellipseR = (rx * ry) / Math.sqrt(ry * ry * c * c + rx * rx * s * s);
    const deform =
      PARTICLES.SHAPE_DEFORM_A1 * Math.cos(2 * theta + time * 0.5) +
      PARTICLES.SHAPE_DEFORM_A2 * Math.cos(3 * theta + time * 0.3) +
      PARTICLES.SHAPE_DEFORM_A3 * Math.cos(5 * theta - time * 0.4);
    return ellipseR * (1 + deform);
  }

  // Pack (gx, gy) into a 32-bit-safe number key. Offsets keep negative coords
  // valid; 4096 supports canvases up to ~131k px per axis at 32px cells.
  packCell(gx: number, gy: number): number {
    return (gx + 2048) * 4096 + (gy + 2048);
  }

  rebuildGrid(): void {
    this.grid.clear();
    const inv = this.cellSizeInv;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const key = this.packCell(Math.floor(p.x * inv), Math.floor(p.y * inv));
      let cell = this.grid.get(key);
      if (!cell) {
        cell = [];
        this.grid.set(key, cell);
      }
      cell.push(i);
    }
  }

  update(activeSharks: Shark[]): void {
    this.shapePhase += PARTICLES.SHAPE_PHASE_INCREMENT;
    const phase = this.shapePhase;

    const { rx, ry } = this.computeSchoolRadii();
    const baseCx = this.canvasWidth / 2;
    const baseCy = this.canvasHeight / 2;
    const schoolCx =
      baseCx +
      Math.cos(phase * PARTICLES.SCHOOL_CENTER_DRIFT_FACTOR) *
        PARTICLES.SCHOOL_CENTER_DRIFT_X;
    const schoolCy =
      baseCy +
      Math.sin(phase * PARTICLES.SCHOOL_CENTER_DRIFT_FACTOR) *
        PARTICLES.SCHOOL_CENTER_DRIFT_Y;

    this.rebuildGrid();

    const particles = this.particles;
    const particleCount = particles.length;

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.fx = 0;
      p.fy = 0;
      p.isAvoiding = false;
    }

    // --- Shark avoidance: reverse-query the grid from shark head + trail ---
    const headRadius = PARTICLES.AVOIDANCE_RADIUS;
    const headRadiusSq = headRadius * headRadius;
    const trailRadius = PARTICLES.TRAIL_AVOIDANCE_RADIUS;
    const trailRadiusSq = trailRadius * trailRadius;
    const inv = this.cellSizeInv;
    const headSpan = Math.ceil(headRadius * inv);
    const trailSpan = Math.ceil(trailRadius * inv);
    const headForce = PARTICLES.AVOIDANCE_FORCE;
    const trailForce = PARTICLES.TRAIL_AVOIDANCE_FORCE;

    for (let s = 0; s < activeSharks.length; s++) {
      const shark = activeSharks[s];
      const sharkOpacity = shark.opacity;
      if (sharkOpacity <= 0) continue;

      this.applyAvoidanceFromPoint(
        shark.x,
        shark.y,
        headRadius,
        headRadiusSq,
        headSpan,
        headForce * sharkOpacity
      );

      const trail = shark.trail;
      for (let t = 0; t < trail.length; t++) {
        const sample = trail[t];
        const life = 1 - sample.age / TRAIL_AGE_NORMALIZER;
        if (life <= 0) continue;
        this.applyAvoidanceFromPoint(
          sample.x,
          sample.y,
          trailRadius,
          trailRadiusSq,
          trailSpan,
          trailForce * sharkOpacity * life
        );
      }
    }

    // --- Boid + containment + integration ---
    const cohesionRadiusSq =
      PARTICLES.COHESION_RADIUS * PARTICLES.COHESION_RADIUS;
    const separationRadius = PARTICLES.SEPARATION_RADIUS;
    const separationRadiusSq = separationRadius * separationRadius;
    const alignmentRadiusSq =
      PARTICLES.ALIGNMENT_RADIUS * PARTICLES.ALIGNMENT_RADIUS;
    const neighborSpan = Math.ceil(
      Math.max(
        PARTICLES.COHESION_RADIUS,
        PARTICLES.ALIGNMENT_RADIUS,
        PARTICLES.SEPARATION_RADIUS
      ) * inv
    );

    const cohesionFactor = PARTICLES.COHESION_FACTOR;
    const separationFactor = PARTICLES.SEPARATION_FACTOR;
    const alignmentFactor = PARTICLES.ALIGNMENT_FACTOR;
    const containmentFactor = PARTICLES.CONTAINMENT_FACTOR;
    const softBand = PARTICLES.CONTAINMENT_SOFT_BAND;
    const compressionFactor = PARTICLES.COMPRESSION_FACTOR;
    const compressionDeadzoneSq = Math.pow(
      ((rx + ry) / 2) * PARTICLES.COMPRESSION_INNER_DEADZONE,
      2
    );
    const wanderFactor = PARTICLES.WANDER_NOISE_FACTOR;
    const wanderScale = PARTICLES.WANDER_NOISE_SCALE;
    const damping = PARTICLES.DAMPING;
    const maxSpeed = PARTICLES.MAX_SPEED;
    const maxSpeedSq = maxSpeed * maxSpeed;
    const minIdleOpacity = PARTICLES.MIN_OPACITY_IDLE;
    const fadeIn = PARTICLES.OPACITY_FADE_RATE_IN;
    const fadeOut = PARTICLES.OPACITY_FADE_RATE_OUT;
    const noiseTime = phase * 0.6;

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      if (p.isRemoving) {
        p.opacity = Math.max(0, p.opacity - PARTICLES.PARTICLE_REMOVE_FADE_RATE);
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = this.canvasWidth;
        else if (p.x > this.canvasWidth) p.x = 0;
        if (p.y < 0) p.y = this.canvasHeight;
        else if (p.y > this.canvasHeight) p.y = 0;
        continue;
      }

      // Boid neighbour walk over a (2*span+1)² grid window.
      //
      // Void-filling cohesion: sum unit vectors *away from* each neighbour.
      // Isotropic neighbourhoods (well-mixed bulk) sum to ~0 → no force.
      // Anisotropic neighbourhoods (next to a void) sum into a vector pointing
      // toward the void → fish slide in and fill it. This is what stops the
      // school from collapsing into a ring around the shark's wake.
      let voidX = 0;
      let voidY = 0;
      let cohCount = 0;
      let sepX = 0;
      let sepY = 0;
      let aliVx = 0;
      let aliVy = 0;
      let aliCount = 0;

      const gx = Math.floor(p.x * inv);
      const gy = Math.floor(p.y * inv);

      for (let dx = -neighborSpan; dx <= neighborSpan; dx++) {
        for (let dy = -neighborSpan; dy <= neighborSpan; dy++) {
          const cell = this.grid.get(this.packCell(gx + dx, gy + dy));
          if (!cell) continue;
          for (let k = 0; k < cell.length; k++) {
            const j = cell[k];
            if (j === i) continue;
            const q = particles[j];
            const ddx = q.x - p.x;
            const ddy = q.y - p.y;
            const dSq = ddx * ddx + ddy * ddy;

            if (dSq < cohesionRadiusSq && dSq > 0.0001) {
              const d = Math.sqrt(dSq);
              voidX -= ddx / d;
              voidY -= ddy / d;
              cohCount += 1;
            }
            if (dSq < alignmentRadiusSq) {
              aliVx += q.vx;
              aliVy += q.vy;
              aliCount += 1;
            }
            if (dSq < separationRadiusSq && dSq > 0.0001) {
              const d = Math.sqrt(dSq);
              const push = separationRadius - d;
              sepX -= (ddx / d) * push;
              sepY -= (ddy / d) * push;
            }
          }
        }
      }

      if (cohCount > 0) {
        p.fx += (voidX / cohCount) * cohesionFactor;
        p.fy += (voidY / cohCount) * cohesionFactor;
      }
      if (aliCount > 0) {
        p.fx += (aliVx / aliCount - p.vx) * alignmentFactor;
        p.fy += (aliVy / aliCount - p.vy) * alignmentFactor;
      }
      p.fx += sepX * separationFactor;
      p.fy += sepY * separationFactor;

      // Compression: gentle pull toward school center outside a deadzone.
      const cdx = p.x - schoolCx;
      const cdy = p.y - schoolCy;
      const cDistSq = cdx * cdx + cdy * cdy;
      if (cDistSq > compressionDeadzoneSq) {
        p.fx -= cdx * compressionFactor;
        p.fy -= cdy * compressionFactor;
      }

      // Soft containment to the deforming school boundary
      if (cDistSq > 1) {
        const cDist = Math.sqrt(cDistSq);
        const theta = Math.atan2(cdy, cdx);
        const boundary = this.shapeBoundary(theta, rx, ry, phase);
        const overshoot = cDist - (boundary - softBand);
        if (overshoot > 0) {
          let mag: number;
          if (overshoot < softBand) {
            const t = overshoot / softBand;
            mag = t * t * softBand;
          } else {
            const past = overshoot - softBand;
            mag = softBand + past * 1.5 + past * past * 0.05;
          }
          const force = mag * containmentFactor;
          p.fx -= (cdx / cDist) * force;
          p.fy -= (cdy / cDist) * force;
        }
      }

      // Wander — low-freq noise so motion never freezes
      const wanderAngle =
        Math.sin(noiseTime + p.noiseSeed) *
        Math.cos(p.x * wanderScale + p.noiseSeed) *
        Math.PI;
      p.fx += Math.cos(wanderAngle) * wanderFactor;
      p.fy += Math.sin(wanderAngle) * wanderFactor;

      // Integrate
      let vx = (p.vx + p.fx) * damping;
      let vy = (p.vy + p.fy) * damping;

      const speedSq = vx * vx + vy * vy;
      if (speedSq > maxSpeedSq) {
        const scale = maxSpeed / Math.sqrt(speedSq);
        vx *= scale;
        vy *= scale;
      }

      p.vx = vx;
      p.vy = vy;
      p.x += vx;
      p.y += vy;

      // Edge wrap as a safety net — containment normally keeps fish in.
      if (p.x < 0) p.x = this.canvasWidth;
      else if (p.x > this.canvasWidth) p.x = 0;
      if (p.y < 0) p.y = this.canvasHeight;
      else if (p.y > this.canvasHeight) p.y = 0;

      if (p.isAvoiding) {
        if (p.opacity < 1) p.opacity = Math.min(1, p.opacity + fadeIn);
        p.fearTint = Math.min(1, p.fearTint + PARTICLES.FEAR_TINT_RATE_IN);
      } else {
        if (p.isSpawning) {
          p.opacity = Math.min(minIdleOpacity, p.opacity + fadeIn * 3);
          if (p.opacity >= minIdleOpacity) {
            p.isSpawning = false;
          }
        } else if (p.opacity > minIdleOpacity) {
          p.opacity = Math.max(minIdleOpacity, p.opacity - fadeOut);
        }
        if (p.fearTint > 0) {
          p.fearTint = Math.max(0, p.fearTint - PARTICLES.FEAR_TINT_RATE_OUT);
        }
      }
    }

    this.particles = this.particles.filter(
      (p) => !p.isRemoving || p.opacity > 0.001
    );
  }

  // Iterate the grid window around (sx, sy) and apply a repulsive force on
  // each particle inside `radius`. Force ramps quadratically with closeness
  // and is multiplied by the caller-provided `forceScale` (sharkOpacity × life).
  applyAvoidanceFromPoint(
    sx: number,
    sy: number,
    radius: number,
    radiusSq: number,
    span: number,
    forceScale: number
  ): void {
    if (forceScale <= 0) return;
    const inv = this.cellSizeInv;
    const gx = Math.floor(sx * inv);
    const gy = Math.floor(sy * inv);
    const particles = this.particles;

    for (let dx = -span; dx <= span; dx++) {
      for (let dy = -span; dy <= span; dy++) {
        const cell = this.grid.get(this.packCell(gx + dx, gy + dy));
        if (!cell) continue;
        for (let k = 0; k < cell.length; k++) {
          const idx = cell[k];
          const p = particles[idx];
          const ddx = p.x - sx;
          const ddy = p.y - sy;
          const dSq = ddx * ddx + ddy * ddy;
          if (dSq >= radiusSq || dSq < 0.0001) continue;
          const d = Math.sqrt(dSq);
          const ratio = (radius - d) / radius;
          const strength = ratio * ratio * forceScale;
          p.fx += (ddx / d) * strength;
          p.fy += (ddy / d) * strength;
          p.isAvoiding = true;
        }
      }
    }
  }

  // Manual rotation in JS avoids per-particle ctx.save/restore + transform
  // stack pushes which dominate draw cost at ~1000 particles × 60fps.
  draw(ctx: CanvasRenderingContext2D, scaleFactor: number): void {
    ctx.lineWidth = PARTICLES.STROKE_WIDTH;

    const particles = this.particles;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = p.opacity;

      // Fear hue: white → vivid red as fearTint ramps up.
      // R stays 255; G drops 255→45, B drops 255→35 for a striking signal red.
      if (p.fearTint > 0.004) {
        const t = p.fearTint;
        const r = this.fearColor === "red" ? 255 : (255 - 210 * t) | 0;
        const g = this.fearColor === "green" ? 255 : (255 - 210 * t) | 0;
        const b = this.fearColor === "blue" ? 255 : (255 - 220 * t) | 0;
        ctx.strokeStyle = `rgba(${r},${g},${b},0.92)`;
      } else {
        ctx.strokeStyle = PARTICLES.STROKE_STYLE;
      }

      const heading = Math.atan2(p.vy, p.vx);
      const cosH = Math.cos(heading);
      const sinH = Math.sin(heading);
      const s = p.size * scaleFactor;
      const halfBack = -s * 0.5;
      const finBack = -s;
      const bodyHalfWidth = s * 0.3;
      const finHalfWidth = s * 0.2;

      const bx0 = p.x + cosH * s;
      const by0 = p.y + sinH * s;
      const bx1 = p.x + cosH * halfBack + sinH * bodyHalfWidth;
      const by1 = p.y + sinH * halfBack - cosH * bodyHalfWidth;
      const bx2 = p.x + cosH * halfBack - sinH * bodyHalfWidth;
      const by2 = p.y + sinH * halfBack + cosH * bodyHalfWidth;

      const tx0 = p.x + cosH * halfBack;
      const ty0 = p.y + sinH * halfBack;
      const tx1 = p.x + cosH * finBack + sinH * finHalfWidth;
      const ty1 = p.y + sinH * finBack - cosH * finHalfWidth;
      const tx2 = p.x + cosH * finBack - sinH * finHalfWidth;
      const ty2 = p.y + sinH * finBack + cosH * finHalfWidth;

      ctx.beginPath();
      ctx.moveTo(bx0, by0);
      ctx.lineTo(bx1, by1);
      ctx.lineTo(bx2, by2);
      ctx.closePath();
      ctx.moveTo(tx0, ty0);
      ctx.lineTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}
