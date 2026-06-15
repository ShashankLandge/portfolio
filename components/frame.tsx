"use client";

import { useEffect, useState } from "react";
import { NameDisplay } from "./name-display";
import { Menu } from "./menu";

type FrameProps = { children?: React.ReactNode };

export function Frame({ children }: FrameProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <main
      id="mainFrame"
      className="frame"
      data-ready={isReady ? "true" : "false"}
    >
      <div className="frame-section frame-section--left">
        <NameDisplay />
        <div className="title-line">Engineer.</div>
        <Menu />
      </div>
      {children}
    </main>
  );
}
