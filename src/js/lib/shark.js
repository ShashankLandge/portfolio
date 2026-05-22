import { SHARK, SHARK_TYPE, BEZIER } from "./constants.js";
import { generateBezierPath, bezierPoint, normalizeAngle } from "./bezier.js";

export class Shark {
  constructor({ type, x, y, scaleFactor, initialOpacity = 1 }) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.targetX = x;
    this.targetY = y;
    this.time = 0;
    this.idleT = 0;
    this.pathQueue = [];
    this.currentCurve = null;
    this.bodySegments = [];
    this.opacity = initialOpacity;
    this.targetOpacity = 1;
    this.trail = [];
    this.ticksSinceTrailSample = 0;
    this.initBodySegments(scaleFactor);
  }

  initBodySegments(scaleFactor) {
    this.bodySegments = [];
    for (let i = 0; i < SHARK.BODY_SEGMENT_COUNT; i++) {
      this.bodySegments.push({
        x: this.x - i * SHARK.SEGMENT_DISTANCE * scaleFactor,
        y: this.y,
        angle: 0,
      });
    }
  }

  enqueueBezierPaths(canvasWidth, canvasHeight, count = BEZIER.INITIAL_QUEUE_COUNT, startPoint = null) {
    let cursor = startPoint || { x: this.x, y: this.y };
    for (let i = 0; i < count; i++) {
      const nextPath = generateBezierPath(cursor, canvasWidth, canvasHeight);
      this.pathQueue.push(nextPath);
      cursor = nextPath.p4;
    }
  }

  resetPaths(canvasWidth, canvasHeight) {
    this.pathQueue = [];
    this.currentCurve = null;
    this.idleT = 0;
    this.enqueueBezierPaths(canvasWidth, canvasHeight, BEZIER.INITIAL_QUEUE_COUNT, {
      x: this.x,
      y: this.y,
    });
  }

  update({ mouse, isDragging, canvasWidth, canvasHeight, scaleFactor }) {
    this.time += 1;

    if (isDragging) {
      this.followMouse(mouse);
    } else {
      this.followBezierPath(canvasWidth, canvasHeight);
    }

    this.updateHeadAngle();
    this.updateBodySegments(scaleFactor, isDragging);
    this.updateTrail();
  }

  followMouse(mouse) {
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > 1) {
      const dist = Math.sqrt(distSq);
      const followSpeed = Math.min(
        dist * SHARK.FOLLOW_SPEED_MULTIPLIER,
        SHARK.FOLLOW_SPEED_MAX
      );
      this.x += (dx / dist) * followSpeed;
      this.y += (dy / dist) * followSpeed;
    }

    this.targetX = mouse.x;
    this.targetY = mouse.y;
  }

  followBezierPath(canvasWidth, canvasHeight) {
    if (this.pathQueue.length < BEZIER.PATH_QUEUE_MIN) {
      this.enqueueBezierPaths(canvasWidth, canvasHeight, BEZIER.PATH_QUEUE_REFILL_COUNT);
    }

    if (!this.currentCurve) {
      this.currentCurve = this.pathQueue.shift();
    }

    this.idleT += SHARK.BEZIER_T_INCREMENT;

    if (this.idleT >= 1) {
      this.idleT = 0;
      this.currentCurve = this.pathQueue.shift();
    }

    const currentPos = bezierPoint(
      this.idleT,
      this.currentCurve.p1,
      this.currentCurve.p2,
      this.currentCurve.p3,
      this.currentCurve.p4
    );

    this.x += (currentPos.x - this.x) * SHARK.BEZIER_LERP_FACTOR;
    this.y += (currentPos.y - this.y) * SHARK.BEZIER_LERP_FACTOR;
    this.targetX = currentPos.x;
    this.targetY = currentPos.y;
  }

  updateHeadAngle() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      const targetAngle = Math.atan2(dy, dx);
      const angleDiff = normalizeAngle(targetAngle - this.angle);
      this.angle += angleDiff * SHARK.ANGLE_LERP_FACTOR;
    }
  }

  updateBodySegments(scaleFactor, isDragging) {
    const segmentDistance = SHARK.SEGMENT_DISTANCE * scaleFactor;
    const baseAmplitude =
      (isDragging ? SHARK.WAVE_AMPLITUDE_DRAGGING : SHARK.WAVE_AMPLITUDE_IDLE) *
      scaleFactor;
    const lastIndex = this.bodySegments.length - 1;

    this.bodySegments[0].x = this.x;
    this.bodySegments[0].y = this.y;
    this.bodySegments[0].angle = this.angle;

    for (let i = 1; i < this.bodySegments.length; i++) {
      const previousSegment = this.bodySegments[i - 1];
      const currentSegment = this.bodySegments[i];

      const baseX =
        previousSegment.x - Math.cos(previousSegment.angle) * segmentDistance;
      const baseY =
        previousSegment.y - Math.sin(previousSegment.angle) * segmentDistance;

      const tailRamp = i / lastIndex;
      const segmentAmplitude = baseAmplitude * (0.3 + 0.7 * tailRamp);
      const waveOffset =
        Math.sin(this.time * SHARK.WAVE_FREQUENCY + i * 0.8) * segmentAmplitude;
      const perpendicularAngle = previousSegment.angle + Math.PI / 2;

      const targetX = baseX + Math.cos(perpendicularAngle) * waveOffset;
      const targetY = baseY + Math.sin(perpendicularAngle) * waveOffset;

      currentSegment.x += (targetX - currentSegment.x) * SHARK.SEGMENT_LERP_FACTOR;
      currentSegment.y += (targetY - currentSegment.y) * SHARK.SEGMENT_LERP_FACTOR;

      const segmentTargetAngle = Math.atan2(
        previousSegment.y - currentSegment.y,
        previousSegment.x - currentSegment.x
      );
      const segmentAngleDiff = normalizeAngle(
        segmentTargetAngle - currentSegment.angle
      );
      currentSegment.angle += segmentAngleDiff * SHARK.SEGMENT_ANGLE_LERP_FACTOR;
    }
  }

  updateTrail() {
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const sample = this.trail[i];
      sample.age += 1;
      if (sample.age >= SHARK.TRAIL_LIFE_TICKS) {
        this.trail.splice(i, 1);
      }
    }

    this.ticksSinceTrailSample += 1;
    if (this.ticksSinceTrailSample >= SHARK.TRAIL_SAMPLE_INTERVAL) {
      this.ticksSinceTrailSample = 0;
      this.trail.push({ x: this.x, y: this.y, age: 0 });
      if (this.trail.length > SHARK.TRAIL_MAX_SAMPLES) {
        this.trail.shift();
      }
    }
  }

  draw(ctx, scaleFactor) {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.strokeStyle = SHARK.COLOR;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    this.drawHead(ctx, scaleFactor);
    this.drawBodyLine(ctx, scaleFactor);
    if (this.type === SHARK_TYPE.REEF) {
      this.drawRearFins(ctx, scaleFactor);
    }
    this.drawTail(ctx, scaleFactor);

    ctx.restore();
  }

  drawHead(ctx, scaleFactor) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.rotate(this.angle);
    ctx.lineWidth = SHARK.LINE_WIDTH;

    if (this.type === SHARK_TYPE.HAMMERHEAD) {
      this.tracePathHammerhead(ctx);
    } else {
      this.tracePathRegularHead(ctx);
    }

    this.tracePathSideFins(ctx);
    ctx.restore();
  }

  drawBodyLine(ctx, scaleFactor) {
    ctx.lineWidth = SHARK.LINE_WIDTH * scaleFactor;
    ctx.beginPath();
    ctx.moveTo(this.bodySegments[0].x, this.bodySegments[0].y);
    for (let i = 1; i < this.bodySegments.length; i++) {
      ctx.lineTo(this.bodySegments[i].x, this.bodySegments[i].y);
    }
    ctx.stroke();
  }

  drawRearFins(ctx, scaleFactor) {
    const segments = this.bodySegments;
    const dorsalSeg = segments[Math.floor(segments.length * 0.55)];
    const pelvicSeg = segments[Math.floor(segments.length * 0.75)];

    this.tracePathSecondDorsal(ctx, dorsalSeg, scaleFactor);
    this.tracePathPelvicFins(ctx, pelvicSeg, scaleFactor);
  }

  tracePathSecondDorsal(ctx, segment, scaleFactor) {
    ctx.save();
    ctx.translate(segment.x, segment.y);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.rotate(segment.angle);
    ctx.lineWidth = SHARK.LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(0, -1.5);
    ctx.lineTo(-3.5, -5.5);
    ctx.lineTo(-2, -1);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 1.5);
    ctx.lineTo(-3.5, 5.5);
    ctx.lineTo(-2, 1);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  tracePathPelvicFins(ctx, segment, scaleFactor) {
    ctx.save();
    ctx.translate(segment.x, segment.y);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.rotate(segment.angle);
    ctx.lineWidth = SHARK.LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(0, -1.2);
    ctx.lineTo(-2.5, -4);
    ctx.lineTo(-1.4, -0.8);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 1.2);
    ctx.lineTo(-2.5, 4);
    ctx.lineTo(-1.4, 0.8);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  drawTail(ctx, scaleFactor) {
    const tail = this.bodySegments[this.bodySegments.length - 1];
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.rotate(tail.angle);
    ctx.lineWidth = SHARK.LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-18, -6);
    ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  tracePathRegularHead(ctx) {
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.bezierCurveTo(18, -3, 12, -6, 5, -7);
    ctx.lineTo(5, 7);
    ctx.bezierCurveTo(12, 6, 18, 3, 22, 0);
    ctx.closePath();
    ctx.stroke();
  }

  tracePathHammerhead(ctx) {
    ctx.beginPath();
    ctx.moveTo(16, -14);
    ctx.lineTo(18, -14);
    ctx.lineTo(20, -10);
    ctx.lineTo(20, -4);
    ctx.lineTo(8, -3);
    ctx.lineTo(5, -5);
    ctx.lineTo(5, 5);
    ctx.lineTo(8, 3);
    ctx.lineTo(20, 4);
    ctx.lineTo(20, 10);
    ctx.lineTo(18, 14);
    ctx.lineTo(16, 14);
    ctx.lineTo(14, 10);
    ctx.lineTo(14, -10);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(17, -11, 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(17, 11, 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }

  tracePathSideFins(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-8, -15);
    ctx.lineTo(-4, -5);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-8, 15);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.stroke();
  }

  tickOpacity() {
    if (this.targetOpacity > this.opacity) {
      this.opacity = Math.min(this.targetOpacity, this.opacity + SHARK.FADE_IN_RATE);
    } else if (this.targetOpacity < this.opacity) {
      this.opacity = Math.max(this.targetOpacity, this.opacity - SHARK.FADE_OUT_RATE);
    }
  }

  isFullyFadedOut() {
    return this.targetOpacity === 0 && this.opacity <= 0;
  }
}
