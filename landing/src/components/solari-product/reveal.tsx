"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Rest states measured off the live Framer site (docs/research/MOTION.md):
 * headings translate 28px, body copy 15.6px, cards/panels/media scale from 0.84.
 */
export type RevealVariant = "heading" | "text" | "media";

/** Stagger index. Each step is 70ms, inside the 60–90ms band the site uses. */
export type RevealStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const REST: Record<RevealVariant, string> = {
  heading: "translate-y-[28px] motion-reduce:translate-y-0",
  text: "translate-y-[15.6px] motion-reduce:translate-y-0",
  media: "scale-[0.84] motion-reduce:scale-100",
};

const REVEALED: Record<RevealVariant, string> = {
  heading: "data-[revealed=true]:translate-y-0",
  text: "data-[revealed=true]:translate-y-0",
  media: "data-[revealed=true]:scale-100",
};

const STEP_DELAY: Record<RevealStep, string> = {
  0: "delay-0",
  1: "delay-[70ms]",
  2: "delay-[140ms]",
  3: "delay-[210ms]",
  4: "delay-[280ms]",
  5: "delay-[350ms]",
  6: "delay-[420ms]",
  7: "delay-[490ms]",
};

/**
 * Scroll-entry reveal. IntersectionObserver flips `data-revealed`, the
 * transition itself is pure CSS:
 * `opacity/transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)` — the exact curve and
 * duration read off getsolari.com. No animation dependency is used.
 */
export function Reveal({
  children,
  variant = "text",
  step = 0,
  className,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  step?: RevealStep;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      // Deferred by a frame: state must not be pushed synchronously from an
      // effect body. The CSS below already renders the settled state under
      // `motion-reduce`, so nothing flashes in the meantime.
      const raf = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(raf);
    }

    // A block taller than the viewport can never reach a 0.15 ratio, so it
    // reveals as soon as any part of it crosses the trigger line instead.
    const tall = node.getBoundingClientRect().height > window.innerHeight * 0.6;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: tall ? 0 : 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className={cn(
        "opacity-0 transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-[revealed=true]:opacity-100",
        "motion-reduce:opacity-100 motion-reduce:transition-none",
        REST[variant],
        REVEALED[variant],
        STEP_DELAY[step],
        className,
      )}
    >
      {children}
    </div>
  );
}
