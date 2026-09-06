"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useInView, usePrefersReducedMotion } from "@/components/solari-product/use-motion";

/**
 * The hero's live meter. Seconds and dollars advance together in real time,
 * at desktop-2's real rate, because that is the thesis: the meter and the
 * payment are the same event.
 *
 * Seed: 252 s elapsed, $0.0104 spent. Rate: $0.1483/hr = $0.00004119/s, so the
 * fourth decimal moves about every 2.4 s. Pauses off-screen (the clock stops
 * where it was and resumes from there) and freezes on the seed under reduced
 * motion.
 */
const SEED_SECONDS = 252;
const SEED_DOLLARS = 0.0104;
const RATE_PER_SECOND = 0.1483 / 3600;
const LANE = "desktop-2";
const SPEC = "2 vCPU · 4 GB · Xfce · up in 1.3s";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function clock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function dollars(seconds: number): string {
  // Floor, never round: a meter only shows money that has actually elapsed.
  const raw = SEED_DOLLARS + (seconds - SEED_SECONDS) * RATE_PER_SECOND;
  return `$${(Math.floor(raw * 10000) / 10000).toFixed(4)}`;
}

export function MeterHud({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  const reduced = usePrefersReducedMotion();

  // Whole seconds only. Storing the frame time would re-render 60x a second
  // for nothing; the display only changes once per second.
  const [seconds, setSeconds] = useState(SEED_SECONDS);
  const [cents, setCents] = useState(Math.round(SEED_DOLLARS * 10000));
  // Milliseconds accumulated across previous on-screen stretches.
  const bankedMs = useRef(0);

  const running = inView && !reduced;

  useEffect(() => {
    if (!running) return;

    let raf = 0;
    const start = performance.now();
    let lastElapsed = 0;

    const tick = (now: number) => {
      lastElapsed = now - start;
      const total = (bankedMs.current + lastElapsed) / 1000;
      const whole = SEED_SECONDS + Math.floor(total);
      const spent = SEED_DOLLARS + total * RATE_PER_SECOND;
      setSeconds(whole);
      setCents(Math.floor(spent * 10000));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      bankedMs.current += lastElapsed;
    };
  }, [running]);

  const shownSeconds = reduced ? SEED_SECONDS : seconds;
  const shownDollars = reduced ? dollars(SEED_SECONDS) : `$${(cents / 10000).toFixed(4)}`;

  return (
    <div
      ref={ref}
      role="status"
      aria-live="off"
      aria-label={`${LANE} running, ${clock(shownSeconds)} elapsed, ${shownDollars} spent`}
      className={cn(
        "kl-card-deep kl-num w-full max-w-[320px] rounded-[16px] border border-white/10 px-4 py-3.5 text-left shadow-[0_18px_40px_-24px_oklch(0.14_0.01_85/0.6)] sm:max-w-none sm:px-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {/* left: live dot + lane + state */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
            <span
              className={cn(
                "absolute inline-flex size-full rounded-full bg-[var(--kl-amber)] opacity-60",
                running && "animate-ping motion-reduce:animate-none",
              )}
            />
            <span className="relative inline-flex size-full rounded-full bg-[var(--kl-amber)]" />
          </span>
          <span className="text-[13px] leading-none text-kl-on-card">{LANE}</span>
          <span className="text-[11px] leading-none tracking-[0.14em] text-kl-on-card-muted uppercase">
            running
          </span>
        </div>

        {/* middle + right: the two numbers that move together */}
        <div className="flex items-baseline justify-between gap-6 sm:justify-end">
          <span className="text-[20px] leading-none text-kl-on-card sm:text-[22px]" aria-hidden="true">
            {clock(shownSeconds)}
          </span>
          <span className="text-[20px] leading-none text-kl-amber sm:text-[22px]" aria-hidden="true">
            {shownDollars}
          </span>
        </div>
      </div>

      <p className="mt-3 border-t border-white/10 pt-2.5 text-[11px] leading-none text-kl-on-card-muted">
        {SPEC}
      </p>
    </div>
  );
}
