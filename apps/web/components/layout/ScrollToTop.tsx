"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

/**
 * Floating "scroll to top" button. Hidden until the user scrolls past
 * `showAfter` px, then fades in at the bottom-right. Matches the site's
 * liquid-glass dark aesthetic.
 */
export function ScrollToTop({ showAfter = 500 }: { showAfter?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter]);

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Дээш гүйлгэх"
      className={`liquid-glass fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-xl text-white transition-all duration-300 hover:bg-white hover:text-black ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ChevronUp size={18} />
    </button>
  );
}
