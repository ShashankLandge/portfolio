import { ROUTE } from "./constants.js";

const VALID_ROUTES = new Set(Object.values(ROUTE));

function parseHashRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return VALID_ROUTES.has(hash) ? hash : null;
}

export class Router {
  constructor(onRouteChange) {
    this.onRouteChange = onRouteChange;
    this.currentRoute = null;
    this.handleHashChange = this.handleHashChange.bind(this);
    window.addEventListener("hashchange", this.handleHashChange);
  }

  start(defaultRoute) {
    const initialRoute = parseHashRoute() || defaultRoute;
    if (window.location.hash !== `#/${initialRoute}`) {
      window.location.replace(`${window.location.pathname}#/${initialRoute}`);
    }
    this.commitRoute(initialRoute);
  }

  handleHashChange() {
    const nextRoute = parseHashRoute();
    if (nextRoute && nextRoute !== this.currentRoute) {
      this.commitRoute(nextRoute);
    }
  }

  commitRoute(nextRoute) {
    const previousRoute = this.currentRoute;
    this.currentRoute = nextRoute;
    this.onRouteChange(nextRoute, previousRoute);
  }

  navigateTo(route) {
    if (!VALID_ROUTES.has(route)) return;
    if (window.location.hash === `#/${route}`) return;
    window.location.hash = `#/${route}`;
  }

  destroy() {
    window.removeEventListener("hashchange", this.handleHashChange);
  }
}
