type ViewSectionProps = {
  routeKey: string;
  isActive: boolean;
  variantClass: string;
  ariaLabelledBy: string;
  children: React.ReactNode;
  tag?: "div" | "section";
};

export function ViewSection({
  routeKey,
  isActive,
  variantClass,
  ariaLabelledBy,
  children,
  tag = "section",
}: ViewSectionProps) {
  const Tag = tag;
  return (
    <Tag
      className={`view ${variantClass}`}
      data-view={routeKey}
      data-active={isActive ? "true" : "false"}
      aria-labelledby={ariaLabelledBy}
      aria-hidden={!isActive}
    >
      {children}
    </Tag>
  );
}
