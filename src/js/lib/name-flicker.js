import { NAME_FLICKER } from "./constants.js";

const GLITCH_CLASS = "glitch";

export class NameFlicker {
  constructor(englishElement, marathiElement) {
    this.englishElement = englishElement;
    this.marathiElement = marathiElement;
    this.intervalId = null;
    this.startTimeoutId = null;
    this.scheduledTimeouts = [];
  }

  start() {
    this.stop();
    this.startTimeoutId = window.setTimeout(() => {
      this.runFlickerCycle();
      this.intervalId = window.setInterval(
        () => this.runFlickerCycle(),
        NAME_FLICKER.INTERVAL_MS
      );
    }, NAME_FLICKER.INITIAL_DELAY_MS);
  }

  stop() {
    if (this.startTimeoutId !== null) {
      window.clearTimeout(this.startTimeoutId);
      this.startTimeoutId = null;
    }
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    for (const id of this.scheduledTimeouts) {
      window.clearTimeout(id);
    }
    this.scheduledTimeouts = [];
    this.englishElement.classList.remove(GLITCH_CLASS);
    this.marathiElement.classList.remove(GLITCH_CLASS);
    this.englishElement.style.opacity = "1";
    this.marathiElement.style.opacity = "0";
  }

  runFlickerCycle() {
    this.englishElement.classList.add(GLITCH_CLASS);

    this.schedule(() => {
      this.englishElement.style.opacity = "0";
      this.marathiElement.style.opacity = "1";
      this.englishElement.classList.remove(GLITCH_CLASS);
      this.marathiElement.classList.add(GLITCH_CLASS);
    }, NAME_FLICKER.ENGLISH_TO_MARATHI_MS);

    this.schedule(() => {
      this.marathiElement.classList.remove(GLITCH_CLASS);
    }, NAME_FLICKER.MARATHI_GLITCH_END_MS);

    this.schedule(() => {
      this.marathiElement.style.opacity = "0";
      this.englishElement.style.opacity = "1";
      this.englishElement.classList.add(GLITCH_CLASS);
      this.schedule(() => {
        this.englishElement.classList.remove(GLITCH_CLASS);
      }, NAME_FLICKER.ENGLISH_TO_MARATHI_MS);
    }, NAME_FLICKER.RETURN_TO_ENGLISH_MS);
  }

  schedule(callback, delayMs) {
    const id = window.setTimeout(() => {
      this.scheduledTimeouts = this.scheduledTimeouts.filter((t) => t !== id);
      callback();
    }, delayMs);
    this.scheduledTimeouts.push(id);
  }
}
