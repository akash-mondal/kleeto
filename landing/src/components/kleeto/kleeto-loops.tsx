"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Badge, MockFrame } from "@/components/solari-product/mocks";
import {
  useInView,
  useLoopStep,
  usePrefersReducedMotion,
  useRafLoop,
} from "@/components/solari-product/use-motion";

/**
 * Kleeto's own in-card loops for the Included carousel. Same contract as the
 * Solari loops: an IntersectionObserver gate, discrete steps driving CSS
 * transitions, and the settled frame under `prefers-reduced-motion: reduce`.
 * The MockFrame's `bg-black` is overridden to the warm deep card here.
 */

const FRAME = "bg-[var(--kl-card-deep)]";

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

/* ---------------------------------------------------------------- HashLoop */

const HASH_FILES = [
  { name: "report.pdf", hash: "4b1e…9d02" },
  { name: "chart.png", hash: "a7c3…51f8" },
  { name: "data.csv", hash: "e09d…b46a" },
] as const;

const TYPE_MS = 110; // per character
const FILE_GAP_MS = 320;
const ROOT_DELAY_MS = 500;
const HASH_HOLD_MS = 2400;
const HASH_CHARS = HASH_FILES[0].hash.length;
const FILE_MS = HASH_CHARS * TYPE_MS + FILE_GAP_MS;
const HASH_CYCLE_MS = HASH_FILES.length * FILE_MS + ROOT_DELAY_MS + HASH_HOLD_MS;

/**
 * Artifact hashing, each file's sha256 is typed in, then the merkle root row
 * lights amber. The per-frame work only pushes state when the visible
 * character count actually changes.
 */
