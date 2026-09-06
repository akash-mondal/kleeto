"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { Badge, MockFrame } from "./mocks";
import { easeOutQuint, useInView, useLoopStep, usePrefersReducedMotion, useRafLoop } from "./use-motion";

/**
 * The in-card loops for the Browsers feature carousel.
 *
 * Each mock reproduces one of the animations measured off the live site
 * (`docs/research/INTERACTION_PATTERNS.md` §3). They all share the same
 * contract: an `IntersectionObserver` gate so nothing animates off-screen, a
 * discrete step machine (`useLoopStep`) driving CSS transitions rather than
 * keyframes, and a settled final frame under `prefers-reduced-motion: reduce`.
 */

/** Small amber dot that breathes while a stream is live. */
function LiveDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-[4px] rounded-full bg-sol-accent",
        active && "animate-pulse motion-reduce:animate-none",
      )}
    />
  );
}

/** Amber fill that grows to `percent`. Snaps back with no transition at 0. */
function FillBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <span className={cn("block h-px w-full bg-white/10", className)}>
      <span
        className={cn(
          "block h-full bg-sol-accent",
          percent === 0 ? "transition-none" : "transition-[width] duration-[900ms] ease-linear",
        )}
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

/** Counts 0 → `target` on an easeOutQuint ramp while `active`. */
function useCountUp(target: number, durationMs: number, active: boolean): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  // The rAF run resets itself to 0 each time it is re-armed and holds the
  // final figure in between, so nothing has to be pushed from an effect.
  useRafLoop(
    (elapsed) => {
      const t = Math.min(elapsed / durationMs, 1);
      setValue(Math.round(target * easeOutQuint(t)));
    },
    active && !reduced,
  );

  return reduced ? target : value;
}

export type TelemetryRow = { tag: string; text: string; meta: string };

/**
 * Browser telemetry — log rows stream in one at a time, the LIVE TELEMETRY dot
 * pulses, and an amber progress bar fills across the cycle.
 */
export function TelemetryLoop({
  label,
  badge,
  rows,
  className,
}: {
  label: string;
  badge: string;
  rows: readonly TelemetryRow[];
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const steps = rows.length + 1;
  const step = useLoopStep(steps, 900, inView);

  return (
    <div ref={ref}>
      <MockFrame className={className}>
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <Badge tone="muted">{label}</Badge>
          <span className="flex items-center gap-1.5">
            <LiveDot active={inView} />
            <Badge>{badge}</Badge>
          </span>
        </div>
        <div className="flex flex-col divide-y divide-white/[0.06]">
          {rows.map((row, index) => (
            <div
              key={row.text}
              data-shown={index <= step}
              className={cn(
                "flex translate-y-[6px] items-center gap-3 px-3 py-2 opacity-0",
                "transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "data-[shown=true]:translate-y-0 data-[shown=true]:opacity-100",
                "motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
              )}
            >
              <Badge>{row.tag}</Badge>
              <span className="flex-1 truncate font-mono text-[9px] text-[#bbc7c6]">{row.text}</span>
              <span className="font-mono text-[8px] text-sol-muted">{row.meta}</span>
            </div>
          ))}
        </div>
        <FillBar percent={step === 0 ? 0 : ((step + 1) / steps) * 100} />
      </MockFrame>
    </div>
  );
}

/** The frame-time curve drawn by the GPU card, in a 0-100 × 0-40 view box. */
const FPS_CURVE = "M0 33 C 12 32, 20 30, 30 27 C 42 23, 48 12, 62 9 C 74 6, 86 5, 100 4";
const FPS_BASELINE = "M0 36 C 16 35, 30 34, 46 32 C 64 30, 80 28, 100 26";

/**
 * GPU acceleration — the line chart draws left to right via
 * `stroke-dasharray`/`stroke-dashoffset`, `120 FPS` counts up alongside it and
 * the three metric bars fill.
 */
export function GpuLoop({
  label,
  fps = 120,
  metrics,
  className,
}: {
  label: string;
  fps?: number;
  metrics: readonly { label: string; value: string; fill: number }[];
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  // Two phases only: 0 resets the stroke instantly, 1 draws it over 2.4s.
  const phase = useLoopStep(2, 2600, inView);
  const drawn = reduced || phase === 1;
  const count = useCountUp(fps, 2000, inView && phase === 1);

  return (
    <div ref={ref}>
      <MockFrame className={className}>
        <div className="border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <Badge tone="muted">{label}</Badge>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] divide-x divide-white/10">
          <div className="flex flex-col gap-3 p-3">
            <div className="flex items-end gap-1">
              <span className="text-[30px] leading-none text-sol-accent tabular-nums">
                {reduced ? fps : count}
              </span>
              <span className="pb-1 font-mono text-[9px] tracking-[0.16em] text-sol-muted uppercase">
                FPS
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex flex-col gap-1">
                  <span className="flex items-center justify-between">
                    <Badge tone="muted">{metric.label}</Badge>
                    <span className="font-mono text-[9px] text-[#bbc7c6]">{metric.value}</span>
                  </span>
                  <FillBar percent={drawn ? metric.fill : 0} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <Badge tone="muted">Frame performance</Badge>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-[86px] w-full" aria-hidden>
              {[0, 10, 20, 30, 40].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
              ))}
              {[0, 25, 50, 75, 100].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="40" stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
              ))}
              <path
                d={FPS_BASELINE}
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={drawn ? 0 : 1}
                className={cn(
                  drawn ? "transition-[stroke-dashoffset] duration-[2400ms] ease-out" : "transition-none",
                  "motion-reduce:transition-none",
                )}
              />
              <path
                d={FPS_CURVE}
                fill="none"
                stroke="var(--sol-accent)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={drawn ? 0 : 1}
                className={cn(
                  drawn ? "transition-[stroke-dashoffset] duration-[2200ms] ease-out" : "transition-none",
                  "motion-reduce:transition-none",
                )}
              />
            </svg>
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

