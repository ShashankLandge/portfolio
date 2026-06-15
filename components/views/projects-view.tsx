import { PROJECTS } from "@/content/projects";
import { ViewSection } from "./view-section";

type ProjectsViewProps = { isActive: boolean };

export function ProjectsView({ isActive }: ProjectsViewProps) {
  return (
    <ViewSection
      routeKey="projects"
      isActive={isActive}
      variantClass="view--projects"
      ariaLabelledBy="projects-heading"
    >
      <h2 id="projects-heading" className="sr-only">
        Projects
      </h2>
      <ul className="project-list">
        {PROJECTS.map((project) => {
          const titleNode = (
            <h3 className="project-title">{project.title}</h3>
          );
          return (
            <li key={project.title} className="project-item">
              {project.href ? (
                <a href={project.href} className="project-link">
                  {titleNode}
                </a>
              ) : (
                <span className="project-link">{titleNode}</span>
              )}
              <p className="project-info">
                {project.date} / {project.tags}
              </p>
            </li>
          );
        })}
      </ul>
    </ViewSection>
  );
}
