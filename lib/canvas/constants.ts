export const CANVAS_ID = "sceneCanvas";

export const ROUTE = {
  HOME: "home",
  PROJECTS: "projects",
  CONTACT: "contact",
} as const;

export type RouteName = (typeof ROUTE)[keyof typeof ROUTE];

export const SCALE = {
  REFERENCE_WIDTH: 1400,
  MIN: 0.5,
  MAX: 1,
} as const;

export const SHARK_TYPE = {
  REGULAR: "regular",
  HAMMERHEAD: "hammerhead",
  REEF: "reef",
} as const;

export type SharkTypeName = (typeof SHARK_TYPE)[keyof typeof SHARK_TYPE];

export const SHARK = {
  COLOR: "#ffffff",
  LINE_WIDTH: 1.2,
  BODY_SEGMENT_COUNT: 8,
  SEGMENT_DISTANCE: 6,
  POSITION_HISTORY_LENGTH: 40,
  FOLLOW_SPEED_MAX: 5,
  FOLLOW_SPEED_MULTIPLIER: 0.07,
  BEZIER_T_INCREMENT: 0.001,
  BEZIER_LERP_FACTOR: 0.01,
  ANGLE_LERP_FACTOR: 0.07,
  WAVE_FREQUENCY: 0.015,
  WAVE_AMPLITUDE_IDLE: 0.8,
  WAVE_AMPLITUDE_DRAGGING: 1.5,
  SEGMENT_LERP_FACTOR: 0.3,
  SEGMENT_ANGLE_LERP_FACTOR: 0.15,
  FADE_IN_RATE: 0.025,
  FADE_OUT_RATE: 0.025,
  TRAIL_SAMPLE_INTERVAL: 6,
  TRAIL_MAX_SAMPLES: 90,
  TRAIL_LIFE_TICKS: 540,
} as const;

