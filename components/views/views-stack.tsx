"use client";

import { ROUTE } from "@/lib/canvas/constants";
import { useCurrentRoute } from "@/lib/use-current-route";
import { HomeView } from "./home-view";
import { ProjectsView } from "./projects-view";
import { ContactView } from "./contact-view";

export function ViewsStack() {
  const currentRoute = useCurrentRoute();

  return (
    <>
      <HomeView isActive={currentRoute === ROUTE.HOME} />
      <ProjectsView isActive={currentRoute === ROUTE.PROJECTS} />
      <ContactView isActive={currentRoute === ROUTE.CONTACT} />
    </>
  );
}
