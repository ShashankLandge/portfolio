export type ContactLink = {
  label: string;
  href: string;
  external: boolean;
};

export const CONTACT_LINKS: ReadonlyArray<ContactLink> = [
  { label: "Email", href: "mailto:hello@example.com", external: false },
  { label: "Github", href: "https://github.com/", external: true },
  { label: "Leetcode", href: "https://leetcode.com/", external: true },
  { label: "LinkedIn", href: "https://linkedin.com/", external: true },
];
