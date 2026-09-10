"use client";

import { useEffect, useState } from "react";

/**
 * Who else is asking.
 *
 * Two machines is the real ceiling, so a third person waits. Showing the line is the whole
 * point: a queue you can see is a system under load, a spinner is a system that looks broken.
 */
type Job = { id: string; state: string; image: string | null; summary: string; seconds: number; liveUrl: string | null };
type Board = { concurrency: number; running: number; queued: number; capacity: string; jobs: Job[] };

const GATEWAY = process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

const TONE: Record<string, string> = {
  running: "text-[var(--kl-amber)]",
  queued: "text-white/45",
  done: "text-white/35",
  failed: "text-red-400/70",
};

export function QueueBoard() {
  const [b, setB] = useState<Board | null>(null);

  useEffect(() => {
    let alive = true;
    const read = async () => {
      try {
        const r = await fetch(`${GATEWAY}/v1/jobs`, { cache: "no-store" });
        if (r.ok && alive) setB(await r.json());
      } catch { /* the board is a nicety; a failed poll should not shout */ }
    };
    read();
    const t = setInterval(read, 4000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!b || !b.jobs.length) return null;

  return (
    <div className="mt-8 w-full max-w-[760px]">
      <div className="flex items-baseline justify-between">
        <span className="kl-num text-[11px] tracking-[0.14em] text-white/35 uppercase">the line</span>
        <span className="kl-num text-[11.5px] text-white/45">
          {b.capacity}
          {b.queued > 0 ? ` · ${b.queued} waiting` : ""}
        </span>
      </div>
      <ul className="mt-3 divide-y divide-white/[0.06] rounded-[12px] border border-white/10 bg-white/[0.02]">
        {b.jobs.slice(0, 6).map((j) => (
          <li key={j.id} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px]">
            <span className={`kl-num w-[62px] shrink-0 ${TONE[j.state] ?? "text-white/40"}`}>
              {j.state === "running" ? (
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-[var(--kl-amber)]" />
                  live
                </span>
              ) : j.state}
            </span>
            <span className="min-w-0 flex-1 truncate text-white/60">{j.summary}</span>
            {j.seconds > 0 ? <span className="kl-num shrink-0 text-white/30">{j.seconds}s</span> : null}
            {j.liveUrl ? (
              <a href={j.liveUrl} target="_blank" rel="noreferrer"
                 className="kl-num shrink-0 text-[var(--kl-amber)] underline-offset-4 hover:underline">
                watch
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