/**
 * Managed authentication — SESSION 01→04 tiles light in sequence, then the
 * footer confirms TOKEN REFRESHED · SESSION PRESERVED.
 */
export function AuthLoop({
  label,
  tiles,
  footer,
  badges = { active: "Signing in", settled: "Verified" },
  className,
}: {
  label: string;
  tiles: readonly string[];
  footer: string;
  /** Header badge while tiles are lighting vs once the footer has lit. */
  badges?: { active: string; settled: string };
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const steps = tiles.length + 1;
  const step = useLoopStep(steps, 700, inView);
  const settled = step === steps - 1;

  return (
    <div ref={ref}>
      <MockFrame className={className}>
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <Badge tone="muted">{label}</Badge>
          <span className="flex items-center gap-1.5">
            <LiveDot active={inView && !settled} />
            <Badge>{settled ? badges.settled : badges.active}</Badge>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {tiles.map((tile, index) => (
            <span
              key={tile}
              data-lit={index <= step}
              className={cn(
                "rounded-[2px] border border-white/10 bg-white/[0.03] px-2 py-2 text-center",
                "font-mono text-[8px] tracking-[0.12em] text-[#bbc7c6] uppercase",
                "transition-[color,border-color,background-color] duration-300 ease-out",
                "data-[lit=true]:border-sol-accent/60 data-[lit=true]:bg-sol-accent/10 data-[lit=true]:text-sol-accent",
                "motion-reduce:transition-none",
              )}
            >
              {tile}
            </span>
          ))}
        </div>
        <div
          data-lit={settled}
          className={cn(
            "border-t border-white/10 px-3 py-2 text-center opacity-30",
            "transition-opacity duration-500 ease-out data-[lit=true]:opacity-100",
            "motion-reduce:opacity-100 motion-reduce:transition-none",
          )}
        >
          <Badge>{footer}</Badge>
        </div>
      </MockFrame>
    </div>
  );
}

export type StealthStage = {
  label: string;
  tone: "blocked" | "live" | "done";
  /** How much of the route is drawn at this stage, 0–1. */
  draw: number;
  /** Optional header badge for this stage; falls back to the blocked/cleared pair. */
  badge?: string;
};

const STEALTH_STAGES: readonly StealthStage[] = [
  { label: "Route blocked · 403", tone: "blocked", draw: 0 },
  { label: "Residential route", tone: "live", draw: 0.55 },
  { label: "CAPTCHA resolved", tone: "live", draw: 1 },
  { label: "Continue", tone: "done", draw: 1 },
];

/**
 * Stealth mode — the route animates from origin, through the residential hop,
 * to the destination, with the status cycling blocked → routed → resolved.
 */
export function StealthLoop({
  label,
  stages = STEALTH_STAGES,
  origin = "Origin",
  target = "Target",
  via,
  badges = { blocked: "Retrying", cleared: "Cleared" },
  className,
}: {
  label: string;
  /** Status sequence; each stage draws the route up to `draw`. */
  stages?: readonly StealthStage[];
  /** Footer labels at the two ends of the route. */
  origin?: string;
  target?: string;
  /** Optional label for the middle hop, drawn above it. Omitted by default. */
  via?: string;
  badges?: { blocked: string; cleared: string };
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const step = useLoopStep(stages.length, 1300, inView);
  const stage = stages[step];
  const nodesLit = reduced ? 3 : step;

  return (
    <div ref={ref}>
      <MockFrame className={className}>
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <Badge tone="muted">{label}</Badge>
          <Badge tone={stage.tone === "blocked" ? "muted" : "accent"}>
            {stage.badge ?? (stage.tone === "blocked" ? badges.blocked : badges.cleared)}
          </Badge>
        </div>
        <div className="p-3">
          {via ? (
            <div className="-mb-2 text-center">
              <Badge tone="muted">{via}</Badge>
            </div>
          ) : null}
          <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="h-[76px] w-full" aria-hidden>
            <path
              d="M8 26 C 26 26, 30 8, 50 8 C 70 8, 74 26, 92 26"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="3 3"
            />
            <path
              d="M8 26 C 26 26, 30 8, 50 8 C 70 8, 74 26, 92 26"
              fill="none"
              stroke="var(--sol-accent)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={reduced ? 0 : 1 - stage.draw}
              className={cn(
                stage.draw === 0
                  ? "transition-none"
                  : "transition-[stroke-dashoffset] duration-[1100ms] ease-in-out",
                "motion-reduce:transition-none",
              )}
            />
            {[
              { x: 8, y: 26 },
              { x: 50, y: 8 },
              { x: 92, y: 26 },
            ].map((node, index) => (
              <circle
                key={node.x}
                cx={node.x}
                cy={node.y}
                r="2.4"
                vectorEffect="non-scaling-stroke"
                fill={index <= nodesLit ? "var(--sol-accent)" : "#0b0b0b"}
                stroke={index <= nodesLit ? "var(--sol-accent)" : "rgba(255,255,255,0.25)"}
                strokeWidth="1"
                className="transition-[fill,stroke] duration-300 ease-out motion-reduce:transition-none"
              />
            ))}
          </svg>
          <div className="mt-2 flex items-center justify-between">
            <Badge tone="muted">{origin}</Badge>
            <span
              key={stage.label}
              className={cn(
                "font-mono text-[8px] tracking-[0.16em] uppercase",
                stage.tone === "blocked" ? "text-[#e2685f]" : "text-sol-accent",
              )}
            >
              {stage.label}
            </span>
            <Badge tone="muted">{target}</Badge>
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

/**
 * Live session replay — the scrubber head travels the timeline, keyframe dots
 * light as it passes them, and the RECORDED dot pulses.
 */
export function ReplayLoop({
  label,
  keyframes,
  className,
}: {
  label: string;
  keyframes: readonly { at: number; tag: string; text: string; meta: string }[];
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const stops = keyframes.length + 1;
  const step = useLoopStep(stops, 1100, inView);
  const head = reduced ? 100 : (step / (stops - 1)) * 100;
  const active = keyframes[Math.min(step, keyframes.length - 1)];

  return (
    <div ref={ref}>
      <MockFrame className={className}>
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <Badge tone="muted">{label}</Badge>
          <span className="flex items-center gap-1.5">
            <LiveDot active={inView} />
            <Badge>Recorded</Badge>
          </span>
        </div>
        <div className="px-3 pt-5 pb-3">
          <div className="relative h-px w-full bg-white/12">
            <span
              className={cn(
                "absolute inset-y-0 left-0 bg-sol-accent",
                step === 0 ? "transition-none" : "transition-[width] duration-[1100ms] ease-linear",
              )}
              style={{ width: `${head}%` }}
            />
            {keyframes.map((frame) => (
              <span
                key={frame.text}
                data-lit={head >= frame.at}
                className={cn(
                  "absolute top-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-white/25 bg-[#0b0b0b]",
                  "transition-colors duration-300 ease-out",
                  "data-[lit=true]:border-sol-accent data-[lit=true]:bg-sol-accent",
                  "motion-reduce:transition-none",
                )}
                style={{ left: `${frame.at}%` }}
              />
            ))}
            <span
              className={cn(
                "absolute top-1/2 h-[14px] w-px -translate-x-1/2 -translate-y-1/2 bg-sol-accent",
                step === 0 ? "transition-none" : "transition-[left] duration-[1100ms] ease-linear",
              )}
              style={{ left: `${head}%` }}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Badge>{active.tag}</Badge>
            <span className="flex-1 truncate font-mono text-[9px] text-[#bbc7c6]">{active.text}</span>
            <span className="font-mono text-[8px] text-sol-muted">{active.meta}</span>
          </div>
        </div>
      </MockFrame>
    </div>
  );
}
