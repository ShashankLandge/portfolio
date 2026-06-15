import { ViewSection } from "./view-section";

type HomeViewProps = { isActive: boolean };

export function HomeView({ isActive }: HomeViewProps) {
  return (
    <ViewSection
      routeKey="home"
      isActive={isActive}
      variantClass="view--home"
      ariaLabelledBy="home-heading"
      tag="div"
    >
      <p id="home-heading" className="sr-only">
        About
      </p>
      <p>
        IIIT Pune, B.Tech
        <br />
        Honors in Machine&nbsp;Learning.
        <br />
      </p>
    </ViewSection>
  );
}
