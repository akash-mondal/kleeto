"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type RevealTag = "div" | "section" | "article" | "li" | "figure";

/**
 * Rest states measured off the live Framer site (see docs/research/MOTION.md).
 * Every variant settles on `opacity: 1; transform: none`.
 */
const REST_TRANSFORM = {
  heading: "translateY(28px)",
  body: "translateY(15.6px)",
  media: "scale(0.84)",
} as const;

type RevealVariant = keyof typeof REST_TRANSFORM;

/**
 * Scroll-triggered enter animation. The original is a Framer site whose sections
 * fade up as they cross the viewport; this reproduces that with an
 * IntersectionObserver flipping `data-revealed` and a CSS transition doing the
 * work, using the transition string captured verbatim from the live page.
 *
 * Honours `prefers-reduced-motion` purely in CSS (`motion-reduce:` variants force
 * the final state with no transition, so the content is never gated on JS for
 * those users), and reveals everything on the next frame if IntersectionObserver
 * is unavailable.
 */
export function Reveal({
  as = "div",
  variant = "body",
  children,
  className,
  delay = 0,
}: {
  as?: RevealTag;
  variant?: RevealVariant;
  children: ReactNode;
  className?: string;
  /** Stagger offset in milliseconds — the original staggers siblings by 60–90ms. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer support: reveal on the next frame rather than stranding content.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Narrowing to a single intrinsic tag keeps the ref type honest without `any`.
  const Tag = as as "div";

  return (
    <Tag
      ref={ref}
      data-revealed={shown ? "true" : "false"}
      className={cn(
        "will-change-[opacity,transform]",
        // prefers-reduced-motion: render the final state immediately, no transition.
        "motion-reduce:opacity-100! motion-reduce:transform-none! motion-reduce:transition-none!",
        className,
      )}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : REST_TRANSFORM[variant],
        transition:
          "opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: shown ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </Tag>
  );
}
