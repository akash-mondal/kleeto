"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Shared motion plumbing for the product-page loops.
 *
 * Everything here is deliberately dependency-free: `IntersectionObserver` to
 * decide whether a loop should run at all, `requestAnimationFrame` for the
 * frame-accurate pieces (counters, the humanizer cursor) and plain interval
 * stepping for the discrete state machines.
 */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Live `prefers-reduced-motion: reduce`. Read through `useSyncExternalStore`
 * so the value is correct on the very first client render and stays in sync if
 * the user flips the OS setting mid-session. False during SSR.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/**
 * Visibility gate. Unlike `Reveal` this keeps observing, because loops have to
 * stop again when the element scrolls back out of the viewport.
 */
export function useInView<T extends HTMLElement>(
  options?: { threshold?: number; rootMargin?: string; once?: boolean },
): { ref: React.RefObject<T | null>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const threshold = options?.threshold ?? 0.25;
  const rootMargin = options?.rootMargin ?? "0px";
  const once = options?.once ?? false;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      // Deferred rather than set inline: an effect body must not push state
      // synchronously, and this branch only exists for ancient browsers.
      const raf = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
          if (entry.isIntersecting && once) observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}

/**
 * Discrete loop driver: advances 0 → `steps - 1` and wraps, but only while
 * `active`. Reduced motion parks the machine on its last (settled) step.
 */
export function useLoopStep(steps: number, intervalMs: number, active: boolean): number {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced || !active) return;

    const id = window.setInterval(() => {
      setStep((current) => (current + 1) % steps);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [steps, intervalMs, active, reduced]);

  // Reduced motion parks the machine on its settled frame.
  return reduced ? steps - 1 : step;
}

/** easeOutQuint — the same curve the live site uses for its reveals. */
export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/** easeInOutCubic — slow start, quick middle, gentle landing. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * easeOutBack — overshoots past 1, then settles back. This is what makes the
 * humanizer cursor land slightly past its target and correct, which is exactly
 * what the surrounding copy claims the product does.
 */
export function easeOutBack(t: number, overshoot = 1.35): number {
  const c3 = overshoot + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}

/**
 * Runs `frame(elapsedMs)` on every animation frame while `active`. The clock
 * resets whenever the loop is re-armed so a loop never resumes mid-flight
 * after being parked off-screen.
 */
export function useRafLoop(frame: (elapsedMs: number) => void, active: boolean): void {
  const frameRef = useRef(frame);

  useEffect(() => {
    frameRef.current = frame;
  });

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      frameRef.current(now - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
