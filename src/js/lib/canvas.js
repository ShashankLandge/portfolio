import { SCALE } from "./constants.js";

export function calculateScaleFactor(width) {
  return Math.min(
    Math.max(width / SCALE.REFERENCE_WIDTH, SCALE.MIN),
    SCALE.MAX
  );
}

export function resizeCanvasToWindow(canvas) {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  canvas.width = Math.floor(displayWidth * devicePixelRatio);
  canvas.height = Math.floor(displayHeight * devicePixelRatio);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  return {
    ctx,
    width: displayWidth,
    height: displayHeight,
    devicePixelRatio,
  };
}
