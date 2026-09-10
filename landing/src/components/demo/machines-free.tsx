"use client";

import { useEffect, useState } from "react";

/**
 * How many machines are free right now.
 *
 * The earlier version listed every job, which meant the page filled with other people's
 * finished work: noise that told a visitor nothing about whether they could go. A visitor only
 * needs one number, and the one they need is whether there is a machine for them.
 */
type Board = { concurrency: number; running: number; queued: number };

const GATEWAY = process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

export function MachinesFree() {
  const [b, setB] = useState<Board | null>(null);

  useEffect(() => {
    let alive = true;
    const read = async () => {
      try {
        const r = await fetch(`${GATEWAY}/v1/jobs`, { cache: "no-store" });
        if (r.ok && alive) setB(await r.json());
      } catch { /* a failed poll should not shout; the dash says enough */ }
    };
    read();
    const t = setInterval(read, 4000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const free = b ? Math.max(0, b.concurrency - b.running) : null;
  const waiting = b?.queued ?? 0;

  return (
    <span className="flex items-center gap-2 text-[12.5px]">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${free === 0 ? "bg-white/25" : "bg-[var(--kl-amber)]"}`}
      />
      <span className="kl-num text-white/70">
        {free === null ? "—" : `${free} of ${b!.concurrency}`}
      </span>
      <span className="text-white/45">
        {free === 1 ? "machine free" : "machines free"}
        {waiting > 0 ? <span className="text-white/30"> · {waiting} waiting</span> : null}
      </span>
    </span>
  );
}