export function HashLoop({ label = "artifacts", root = "7f3a…c19e", className }: {
  label?: string;
  root?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  // Characters typed so far, cumulative across the three files.
  const [typed, setTyped] = useState(0);
  const [rooted, setRooted] = useState(false);

  useRafLoop((elapsed) => {
    const t = elapsed % HASH_CYCLE_MS;
    let count = 0;
    for (let i = 0; i < HASH_FILES.length; i += 1) {
      const local = t - i * FILE_MS;
      if (local <= 0) break;
      count += Math.min(HASH_CHARS, Math.floor(local / TYPE_MS));
    }
    const isRooted = t > HASH_FILES.length * FILE_MS + ROOT_DELAY_MS;
    setTyped((prev) => (prev === count ? prev : count));
    setRooted((prev) => (prev === isRooted ? prev : isRooted));
  }, inView && !reduced);

  const total = HASH_FILES.length * HASH_CHARS;
  const shown = reduced ? total : typed;
  const settled = reduced || rooted;

  return (
    <div ref={ref}>
      <MockFrame className={cn(FRAME, className)}>
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <Badge tone="muted">{label}</Badge>
          <span className="flex items-center gap-1.5">
            <LiveDot active={inView && !settled} />
            <Badge>{settled ? "Rooted" : "Hashing"}</Badge>
          </span>
        </div>
        <div className="flex flex-col divide-y divide-white/[0.06]">
          {HASH_FILES.map((file, index) => {
            const chars = Math.max(0, Math.min(HASH_CHARS, shown - index * HASH_CHARS));
            const typing = chars > 0 && chars < HASH_CHARS;
            return (
              <div key={file.name} className="flex items-center gap-3 px-3 py-2">
                <Badge tone="muted">sha256</Badge>
                <span className="flex-1 truncate font-mono text-[9px] text-[var(--kl-on-card)]">{file.name}</span>
                <span className="font-mono text-[9px] text-sol-muted tabular-nums">
                  {file.hash.slice(0, chars)}
                  {typing ? <span className="text-sol-accent">_</span> : null}
                  {chars === 0 ? <span className="opacity-40"></span> : null}
                </span>
              </div>
            );
          })}
          <div
            data-lit={settled}
            className={cn(
              "flex items-center gap-3 px-3 py-2 opacity-35",
              "transition-opacity duration-500 ease-out data-[lit=true]:opacity-100",
              "motion-reduce:opacity-100 motion-reduce:transition-none",
            )}
          >
            <Badge>root</Badge>
            <span className="flex-1 truncate font-mono text-[9px] text-sol-muted">merkle · {HASH_FILES.length} leaves</span>
            <span
              className={cn(
                "font-mono text-[9px] tabular-nums transition-colors duration-500",
                settled ? "text-sol-accent" : "text-sol-muted",
                "motion-reduce:transition-none",
              )}
            >
              {root}
            </span>
          </div>
        </div>
      </MockFrame>
    </div>
  );
}

/* ------------------------------------------------------------- CeilingLoop */

const CAP_PERCENT = 74;

/**
 * Budget ceiling, the amber bar fills toward the cap line and stops exactly
 * at it; the footer flips to PAUSED AT CAP with the refund.
 * Steps: 0 reset · 1–2 filling · 3 paused (settled).
 */
export function CeilingLoop({
  label = "ceiling",
  cap = "12,000 credits",
  maxDuration = "30 min",
  used = "8,880",
  refund = "3,120 credits",
  className,
}: {
  label?: string;
  cap?: string;
  maxDuration?: string;
  used?: string;
  refund?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const step = useLoopStep(4, 1150, inView);
  const filling = step >= 1;
  const paused = step === 3;

  return (
    <div ref={ref}>
      <MockFrame className={cn(FRAME, className)}>
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <Badge tone="muted">{label}</Badge>
          <span className="flex items-center gap-1.5">
            <LiveDot active={inView && !paused} />
            <Badge tone={paused ? "muted" : "accent"}>{paused ? "Paused" : "Running"}</Badge>
          </span>
        </div>
        <div className="flex flex-col gap-3 px-3 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-[var(--kl-on-card)]">cap {cap}</span>
            <span className="font-mono text-[9px] text-sol-muted">max {maxDuration}</span>
          </div>
          <div className="relative h-[10px] w-full rounded-[2px] bg-white/[0.06]">
            <span
              className={cn(
                "absolute inset-y-0 left-0 rounded-[2px] bg-sol-accent",
                filling ? "transition-[width] duration-[2200ms] ease-out" : "transition-none",
                "motion-reduce:transition-none",
              )}
              style={{ width: `${filling ? CAP_PERCENT : 0}%` }}
            />
            {/* the cap line */}
            <span
              aria-hidden
              className="absolute -top-[4px] -bottom-[4px] w-px bg-[var(--kl-on-card)]"
              style={{ left: `${CAP_PERCENT}%` }}
            />
            <span
              aria-hidden
              className="absolute -top-[13px] -translate-x-1/2 font-mono text-[7px] tracking-[0.16em] text-sol-muted uppercase"
              style={{ left: `${CAP_PERCENT}%` }}
            >
              cap
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-sol-muted tabular-nums">
              used {paused ? used : "…"} / {cap.split(" ")[0]}
            </span>
          </div>
        </div>
        <div className="border-t border-white/10 px-3 py-2 text-center">
          <span
            key={paused ? "paused" : "running"}
            className={cn(
              "font-mono text-[8px] tracking-[0.16em] uppercase",
              paused ? "text-sol-accent" : "text-sol-muted",
            )}
          >
            {paused ? `Paused at cap · refund ${refund}` : "Meter running · cap armed"}
          </span>
        </div>
      </MockFrame>
    </div>
  );
}

/* ------------------------------------------------------------- HandoffLoop */

const HANDOFF_STOPS = [
  { label: "Agent", caption: "agent driving" },
  { label: "Human", caption: "human took over" },
  { label: "Agent", caption: "agent resumed" },
] as const;

const STOP_X = [10, 50, 90] as const;

/**
 * Human takeover, a dot travels a three-stop track, AGENT → HUMAN → AGENT,
 * each stop lighting as it arrives. Steps: 0 · 1 · 2 land on the stops, 3
 * holds on the last one so the wrap back to 0 reads as a restart.
 */
export function HandoffLoop({ label = "desktop-2 · control", rate = "53000 tinybar/s", className }: {
  label?: string;
  rate?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const step = useLoopStep(4, 1300, inView);
  const at = Math.min(step, HANDOFF_STOPS.length - 1);
  const stop = HANDOFF_STOPS[at];

  return (
    <div ref={ref}>
      <MockFrame className={cn(FRAME, className)}>
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <Badge tone="muted">{label}</Badge>
          <span className="flex items-center gap-1.5">
            <LiveDot active={inView} />
            <Badge>{at === 1 ? "Human" : "Agent"}</Badge>
          </span>
        </div>
        <div className="px-3 pt-6 pb-3">
          <div className="relative h-px w-full bg-white/12">
            <span
              className={cn(
                "absolute inset-y-0 left-0 bg-sol-accent/60",
                step === 0 ? "transition-none" : "transition-[width] duration-[900ms] ease-in-out",
                "motion-reduce:transition-none",
              )}
              style={{ width: `${STOP_X[at]}%` }}
            />
            {HANDOFF_STOPS.map((s, index) => (
              <span
                key={index}
                data-lit={index <= at}
                className={cn(
                  "absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-[var(--kl-card-deep)]",
                  "transition-colors duration-300 ease-out",
                  "data-[lit=true]:border-sol-accent data-[lit=true]:bg-sol-accent/30",
                  "motion-reduce:transition-none",
                )}
                style={{ left: `${STOP_X[index]}%` }}
              >
                <span
                  className={cn(
                    "absolute top-[12px] left-1/2 -translate-x-1/2 font-mono text-[8px] tracking-[0.16em] uppercase whitespace-nowrap",
                    index === at ? "text-[var(--kl-on-card)]" : "text-sol-muted",
                  )}
                >
                  {s.label}
                </span>
              </span>
            ))}
            {/* the travelling dot */}
            <span
              className={cn(
                "absolute top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sol-accent",
                step === 0 ? "transition-none" : "transition-[left] duration-[900ms] ease-in-out",
                "motion-reduce:transition-none",
              )}
              style={{ left: `${STOP_X[at]}%` }}
            />
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span key={stop.caption} className="font-mono text-[9px] text-[var(--kl-on-card)]">
              {stop.caption}
            </span>
            <span className="font-mono text-[8px] text-sol-muted tabular-nums">meter · {rate}</span>
          </div>
        </div>
      </MockFrame>
    </div>
  );
}
