"use client";

import { useBoard } from "./use-board";

/**
 * How many machines are free right now.
 *
 * The earlier version listed every job, which meant the page filled with other people's
 * finished work: noise that told a visitor nothing about whether they could go. A visitor only
 * needs one number, and the one they need is whether there is a machine for them.
 */
export function MachinesFree() {
  const { board, free, queued: waiting } = useBoard();

  return (
    <span className="flex items-center gap-2 text-[12.5px]">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${free === 0 ? "bg-white/25" : "bg-[var(--kl-amber)]"}`}
      />
      <span className="kl-num text-white/70">
        {free === null ? "—" : `${free} of ${board!.concurrency}`}
      </span>
      <span className="text-white/45">
        {free === 1 ? "machine free" : "machines free"}
        {waiting > 0 ? <span className="text-white/30"> · {waiting} waiting</span> : null}
      </span>
    </span>
  );
}
