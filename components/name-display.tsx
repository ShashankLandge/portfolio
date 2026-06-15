"use client";

import { useEffect, useRef } from "react";
import { NameFlicker } from "@/lib/name-flicker";

const NAME_EN = "Shashank Landge";
const NAME_MR = "शशांक लांडगे";

export function NameDisplay() {
  const englishRef = useRef<HTMLSpanElement | null>(null);
  const marathiRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const english = englishRef.current;
    const marathi = marathiRef.current;
    if (!english || !marathi) return;

    const flicker = new NameFlicker(english, marathi);
    flicker.start();

    return () => flicker.stop();
  }, []);

  return (
    <div className="name-display">
      <span
        ref={englishRef}
        className="name-text name-text--english"
        aria-label={NAME_EN}
      >
        {NAME_EN}
      </span>
      <span
        ref={marathiRef}
        className="name-text name-text--marathi"
        aria-hidden="true"
      >
        {NAME_MR}
      </span>
    </div>
  );
}