export const PARTICLES = {
  COUNT_DESKTOP: 1050,
  COUNT_MOBILE: 500,
  MOBILE_BREAKPOINT_PX: 768,

  AVOIDANCE_RADIUS: 90,
  AVOIDANCE_FORCE: 1.8,
  TRAIL_AVOIDANCE_RADIUS: 48,
  TRAIL_AVOIDANCE_FORCE: 0.65,

  SCHOOL_RADIUS_X_FACTOR: 0.5,
  SCHOOL_RADIUS_Y_FACTOR: 0.36,
  SHAPE_PHASE_INCREMENT: 0.0038,
  SHAPE_DEFORM_A1: 0.1,
  SHAPE_DEFORM_A2: 0.07,
  SHAPE_DEFORM_A3: 0.04,
  SCHOOL_CENTER_DRIFT_FACTOR: 0.7,
  SCHOOL_CENTER_DRIFT_X: 70,
  SCHOOL_CENTER_DRIFT_Y: 44,

  CONTAINMENT_FACTOR: 0.012,
  CONTAINMENT_SOFT_BAND: 34,

  COMPRESSION_FACTOR: 0.0009,
  COMPRESSION_INNER_DEADZONE: 0.4,

  COHESION_RADIUS: 30,
  COHESION_FACTOR: 0.028,
  SEPARATION_RADIUS: 16,
  SEPARATION_FACTOR: 0.018,
  ALIGNMENT_RADIUS: 18,
  ALIGNMENT_FACTOR: 0.025,

  WANDER_NOISE_FACTOR: 0.06,
  WANDER_NOISE_SCALE: 0.0055,

  DAMPING: 0.955,
  MAX_SPEED: 1.8,

  GRID_CELL_SIZE: 36,

  MIN_OPACITY_IDLE: 0.78,
  OPACITY_FADE_RATE_IN: 0.025,
  OPACITY_FADE_RATE_OUT: 0.01,

  // ── Adaptive performance scaling ─────────────────────────────────────────
  //
  // The old approach reacted to the instantaneous FPS EMA every frame, causing
  // a feedback oscillation: low FPS → remove particles → high FPS → add them
  // back → low FPS → repeat forever.  The new approach:
  //
  //   1. Accumulates a ring buffer of raw FPS samples.
  //   2. Trims the noisiest 15 % on each tail and averages the rest — a
  //      sustained trend is required, not a single dip.
  //   3. Gates every scale change behind a cooldown so the count can settle
  //      and the buffer can refill with post-change data before the next
  //      decision.
  //
  // ADAPTIVE_FPS_TARGET and ADAPTIVE_FPS_HYSTERESIS are kept for backward
  // compatibility but are no longer read by the adaptive algorithm.
  ADAPTIVE_FPS_TARGET: 60,
  ADAPTIVE_FPS_HYSTERESIS: 3,

  // Ring buffer length in frames (~3 s at 60 fps).
  ADAPTIVE_FPS_RING_SIZE: 180,
  // Minimum samples before the first scale decision (~2 s at 60 fps).
  // This prevents startup thrash while the JS JIT is warming up.
  ADAPTIVE_FPS_MIN_SAMPLES: 120,
  // Frames to wait after any scale change before the next one is allowed
  // (~7 s at 60 fps). The ring buffer is fully refreshed twice by then.
  ADAPTIVE_COOLDOWN_FRAMES: 420,
  // Trimmed-mean thresholds. The gap between them is the deadband where
  // no action is taken; only sustained drift outside it moves the scale.
  ADAPTIVE_SUSTAINED_LOW: 50,   // below this → reduce scale
  ADAPTIVE_SUSTAINED_HIGH: 62,  // above this → allow scale increase

  // Per-event step sizes (applied once per cooldown cycle, not per frame).
  ADAPTIVE_SCALE_STEP_UP: 0.06,
  ADAPTIVE_SCALE_STEP_DOWN: 0.10,
  // Particle count changes are applied one particle every few frames so the
  // school adjusts without any visible pop or sudden density jump.
  ADAPTIVE_PARTICLE_CHANGE_INTERVAL: 3,

  MIN_PARTICLE_SCALE: 0.14,
  MAX_PARTICLE_SCALE: 1,

  // Per-frame opacity decrease for particles being gracefully removed.
  // At 0.035 / frame a particle takes ~25 frames (≈ 0.4 s) to fully fade.
  PARTICLE_REMOVE_FADE_RATE: 0.035,
  // ─────────────────────────────────────────────────────────────────────────

  FEAR_TINT_RATE_IN: 0.09,
  FEAR_TINT_RATE_OUT: 0.018,

  STROKE_STYLE: "rgba(255, 255, 255, 0.92)",
  STROKE_WIDTH: 0.85,
} as const;

export const BEZIER = {
  PATH_RADIUS_BASE: 300,
  PATH_RADIUS_VARIANCE: 300,
  EDGE_PADDING: 50,
  PATH_QUEUE_MIN: 3,
  PATH_QUEUE_REFILL_COUNT: 2,
  INITIAL_QUEUE_COUNT: 3,
} as const;

export const TRANSITION_MS = {
  FAST: 200,
  BASE: 300,
  SLOW: 600,
} as const;

export const NAME_FLICKER = {
  INITIAL_DELAY_MS: 2000,
  INTERVAL_MS: 12000,
  ENGLISH_TO_MARATHI_MS: 300,
  MARATHI_GLITCH_END_MS: 600,
  RETURN_TO_ENGLISH_MS: 3300,
} as const;

export const SHARK_LAYOUT_BY_ROUTE: Record<RouteName, ReadonlyArray<SharkTypeName>> = {
  [ROUTE.HOME]: [SHARK_TYPE.REGULAR],
  [ROUTE.PROJECTS]: [SHARK_TYPE.REGULAR, SHARK_TYPE.HAMMERHEAD],
  [ROUTE.CONTACT]: [SHARK_TYPE.REGULAR, SHARK_TYPE.HAMMERHEAD, SHARK_TYPE.REEF],
};

export function isMobileViewport(): boolean {
  return window.matchMedia(
    `(max-width: ${PARTICLES.MOBILE_BREAKPOINT_PX}px)`
  ).matches;
}