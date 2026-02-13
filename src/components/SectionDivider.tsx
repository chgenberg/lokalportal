interface SectionDividerProps {
  /** Background of the section above the divider (wave fill color) */
  topBg?: "white" | "muted" | "navy";
  /** Wave pointing down (default) or up */
  direction?: "down" | "up";
}

export default function SectionDivider({ topBg = "white", direction = "down" }: SectionDividerProps) {
  const fillMap = { white: "#ffffff", muted: "#f8fafc", navy: "#0a1628" };
  const fill = fillMap[topBg];
  const pathDown = "M0,0 L0,40 Q360,0 720,40 T1440,40 L1440,0 Z";
  const pathUp = "M0,40 L0,0 Q360,40 720,0 T1440,0 L1440,40 Z";

  return (
    <div className={`w-full overflow-hidden ${direction === "up" ? "rotate-180" : ""}`} aria-hidden>
      <svg viewBox="0 0 1440 40" className="w-full h-10 sm:h-14" preserveAspectRatio="none">
        <path fill={fill} d={pathDown} />
      </svg>
    </div>
  );
}
