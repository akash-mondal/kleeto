"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { easeOutQuint, useInView, usePrefersReducedMotion, useRafLoop } from "./use-motion";

const DURATION_MS = 1400;

/** Splits `"8ms"` into `8` + `"ms"`, `"10×"` into `10` + `"×"`, and so on. */
function parse(value: string): { target: number; prefix: string; suffix: string } | null {
  const match = /^(\D*)(\d[\d,]*)(.*)$/.exec(value);
  if (!match) return null;
  const target = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;
  return { target, prefix: match[1], suffix: match[3] };
}

/**
 * Benchmark figures count up from zero the first time they scroll into view,
 * then hold — the behaviour measured on the live stat row
 * (`docs/research/INTERACTION_PATTERNS.md` §5).
 *
 * Anything that is not a plain number (or reduced motion) renders verbatim, so
 * the markup is identical to the static version and nothing can go missing.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const parsed = parse(value);
  // Armed a little before the figure actually appears, so the swap from the
  // server-rendered settled value to zero happens off-screen and the whole
  // ramp is visible.
  const { ref, inView } = useInView<HTMLSpanElement>({
    threshold: 0,
    rootMargin: "0px 0px 12% 0px",
    once: true,
  });
  const reduced = usePrefersReducedMotion();
  // `null` means the ramp has not run a frame yet, so the settled figure is
  // what gets server-rendered and what stands until the row scrolls into view.
  const [count, setCount] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const target = parsed?.target ?? 0;
  const running = Boolean(parsed) && inView && !reduced && !done;

  useRafLoop((elapsed) => {
    const t = Math.min(elapsed / DURATION_MS, 1);
    setCount(Math.round(target * easeOutQuint(t)));
    if (t >= 1) setDone(true);
  }, running);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  const shown = reduced || done || count === null ? target : count;

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {parsed.prefix}
      {shown.toLocaleString("en-US")}
      {parsed.suffix}
    </span>
  );
}
