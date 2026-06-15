import { ROUTE, type RouteName } from "@/lib/canvas/constants";

export const ROUTE_PATHS = {
  [ROUTE.HOME]: "/",
  [ROUTE.PROJECTS]: "/projects",
  [ROUTE.CONTACT]: "/contact",
} as const satisfies Record<RouteName, string>;

const PATH_TO_ROUTE: ReadonlyArray<[string, RouteName]> = [
  [ROUTE_PATHS[ROUTE.PROJECTS], ROUTE.PROJECTS],
  [ROUTE_PATHS[ROUTE.CONTACT], ROUTE.CONTACT],
];

export function resolveRouteFromPathname(pathname: string): RouteName {
  for (const [prefix, route] of PATH_TO_ROUTE) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return route;
    }
  }
  return ROUTE.HOME;
}
