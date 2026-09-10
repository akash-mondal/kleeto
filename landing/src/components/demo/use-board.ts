"use client";

import { useEffect, useState } from "react";

/**
 * The queue board, polled once for whoever needs it.
 *
 * Two things on this page depend on the same number — the counter in the header and the
 * warning in the composer — and two components polling the same endpoint on their own
 * timers would disagree with each other for four seconds at a time.
 */
export type Board = { concurrency: number; running: number; queued: number };

const GATEWAY =
  process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

let cache: Board | null = null;
const listeners = new Set<(b: Board) => void>();
let timer: ReturnType<typeof setInterval> | null = null;

async function read() {
  try {
    const r = await fetch(`${GATEWAY}/v1/jobs`, { cache: "no-store" });
    if (!r.ok) return;
    cache = await r.json();
    for (const fn of listeners) fn(cache!);
  } catch {
    /* a failed poll should not shout; the last good number is still roughly true */
  }
}

export function useBoard() {
  const [b, setB] = useState<Board | null>(cache);

  useEffect(() => {
    listeners.add(setB);
    if (!timer) {
      read();
      timer = setInterval(read, 4000);
    }
    return () => {
      listeners.delete(setB);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);

  return {
    board: b,
    free: b ? Math.max(0, b.concurrency - b.running) : null,
    queued: b?.queued ?? 0,
  };
}
