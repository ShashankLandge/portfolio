export const CANVAS_ID = "sceneCanvas";

export const ROUTE = Object.freeze({
  INTRO: "intro",
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
});

export const PARTICLES = Object.freeze({
  COUNT_DESKTOP: 280,
  COUNT_MOBILE: 140,
  MOBILE_BREAKPOINT_PX: 768,
  AVOIDANCE_RADIUS: 140,
  AVOIDANCE_FORCE: 4,
  SCHOOL_ANGLE_INCREMENT: 0.008,
  DAMPING: 0.95,
  SCHOOL_FORCE_FACTOR: 0.01,
  AVOIDANCE_FACTOR: 0.15,
  MIN_OPACITY_IDLE: 0.81,
  OPACITY_FADE_RATE_IN: 0.02,
  OPACITY_FADE_RATE_OUT: 0.01,
  SCHOOL_CENTER_RADIUS_X: 100,
  SCHOOL_CENTER_RADIUS_Y: 60,
  SCHOOL_CENTER_DRIFT_FACTOR: 0.3,
  STROKE_STYLE: "rgba(255, 255, 255, 0.9)",
  STROKE_WIDTH: 0.9,
});

export const BEZIER = Object.freeze({
  PATH_RADIUS_BASE: 300,
  PATH_RADIUS_VARIANCE: 300,
  EDGE_PADDING: 50,
  PATH_QUEUE_MIN: 3,
  PATH_QUEUE_REFILL_COUNT: 2,
  INITIAL_QUEUE_COUNT: 3,
});

export const INTRO = Object.freeze({
  PARTICLE_COUNT: 100,
  SKILLS: [
    "Developer",
    "Designer",
    "Machine Learning",
    "Web Development",
    "AI Engineering",
    "NextJS",
    "ReactJS",
    "Deep Learning",
  ],
  WORD_FLICKER_DURATION: 0.2,
  WORD_FLICKER_DELAY_MS: 100,
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
  [ROUTE.CONTACT]: [SHARK_TYPE.REGULAR],
});

export function isMobileViewport() {
  return window.matchMedia(
    `(max-width: ${PARTICLES.MOBILE_BREAKPOINT_PX}px)`
  ).matches;
}
