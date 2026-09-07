/**
 * Reading progress for the page, as a hairline across the top.
 *
 * Deliberately not a React component with a scroll listener: the whole effect
 * is a CSS scroll timeline, so it costs no JavaScript, never runs on the main
 * thread during scroll, and disappears entirely where the timeline is
 * unsupported or the visitor has asked for reduced motion (see globals.css).
 */
export function ScrollProgress() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-accent-gradient scroll-progress"
    />
  );
}
