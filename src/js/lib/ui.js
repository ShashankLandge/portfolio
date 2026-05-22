const ACTIVE_ATTR = "data-active";
const READY_ATTR = "data-ready";
const CURRENT_MENU_CLASS = "menu-link--current";

export function showElement(element) {
  if (!element) return;
  element.setAttribute(ACTIVE_ATTR, "true");
}

export function hideElement(element) {
  if (!element) return;
  element.setAttribute(ACTIVE_ATTR, "false");
}

export function setMainFrameReady(frameElement, isReady) {
  if (!frameElement) return;
  frameElement.setAttribute(READY_ATTR, isReady ? "true" : "false");
}

export function setActiveMenuItem(menuLinks, activeRoute) {
  for (const link of menuLinks) {
    if (link.dataset.route === activeRoute) {
      link.classList.add(CURRENT_MENU_CLASS);
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove(CURRENT_MENU_CLASS);
      link.removeAttribute("aria-current");
    }
  }
}

export function bindMenuClicks(menuLinks, router) {
  for (const link of menuLinks) {
    link.addEventListener("click", (event) => {
      const targetRoute = link.dataset.route;
      if (!targetRoute) return;
      event.preventDefault();
      router.navigateTo(targetRoute);
    });
  }
}

export function queryViewMap(rootElement) {
  const views = new Map();
  for (const view of rootElement.querySelectorAll("[data-view]")) {
    views.set(view.dataset.view, view);
  }
  return views;
}

export function transitionViews(viewMap, nextViewKey) {
  for (const [key, view] of viewMap.entries()) {
    if (key === nextViewKey) {
      showElement(view);
    } else {
      hideElement(view);
    }
  }
}
