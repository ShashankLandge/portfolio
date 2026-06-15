import { BEZIER } from "./constants";

export type Point = { x: number; y: number };

export type BezierCurve = {
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
};

function clampPointToCanvas(
  point: Point,
  canvasWidth: number,
  canvasHeight: number
): Point {
  const padding = BEZIER.EDGE_PADDING;
  return {
    x: Math.max(padding, Math.min(canvasWidth - padding, point.x)),
    y: Math.max(padding, Math.min(canvasHeight - padding, point.y)),
  };
}

export function generateBezierPath(
  startPoint: Point,
  canvasWidth: number,
  canvasHeight: number
): BezierCurve {
  const radius =
    BEZIER.PATH_RADIUS_BASE + Math.random() * BEZIER.PATH_RADIUS_VARIANCE;
  const baseAngle = Math.random() * Math.PI * 2;
  const midAngle = baseAngle + Math.PI / 3 + Math.random() * (Math.PI / 2);
  const endAngle = midAngle + Math.PI / 4 + Math.random() * (Math.PI / 3);

  const p1 = startPoint;
  const p2 = clampPointToCanvas(
    {
      x: p1.x + Math.cos(baseAngle) * radius * 0.6,
      y: p1.y + Math.sin(baseAngle) * radius * 0.4,
    },
    canvasWidth,
    canvasHeight
  );
  const p3 = clampPointToCanvas(
    {
      x: p1.x + Math.cos(midAngle) * radius * 0.8,
      y: p1.y + Math.sin(midAngle) * radius * 0.6,
    },
    canvasWidth,
    canvasHeight
  );
  const p4 = clampPointToCanvas(
    {
      x: p1.x + Math.cos(endAngle) * radius,
      y: p1.y + Math.sin(endAngle) * radius * 0.7,
    },
    canvasWidth,
    canvasHeight
  );

  return { p1, p2, p3, p4 };
}

export function bezierPoint(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Point {
  const inv = 1 - t;
  const inv2 = inv * inv;
  const inv3 = inv2 * inv;
  const t2 = t * t;
  const t3 = t2 * t;
  const term1 = 3 * inv2 * t;
  const term2 = 3 * inv * t2;

  return {
    x: inv3 * p0.x + term1 * p1.x + term2 * p2.x + t3 * p3.x,
    y: inv3 * p0.y + term1 * p1.y + term2 * p2.y + t3 * p3.y,
  };
}

export function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= 2 * Math.PI;
  while (normalized < -Math.PI) normalized += 2 * Math.PI;
  return normalized;
}
