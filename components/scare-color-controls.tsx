"use client";

import { useSceneColor } from "./scene-color-context";

const COLOR_BUTTONS = [
  { color: "red", label: "Red" },
  { color: "green", label: "Green" },
  { color: "blue", label: "Blue" },
] as const;

type ScareColor = (typeof COLOR_BUTTONS)[number]["color"];

export function ScareColorControls() {
  const { color, setColor } = useSceneColor();

  return (
    <div className="scare-color-controls" role="group" aria-label="Scare fish color">
      {COLOR_BUTTONS.map(({ color: buttonColor, label }) => (
        <button
          key={buttonColor}
          type="button"
          className={`scare-color-button ${buttonColor === color ? "scare-color-button--active" : ""}`}
          style={{ backgroundColor: buttonColor }}
          onClick={() => setColor(buttonColor)}
        >
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
