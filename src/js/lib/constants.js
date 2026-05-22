export const CANVAS_ID = "sceneCanvas";

export const ROUTE = Object.freeze({
  HOME: "home",
  PROJECTS: "projects",
  CONTACT: "contact",
});

export const SCALE = Object.freeze({
  REFERENCE_WIDTH: 1400,
  MIN: 0.5,
  MAX: 1,
});

export const SHARK_TYPE = Object.freeze({
  REGULAR: "regular",
  HAMMERHEAD: "hammerhead",
  REEF: "reef",
});

export const SHARK = Object.freeze({
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
});

export const PARTICLES = Object.freeze({
  COUNT_DESKTOP: 1050,
  COUNT_MOBILE: 500,
  MOBILE_BREAKPOINT_PX: 768,

  // Shark / trail avoidance
  AVOIDANCE_RADIUS: 90,
  AVOIDANCE_FORCE: 1.8,
  TRAIL_AVOIDANCE_RADIUS: 48,
  TRAIL_AVOIDANCE_FORCE: 0.65,

  // School shape (radii are fractions of min(canvasW, canvasH))
  SCHOOL_RADIUS_X_FACTOR: 0.5,
  SCHOOL_RADIUS_Y_FACTOR: 0.36,
  SHAPE_PHASE_INCREMENT: 0.0038,
  SHAPE_DEFORM_A1: 0.1,
  SHAPE_DEFORM_A2: 0.07,
  SHAPE_DEFORM_A3: 0.04,
  // School centroid orbits around canvas center — fast enough that the school
  // visibly drifts but never reaches the screen edges.
  SCHOOL_CENTER_DRIFT_FACTOR: 0.7,
  SCHOOL_CENTER_DRIFT_X: 70,
  SCHOOL_CENTER_DRIFT_Y: 44,

  // Soft containment back into the school shape
  CONTAINMENT_FACTOR: 0.012,
  CONTAINMENT_SOFT_BAND: 34,

  // Very soft pull toward school center: just enough to keep the school
  // anchored centrally, but weak enough that sub-flocks can swirl freely
  // within a large interior deadzone.
  COMPRESSION_FACTOR: 0.0009,
  COMPRESSION_INNER_DEADZONE: 0.4, // fraction of avg(rx, ry) with no pull

  // Boid: void-filling cohesion + LOCAL separation + LOCAL alignment.
  //
  // Lesson learned: high global alignment causes "consensus collapse" — every
  // fish averages to the global mean heading, killing sub-flock variety.
  // Keep alignment LOCAL (small radius, low factor) so distinct neighbourhood
  // currents emerge and persist instead of merging into one direction.
  COHESION_RADIUS: 30,
  COHESION_FACTOR: 0.028,
  SEPARATION_RADIUS: 16,
  SEPARATION_FACTOR: 0.018,
  ALIGNMENT_RADIUS: 18,
  ALIGNMENT_FACTOR: 0.025,

  // Wander noise — needs to be strong enough to overcome the damping floor
  // so motion stays visibly lively instead of decaying to zero.
  WANDER_NOISE_FACTOR: 0.06,
  WANDER_NOISE_SCALE: 0.0055,

  // Motion — looser damping + higher cap so kinetic energy persists.
  DAMPING: 0.955,
  MAX_SPEED: 1.8,

  // Spatial grid (cell size near boid neighbor radius)
  GRID_CELL_SIZE: 36,

  // Opacity
  MIN_OPACITY_IDLE: 0.78,
  OPACITY_FADE_RATE_IN: 0.025,
  OPACITY_FADE_RATE_OUT: 0.01,

  // Render
  STROKE_STYLE: "rgba(255, 255, 255, 0.92)",
  STROKE_WIDTH: 0.85,
});

export const BEZIER = Object.freeze({
  PATH_RADIUS_BASE: 300,
  PATH_RADIUS_VARIANCE: 300,
  EDGE_PADDING: 50,
  PATH_QUEUE_MIN: 3,
  PATH_QUEUE_REFILL_COUNT: 2,
  INITIAL_QUEUE_COUNT: 3,
});

export const TRANSITION_MS = Object.freeze({
  FAST: 200,
  BASE: 300,
  SLOW: 600,
});

export const NAME_FLICKER = Object.freeze({
  INITIAL_DELAY_MS: 2000,
  INTERVAL_MS: 12000,
  ENGLISH_TO_MARATHI_MS: 300,
  MARATHI_GLITCH_END_MS: 600,
  RETURN_TO_ENGLISH_MS: 3300,
});

export const SHARK_LAYOUT_BY_ROUTE = Object.freeze({
  [ROUTE.HOME]: [SHARK_TYPE.REGULAR],
  [ROUTE.PROJECTS]: [SHARK_TYPE.REGULAR, SHARK_TYPE.HAMMERHEAD],
  [ROUTE.CONTACT]: [SHARK_TYPE.REGULAR, SHARK_TYPE.HAMMERHEAD, SHARK_TYPE.REEF],
});

export function isMobileViewport() {
  return window.matchMedia(
    `(max-width: ${PARTICLES.MOBILE_BREAKPOINT_PX}px)`
  ).matches;
}
