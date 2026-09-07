/**
 * Ambient background that drifts as the page scrolls.
 *
 * Like ScrollProgress this is a CSS scroll timeline rather than a React scroll
 * listener, so it costs no JavaScript and never runs on the main thread while
 * the visitor scrolls. It is layered behind page content and is inert to the
 * pointer, so nothing about it can intercept a click.
 *
 * See globals.css for the guards: it is desktop-only (the blurs are large, and
 * this site's mobile performance was hard-won), off for reduced motion, and
 * absent entirely where scroll timelines are unsupported.
 */
export function ScrollAurora() {
  return <div aria-hidden="true" className="scroll-aurora" />;
}
