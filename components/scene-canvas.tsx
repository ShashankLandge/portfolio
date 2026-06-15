"use client";

import { useEffect, useRef } from "react";
import { CANVAS_ID, SHARK_LAYOUT_BY_ROUTE } from "@/lib/canvas/constants";
import { Scene } from "@/lib/canvas/scene";
import { useCurrentRoute } from "@/lib/use-current-route";

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const currentRoute = useCurrentRoute();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new Scene(canvas);
    scene.start();
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setSharkTypes(SHARK_LAYOUT_BY_ROUTE[currentRoute]);
  }, [currentRoute]);

  return (
    <canvas
      ref={canvasRef}
      id={CANVAS_ID}
      className="scene-canvas"
      aria-hidden="true"
    />
  );
}
