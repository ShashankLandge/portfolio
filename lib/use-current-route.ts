"use client";

import { usePathname } from "next/navigation";
import { resolveRouteFromPathname } from "@/lib/routes";
import type { RouteName } from "@/lib/canvas/constants";

export function useCurrentRoute(): RouteName {
  const pathname = usePathname();
  return resolveRouteFromPathname(pathname ?? "/");
}
