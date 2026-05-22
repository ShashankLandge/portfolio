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
import { IntroView } from "./views/intro-view.js";

const VALID_ROUTE_VALUES = Object.values(ROUTE);

function readInitialRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (VALID_ROUTE_VALUES.includes(hash)) {
    return hash;
  }
  return ROUTE.INTRO;
}

function bootstrap() {
  const sceneCanvas = document.getElementById(CANVAS_ID);
  const introOverlay = document.getElementById("intro");
  const introCanvas = document.getElementById("introCanvas");
  const introName = document.getElementById("introName");
  const introWord = document.getElementById("introWord");
  const mainFrame = document.getElementById("mainFrame");
  const englishName = document.getElementById("englishName");
  const marathiName = document.getElementById("marathiName");
  const menuLinks = Array.from(document.querySelectorAll(".menu-link"));
  const viewMap = queryViewMap(mainFrame);

  const scene = new Scene(sceneCanvas);
  const nameFlicker = new NameFlicker(englishName, marathiName);

  const initialRoute = readInitialRoute();
  const shouldRunIntro = initialRoute === ROUTE.INTRO;
  let introHasRun = !shouldRunIntro;

  if (!shouldRunIntro) {
    introOverlay.setAttribute("hidden", "");
    revealMainFrame();
  }

  const router = new Router(handleRouteChange);
  bindMenuClicks(menuLinks, router);
  router.start(initialRoute);

  function handleRouteChange(nextRoute, previousRoute) {
    if (nextRoute === ROUTE.INTRO) {
      runIntroOnce();
      return;
    }

    if (previousRoute === ROUTE.INTRO || previousRoute === null) {
      revealMainFrame();
    }

    const sharkTypes = SHARK_LAYOUT_BY_ROUTE[nextRoute] || [];
    scene.setSharkTypes(sharkTypes);
    setActiveMenuItem(menuLinks, nextRoute);
    transitionViews(viewMap, nextRoute);
  }

  function runIntroOnce() {
    if (introHasRun) {
      router.navigateTo(ROUTE.HOME);
      return;
    }
    introHasRun = true;

    const intro = new IntroView({
      container: introOverlay,
      canvas: introCanvas,
      nameElement: introName,
      wordElement: introWord,
      onExitStart: () => {
        revealMainFrame();
        scene.setSharkTypes(SHARK_LAYOUT_BY_ROUTE[ROUTE.HOME]);
        setActiveMenuItem(menuLinks, ROUTE.HOME);
        transitionViews(viewMap, ROUTE.HOME);
      },
      onComplete: () => {
        introOverlay.setAttribute("hidden", "");
        router.navigateTo(ROUTE.HOME);
      },
    });

    document.fonts.ready
      .catch((error) => {
        console.warn("Font loading failed; starting intro anyway.", error);
      })
      .finally(() => intro.run());
  }

  function revealMainFrame() {
    setMainFrameReady(mainFrame, true);
    nameFlicker.start();
    scene.start();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
