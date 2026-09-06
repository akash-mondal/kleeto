"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./aurora.module.css";
import { useInView } from "./use-motion";

/**
 * The looping amber glow that drifts behind the three-up feature rows on
 * /sandboxes ("Fast. Scalable. Stateful.") and /desktops ("Built for the work
 * agents actually do").
 *
 * Continuous, not scroll-triggered — but parked via IntersectionObserver while
 * the card is off screen. See `aurora.module.css` for what was measured.
 */
export function AuroraGlow({ active }: { active: boolean }) {
  return (
    <div aria-hidden data-active={active} className={styles.layer}>
      <span className={cn(styles.blob, styles.primary)} />
      <span className={cn(styles.blob, styles.secondary)} />
    </div>
  );
}

/**
 * Card shell that owns the glow. It carries the border, radius, panel fill and
 * clipping that `FeatureCard` would normally draw, so the card passed as
 * `children` should be rendered transparent and border-less on top of it.
 */
export function AuroraCard({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0, rootMargin: "0px 0px -5% 0px" });

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[4px] border border-white/10 bg-sol-panel",
        className,
      )}
    >
      <AuroraGlow active={inView} />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
