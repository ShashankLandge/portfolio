import {
  ROUTE,
  SHARK_LAYOUT_BY_ROUTE,
  CANVAS_ID,
} from "./lib/constants.js";
import { Scene } from "./lib/scene.js";
import { Router } from "./lib/router.js";
import { NameFlicker } from "./lib/name-flicker.js";
import {
  bindMenuClicks,
  setActiveMenuItem,
  setMainFrameReady,
  transitionViews,
  queryViewMap,
} from "./lib/ui.js";

const VALID_ROUTE_VALUES = Object.values(ROUTE);

function readInitialRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (VALID_ROUTE_VALUES.includes(hash)) {
    return hash;
  }
  return ROUTE.HOME;
}

function bootstrap() {
  const sceneCanvas = document.getElementById(CANVAS_ID);
  const mainFrame = document.getElementById("mainFrame");
  const englishName = document.getElementById("englishName");
  const marathiName = document.getElementById("marathiName");
  const menuLinks = Array.from(document.querySelectorAll(".menu-link"));
  const viewMap = queryViewMap(mainFrame);

  const scene = new Scene(sceneCanvas);
  const nameFlicker = new NameFlicker(englishName, marathiName);

  setMainFrameReady(mainFrame, true);
  nameFlicker.start();
  scene.start();

  const router = new Router(handleRouteChange);
  bindMenuClicks(menuLinks, router);
  router.start(readInitialRoute());

  function handleRouteChange(nextRoute) {
    const sharkTypes = SHARK_LAYOUT_BY_ROUTE[nextRoute] || [];
    scene.setSharkTypes(sharkTypes);
    setActiveMenuItem(menuLinks, nextRoute);
    transitionViews(viewMap, nextRoute);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
