import { calculateScaleFactor, resizeCanvasToWindow } from "./canvas";
import { MouseState, Shark } from "./shark";
import { ParticleSystem } from "./particles";
import type { SharkTypeName } from "./constants";

const FPS_EMA_ALPHA = 0.12;
const FPS_OVERLAY_FONT = "11px 'NType82Mono', 'JetBrains_Mono', monospace";
const FPS_OVERLAY_FILL = "#ffffff";
const FPS_OVERLAY_ALPHA = 0.85;
const FPS_OVERLAY_MARGIN_PX = 16;

export class Scene {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cssWidth: number;
  cssHeight: number;
  scaleFactor: number;
  sharks: Shark[];
  mouse: MouseState;
  isDragging: boolean;
  particleSystem: ParticleSystem;
  animationFrameId: number | null;
  particlesEnabled: boolean;
  lastFrameTime: number;
  fps: number;

  private readonly handlePointerDown: (event: PointerEvent) => void;
  private readonly handlePointerMove: (event: PointerEvent) => void;
  private readonly handlePointerUp: () => void;
  private readonly handlePointerLeave: () => void;
  private readonly handlePointerEnter: () => void;
  private readonly handleResize: () => void;
  private readonly tick: () => void;

  constructor(canvas: HTMLCanvasElement) {
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
    this.lastFrameTime = performance.now();
    this.fps = 60;

    this.handlePointerDown = (event: PointerEvent) => {
      this.isDragging = true;
      this.updateMouseFromEvent(event);
    };
    this.handlePointerMove = (event: PointerEvent) => {
      this.updateMouseFromEvent(event);
      if (this.isDragging) {
        for (const shark of this.sharks) {
          shark.targetX = this.mouse.x;
          shark.targetY = this.mouse.y;
        }
      }
    };
    this.handlePointerUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      for (const shark of this.sharks) {
        shark.resetPaths(this.cssWidth, this.cssHeight);
      }
    };
    this.handlePointerLeave = () => {
      this.mouse.visible = false;
      this.isDragging = false;
    };
    this.handlePointerEnter = () => {
      this.mouse.visible = true;
    };
    this.handleResize = () => {
      const { width: nextWidth, height: nextHeight } = resizeCanvasToWindow(
        this.canvas
      );
      this.cssWidth = nextWidth;
      this.cssHeight = nextHeight;
      this.scaleFactor = calculateScaleFactor(nextWidth);
      for (const shark of this.sharks) {
        shark.resetPaths(nextWidth, nextHeight);
      }
      this.particleSystem.resize(nextWidth, nextHeight);
    };
    this.tick = () => this.runFrame();

    this.attachListeners();
  }

  attachListeners(): void {
    window.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointercancel", this.handlePointerUp);
    window.addEventListener("pointerleave", this.handlePointerLeave);
    window.addEventListener("pointerenter", this.handlePointerEnter);
    window.addEventListener("resize", this.handleResize, { passive: true });
  }

  detachListeners(): void {
    window.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointercancel", this.handlePointerUp);
    window.removeEventListener("pointerleave", this.handlePointerLeave);
    window.removeEventListener("pointerenter", this.handlePointerEnter);
    window.removeEventListener("resize", this.handleResize);
  }

  updateMouseFromEvent(event: PointerEvent): void {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    this.mouse.visible = true;
  }

  setSharkTypes(targetTypes: ReadonlyArray<SharkTypeName>): void {
    const usedIndices = new Set<number>();
    const nextSharks: Shark[] = [];

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

  createSharkOfType(type: SharkTypeName): Shark {
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

  clearSharks(instant = false): void {
    if (instant) {
      this.sharks = [];
      return;
    }
    for (const shark of this.sharks) {
      shark.targetOpacity = 0;
    }
  }

  setParticlesEnabled(enabled: boolean): void {
    this.particlesEnabled = enabled;
  }

  start(): void {
    if (this.animationFrameId !== null) return;
    this.tick();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy(): void {
    this.stop();
    this.detachListeners();
  }

  private runFrame(): void {
    // FPS — exponential moving average so the number reads steady, not jittery
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (delta > 0) this.fps += (1000 / delta - this.fps) * FPS_EMA_ALPHA;

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

    this.drawFpsOverlay();

    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  private drawFpsOverlay(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = FPS_OVERLAY_ALPHA;
    ctx.font = FPS_OVERLAY_FONT;
    ctx.fillStyle = FPS_OVERLAY_FILL;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(
      `${Math.round(this.fps)} FPS`,
      this.cssWidth - FPS_OVERLAY_MARGIN_PX,
      FPS_OVERLAY_MARGIN_PX
    );
    ctx.restore();
  }
}
