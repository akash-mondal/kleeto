"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { useInView, usePrefersReducedMotion } from "./use-motion";

/**
 * A terminal that types itself out while the state chips beneath it advance.
 *
 * The script, the state chips and the frame title are all props, so the meter
 * section scripts a lease's own lifecycle into it; the defaults are a placeholder.
 */
export type TerminalPhase = "running" | "paused" | "resuming";

type LineTone = "prompt" | "info" | "ok";

export type TerminalLine = {
  readonly text: string;
  readonly tone: LineTone;
  readonly phase: Exclude<TerminalPhase, "resuming">;
};

export type TerminalState = { readonly phase: TerminalPhase; readonly note: string };

const DEFAULT_LINES: readonly TerminalLine[] = [
  { text: "$ python train.py", tone: "prompt", phase: "running" },
  { text: "[10:21:15] Processing batch 42/100", tone: "info", phase: "running" },
  { text: "[10:21:16] Checkpoint saved", tone: "ok", phase: "running" },
  { text: "$ sandbox.pause()", tone: "prompt", phase: "paused" },
  { text: "[10:22:01] Filesystem preserved", tone: "info", phase: "paused" },
  { text: "[10:22:01] Process state retained", tone: "info", phase: "paused" },
  { text: "[10:22:02] Environment paused", tone: "ok", phase: "paused" },
];

const DEFAULT_STATES: readonly TerminalState[] = [
  { phase: "running", note: "Processing task" },
  { phase: "paused", note: "State saved" },
  { phase: "resuming", note: "Continuing task" },
];

const DEFAULT_LABELS: Record<TerminalPhase, string> = {
  running: "RUNNING",
  paused: "PAUSED",
  resuming: "RESUMING",
};

const TONE_CLASS: Record<LineTone, string> = {
  prompt: "text-white",
  info: "text-[#bbc7c6]",
  ok: "text-sol-accent",
};

/** Per-character typing speed and the beat between lines. */
const CHAR_MS = 26;
const LINE_GAP_MS = 380;
/** Tail of the loop: hold on PAUSED, then advance to RESUMING before restarting. */
const PAUSED_HOLD_MS = 900;
const RESUMING_MS = 1900;

type Frame = { lineIndex: number; chars: number; phase: TerminalPhase };

type Script = {
  lines: readonly TerminalLine[];
  typeEndMs: number;
  loopMs: number;
  settled: Frame;
};

function buildScript(lines: readonly TerminalLine[]): Script {
  const typeEndMs = lines.reduce((total, line) => total + line.text.length * CHAR_MS + LINE_GAP_MS, 0);
  return {
    lines,
    typeEndMs,
    loopMs: typeEndMs + PAUSED_HOLD_MS + RESUMING_MS,
    settled: { lineIndex: lines.length, chars: 0, phase: "resuming" },
  };
}

function frameAt(script: Script, elapsed: number): Frame {
  const { lines, typeEndMs } = script;
  if (elapsed >= typeEndMs + PAUSED_HOLD_MS) return script.settled;
  if (elapsed >= typeEndMs) return { lineIndex: lines.length, chars: 0, phase: "paused" };

  let start = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const typing = line.text.length * CHAR_MS;
    if (elapsed < start + typing) {
      return {
        lineIndex: index,
        chars: Math.floor((elapsed - start) / CHAR_MS),
        phase: line.phase,
      };
    }
    if (elapsed < start + typing + LINE_GAP_MS) {
      return { lineIndex: index, chars: line.text.length, phase: line.phase };
    }
    start += typing + LINE_GAP_MS;
  }

  return { lineIndex: lines.length, chars: 0, phase: "paused" };
}

function sameFrame(a: Frame, b: Frame) {
  return a.lineIndex === b.lineIndex && a.chars === b.chars && a.phase === b.phase;
}

/**
 * Terminal + state-chip loop. One `requestAnimationFrame` clock drives both, so
 * the chips can never disagree with the line currently being typed. The clock
 * only advances while the card is on screen, and `prefers-reduced-motion` pins
 * it to the settled end state with no loop at all.
 */
export function StatefulTerminal({
  className,
  lines = DEFAULT_LINES,
  states = DEFAULT_STATES,
  labels,
  title = "sandbox-session",
}: {
  className?: string;
  lines?: readonly TerminalLine[];
  states?: readonly TerminalState[];
  /** Chip text per phase; defaults to RUNNING / PAUSED / RESUMING. */
  labels?: Partial<Record<TerminalPhase, string>>;
  /** Frame header text. */
  title?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0, rootMargin: "0px 0px -5% 0px" });
  const reduced = usePrefersReducedMotion();
  const script = useMemo(() => buildScript(lines), [lines]);
  const elapsedRef = useRef(0);
  const [played, setPlayed] = useState<Frame>(() => frameAt(script, 0));

  // Derived, never written: reduced motion renders the settled end state.
  const frame = reduced ? script.settled : played;

  useEffect(() => {
    if (reduced || !inView) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      elapsedRef.current = (elapsedRef.current + (now - last)) % script.loopMs;
      last = now;
      const next = frameAt(script, elapsedRef.current);
      setPlayed((prev) => (sameFrame(prev, next) ? prev : next));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, script]);

  const typing = frame.lineIndex < script.lines.length;

  return (
    <div ref={ref} className={cn("flex flex-col gap-5", className)}>
      <div className="overflow-hidden rounded-[4px] border border-white/10 bg-[var(--sol-bg,#000)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="font-mono text-[8px] tracking-[0.16em] text-sol-muted uppercase">
            {title}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.16em] text-sol-accent uppercase">
            <span
              aria-hidden
              className={cn(
                "inline-block size-[5px] rounded-full bg-sol-accent",
                !reduced && inView && "animate-pulse",
              )}
            />
            Agent runtime
          </span>
        </div>

        {/* Height is pinned to the full script so typing never reflows the card. */}
        <div
          aria-live="off"
          className="flex min-h-[172px] flex-col justify-start gap-1 px-3 py-3 font-mono text-[9px] leading-[1.6]"
        >
          {script.lines.map((line, index) => {
            const done = index < frame.lineIndex;
            const current = index === frame.lineIndex;
            if (!done && !current) return null;
            const text = done ? line.text : line.text.slice(0, frame.chars);
            return (
              <p key={line.text} className={cn("truncate", TONE_CLASS[line.tone])}>
                {text}
                {current ? (
                  <span aria-hidden className="ml-px inline-block w-[5px] animate-pulse text-sol-accent">
                    ▌
                  </span>
                ) : null}
              </p>
            );
          })}
          {!typing ? (
            <p className="text-white">
              $
              <span aria-hidden className="ml-1 inline-block w-[5px] animate-pulse text-sol-accent">
                ▌
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {states.map((state) => {
          const active = state.phase === frame.phase;
          return (
            <div
              key={state.phase}
              data-active={active}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[2px] border border-b-2 border-white/10 px-2 py-3 text-center",
                "transition-[border-color,background-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none",
                active
                  ? "border-b-sol-accent bg-sol-accent/[0.06] opacity-100"
                  : "border-b-white/10 opacity-45",
              )}
            >
              <span
                className={cn(
                  "font-mono text-[9px] tracking-[0.16em] uppercase transition-colors duration-300",
                  active ? "text-sol-accent" : "text-sol-muted",
                )}
              >
                {labels?.[state.phase] ?? DEFAULT_LABELS[state.phase]}
              </span>
              <span className="text-[10px] text-sol-muted">{state.note}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
