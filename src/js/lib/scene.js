import { calculateScaleFactor, resizeCanvasToWindow } from "./canvas.js";
import { Shark } from "./shark.js";
import { ParticleSystem } from "./particles.js";

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    const { ctx, width, height } = resizeCanvasToWindow(canvas);
    this.ctx = ctx;
    this.cssWidth = width;
    this.cssHeight = height;
    this.scaleFactor = calculateScaleFactor(width);
    this.sharks = [];
    this.mouse = { x: -1000, y: -1000, visible: false };
    this.isDragging = false;
    this.particleSystem = new ParticleSystem(width, height);
    this.animationFrameId = null;
    this.particlesEnabled = true;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handlePointerEnter = this.handlePointerEnter.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.tick = this.tick.bind(this);

    this.attachListeners();
  }

  attachListeners() {
    window.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
    window.addEventListener("pointerleave", this.handlePointerLeave);
    window.addEventListener("pointerenter", this.handlePointerEnter);
    window.addEventListener("resize", this.handleResize, { passive: true });
  }

  detachListeners() {
    window.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    window.removeEventListener("pointerleave", this.handlePointerLeave);
    window.removeEventListener("pointerenter", this.handlePointerEnter);
    window.removeEventListener("resize", this.handleResize);
  }

  handlePointerDown(event) {
    this.isDragging = true;
    this.updateMouseFromEvent(event);
  }

  handlePointerMove(event) {
    this.updateMouseFromEvent(event);
    if (this.isDragging) {
      for (const shark of this.sharks) {
        shark.targetX = this.mouse.x;
        shark.targetY = this.mouse.y;
      }
    }
  }

  handlePointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    for (const shark of this.sharks) {
      shark.resetPaths(this.cssWidth, this.cssHeight);
    }
  }

  handlePointerLeave() {
    this.mouse.visible = false;
    this.isDragging = false;
  }

  handlePointerEnter() {
    this.mouse.visible = true;
  }

  handleResize() {
    const { width, height } = resizeCanvasToWindow(this.canvas);
    this.cssWidth = width;
    this.cssHeight = height;
    this.scaleFactor = calculateScaleFactor(width);
    for (const shark of this.sharks) {
      shark.resetPaths(width, height);
    }
    this.particleSystem.resize(width, height);
  }

  updateMouseFromEvent(event) {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    this.mouse.visible = true;
  }

  setSharkTypes(targetTypes) {
    const usedIndices = new Set();
    const nextSharks = [];

    for (const type of targetTypes) {
      let matchedIndex = -1;
      for (let i = 0; i < this.sharks.length; i++) {
        if (
          !usedIndices.has(i) &&
          this.sharks[i].type === type &&
          this.sharks[i].targetOpacity > 0
        ) {
          matchedIndex = i;
          break;
        }
      }

      if (matchedIndex !== -1) {
        usedIndices.add(matchedIndex);
        const existing = this.sharks[matchedIndex];
        existing.targetOpacity = 1;
        nextSharks.push(existing);
      } else {
        nextSharks.push(this.createSharkOfType(type));
      }
    }

    for (let i = 0; i < this.sharks.length; i++) {
      if (!usedIndices.has(i)) {
        this.sharks[i].targetOpacity = 0;
        nextSharks.push(this.sharks[i]);
      }
    }

    this.sharks = nextSharks;
  }

  createSharkOfType(type) {
    const spawnX = Math.random() * this.cssWidth;
    const spawnY = Math.random() * this.cssHeight;
    const shark = new Shark({
      type,
      x: spawnX,
      y: spawnY,
      scaleFactor: this.scaleFactor,
      initialOpacity: 0,
    });
    shark.targetOpacity = 1;
    shark.enqueueBezierPaths(this.cssWidth, this.cssHeight);
    return shark;
  }

  clearSharks(instant = false) {
    if (instant) {
      this.sharks = [];
      return;
    }
    for (const shark of this.sharks) {
      shark.targetOpacity = 0;
    }
  }

  setParticlesEnabled(enabled) {
    this.particlesEnabled = enabled;
  }

  start() {
    if (this.animationFrameId !== null) return;
    this.tick();
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  tick() {
    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

    for (const shark of this.sharks) {
      shark.tickOpacity();
      shark.update({
        mouse: this.mouse,
        isDragging: this.isDragging,
        canvasWidth: this.cssWidth,
        canvasHeight: this.cssHeight,
        scaleFactor: this.scaleFactor,
      });
    }

    this.sharks = this.sharks.filter((shark) => !shark.isFullyFadedOut());

    if (this.particlesEnabled) {
      this.particleSystem.update(this.sharks);
      this.particleSystem.draw(this.ctx, this.scaleFactor);
    }

    for (const shark of this.sharks) {
      shark.draw(this.ctx, this.scaleFactor);
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  }
}
