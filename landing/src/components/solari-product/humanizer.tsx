"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { MockBar, MockChrome } from "./feature-card";
import { easeInOutCubic, easeOutBack, useInView, usePrefersReducedMotion, useRafLoop } from "./use-motion";

/**
 * The humanizer mock: a cursor crossing the page along a curved path.
 *
 * The section copy promises "curved trajectories", "variable velocity" and
 * "overshoot and settle", so the motion is built to be literally those three
 * things: position comes from a cubic Bézier (curved), the Bézier parameter is
 * driven by `easeOutBack` (slow-fast-slow, and it passes the target before
 * coming back), and the return leg uses `easeInOutCubic` so it never reads as
 * a linear teleport. Measured region on the live site is only 184×36px, so the
 * arc is kept shallow.
 */

/** Normalised control points, 0-1 in the mock's own box. */
const PATH = {
  p0: { x: 0.105, y: 0.305 },
  c1: { x: 0.32, y: 0.63 },
  c2: { x: 0.63, y: 0.04 },
  p1: { x: 0.845, y: 0.285 },
} as const;

function bezier(t: number): { x: number; y: number } {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * PATH.p0.x + b * PATH.c1.x + c * PATH.c2.x + d * PATH.p1.x,
    y: a * PATH.p0.y + b * PATH.c1.y + c * PATH.c2.y + d * PATH.p1.y,
  };
}

const TRAVEL_MS = 1800;
const HOLD_MS = 900;
const RETURN_MS = 1300;
const REST_MS = 500;
const CYCLE_MS = TRAVEL_MS + HOLD_MS + RETURN_MS + REST_MS;

/** Bézier parameter for a point in the cycle, plus how "arrived" we are. */
function cursorParam(elapsed: number): number {
  const t = elapsed % CYCLE_MS;
  if (t < TRAVEL_MS) return easeOutBack(t / TRAVEL_MS, 0.9);
  if (t < TRAVEL_MS + HOLD_MS) return 1;
  if (t < TRAVEL_MS + HOLD_MS + RETURN_MS) {
    return 1 - easeInOutCubic((t - TRAVEL_MS - HOLD_MS) / RETURN_MS);
  }
  return 0;
}

export function HumanizerMock({ url, className }: { url: string; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [arrived, setArrived] = useState(false);
  const arrivedRef = useRef(false);
  // Cached so the per-frame work never reads layout back out of the DOM.
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      sizeRef.current = { width: stage.clientWidth, height: stage.clientHeight };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useRafLoop((elapsed) => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const t = cursorParam(elapsed);
    const point = bezier(t);
    const { width, height } = sizeRef.current;
    cursor.style.transform = `translate3d(${point.x * width}px, ${point.y * height}px, 0)`;

    // One state flip per arrival rather than one per frame.
    const isArrived = t > 0.86;
    if (isArrived !== arrivedRef.current) {
      arrivedRef.current = isArrived;
      setArrived(isArrived);
    }
  }, inView && !reduced);

  const settled = reduced || arrived;

  return (
    <div ref={ref} className={cn("overflow-hidden rounded-[4px] border border-white/10 bg-[var(--sol-bg,#000)]", className)}>
      <MockChrome label={url} />
      <div ref={stageRef} className="relative flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <span
            data-lit={!settled}
            className={cn(
              "block h-[5px] w-[52px] rounded-[2px] bg-white/15 transition-colors duration-300",
              "data-[lit=true]:bg-sol-accent",
              "motion-reduce:transition-none",
            )}
          />
          <MockBar className="w-[26px]" />
          <MockBar className="w-[26px]" />
          <MockBar className="w-[26px]" />
          <span
            data-lit={settled}
            className={cn(
              "ml-auto block h-[13px] w-[36px] rounded-[3px] bg-white/15 transition-colors duration-300",
              "data-[lit=true]:bg-sol-accent",
              "motion-reduce:transition-none",
            )}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-[2px] border border-white/10 p-2">
              <MockBar className="w-3/4" />
              <MockBar className="w-1/2" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-[2px] border border-white/10 p-3">
          <MockBar className="w-5/6" />
          <MockBar className="w-2/3" />
          <MockBar className="w-1/2" />
        </div>
        <span
          ref={cursorRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 will-change-transform motion-reduce:hidden"
        >
          <svg width="14" height="17" viewBox="0 0 14 17" fill="none" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            <path
              d="M1 1L1 13.2L4.3 10.1L6.6 15.6L8.9 14.6L6.7 9.3L11.2 9.1L1 1Z"
              fill="#f5f5f3"
              stroke="#0b0b0b"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
