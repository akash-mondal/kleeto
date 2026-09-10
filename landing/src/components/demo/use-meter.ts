"use client";

import { useEffect, useState } from "react";

/**
 * The meter for one lease, second by second.
 *
 * Server-sent rather than polled, because the thing on screen is a number that changes every
 * second and a poll is always a second behind the truth it draws. Every tick carries the head
 * of the hash chain, so what the dial shows is the same evidence the receipt is built from.
 */
export type Tick = {
  seconds: number;
  spentTinybar: number;
  rateTinybar: number;
  balanceTinybar: number;
  secondsRemaining: number;
  chainHead: string | null;
  lane?: string;
  state?: string;
};

const GATEWAY = process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

export function useMeter(leaseId: string | null) {
  const [tick, setTick] = useState<Tick | null>(null);

  useEffect(() => {
    if (!leaseId) { setTick(null); return undefined; }
    const es = new EventSource(`${GATEWAY}/v1/leases/${leaseId}/meter`);
    const take = (e: Event) => {
      try {
        const d = JSON.parse((e as MessageEvent).data);
        setTick((prev) => ({
          seconds: d.seq ?? d.seconds ?? prev?.seconds ?? 0,
          spentTinybar: d.spentTinybar ?? prev?.spentTinybar ?? 0,
          rateTinybar: d.rateTinybar ?? prev?.rateTinybar ?? 0,
          balanceTinybar: d.balanceTinybar ?? prev?.balanceTinybar ?? 0,
          secondsRemaining: d.secondsRemaining ?? prev?.secondsRemaining ?? 0,
          chainHead: d.chainHead ?? prev?.chainHead ?? null,
          lane: d.lane ?? prev?.lane,
          state: d.state ?? prev?.state,
        }));
      } catch { /* ignore a torn frame; the next one is a second away */ }
    };
    es.addEventListener("hello", take);
    es.addEventListener("tick", take);
    /* `exhausted` is the one event that is not a number going up: the money ran out and the
       machine is paused, which the dial has to say rather than simply stop moving. */
    es.addEventListener("exhausted", () => setTick((p) => (p ? { ...p, state: "paused" } : p)));
    return () => es.close();
  }, [leaseId]);

  return tick;
}
