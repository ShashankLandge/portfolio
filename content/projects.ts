export type ProjectEntry = {
  title: string;
  date: string;
  tags: string;
  href?: string;
};

export const PROJECTS: ReadonlyArray<ProjectEntry> = [
  { title: "Self\u00a0Driven Car", date: "DEC.2024", tags: "ML & Algo" },
  {
    title: "Multi\u00a0Client Video\u00a0Call",
    date: "APR.2024",
    tags: "Dev & Networking",
  },
  { title: "Immersive Portfolio", date: "JUN.2025", tags: "Algo & Dev" },
];
