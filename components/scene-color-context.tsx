"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ScareColor = "red" | "green" | "blue";

type SceneColorContextValue = {
  color: ScareColor;
  setColor: (color: ScareColor) => void;
};

const SceneColorContext = createContext<SceneColorContextValue | null>(null);

export function SceneColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<ScareColor>("red");
  const value = useMemo(() => ({ color, setColor }), [color]);

  return (
    <SceneColorContext.Provider value={value}>
      {children}
    </SceneColorContext.Provider>
  );
}

export function useSceneColor() {
  const context = useContext(SceneColorContext);
  if (!context) {
    throw new Error("useSceneColor must be used within SceneColorProvider");
  }
  return context;
}
