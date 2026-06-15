"use client";

import Link from "next/link";
import { ROUTE, type RouteName } from "@/lib/canvas/constants";
import { ROUTE_PATHS } from "@/lib/routes";
import { useCurrentRoute } from "@/lib/use-current-route";

type MenuEntry = { route: RouteName; label: string };

const MENU_ENTRIES: ReadonlyArray<MenuEntry> = [
  { route: ROUTE.HOME, label: "Home" },
  { route: ROUTE.PROJECTS, label: "Projects" },
  { route: ROUTE.CONTACT, label: "Contact" },
];

export function Menu() {
  const currentRoute = useCurrentRoute();

  return (
    <nav className="menu" aria-label="Primary">
      {MENU_ENTRIES.map(({ route, label }) => {
        const isCurrent = route === currentRoute;
        const classes = isCurrent ? "menu-link menu-link--current" : "menu-link";
        return (
          <Link
            key={route}
            href={ROUTE_PATHS[route]}
            className={classes}
            aria-current={isCurrent ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
