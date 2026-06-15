import { CONTACT_LINKS } from "@/content/contact-links";
import { ViewSection } from "./view-section";

type ContactViewProps = { isActive: boolean };

export function ContactView({ isActive }: ContactViewProps) {
  return (
    <ViewSection
      routeKey="contact"
      isActive={isActive}
      variantClass="view--contact"
      ariaLabelledBy="contact-heading"
    >
      <h2 id="contact-heading" className="sr-only">
        Contact
      </h2>
      {CONTACT_LINKS.map(({ label, href, external }) => (
        <a
          key={label}
          href={href}
          className="contact-link"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {label} ↗
        </a>
      ))}
    </ViewSection>
  );
}
