"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One run, as it happens.
 *
 * A run is a conversation that turns into a machine, so a page watching it needs the talk, the
 * money and the meter arriving in the same order the agent produced them. The gateway streams
 * the whole thread on every change rather than deltas: a thread is small, and a watcher who
 * joined late or lost their connection for ten seconds gets the truth instead of a gap.
 */
export type RunMessage = {
  role: "user" | "agent";
  kind: "note" | "question" | "plan";
  text: string;
  at: number;
  qid?: string;
  options?: string[] | null;
};

export type RunEvent = {
  at: number;
  kind: "topup" | "rent" | "return";
  text: string;
  tinybar?: number | null;
  asset?: string | null;
  transaction?: string | null;
  explorer?: string | null;
  lane?: string;
  image?: string;
  leaseId?: string;
  seconds?: number;
  chainHead?: string | null;
};

export type RunPhase = "queued" | "scanning" | "talking" | "working" | "ended";

export type Run = {
  id: string;
  state: string;
  phase: RunPhase;
  position: number;
  agent: string | null;
  effort: string | null;
  asset: string | null;
  leaseId: string | null;
  liveUrl: string | null;
  seconds: number;
  result: string | null;
  plan: string | null;
  messages: RunMessage[];
  events: RunEvent[];
  pending: { qid: string; kind: "question" | "plan"; text: string; options: string[] | null } | null;
};

const GATEWAY = process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

export function useRun(jobId: string | null) {
  const [run, setRun] = useState<Run | null>(null);
  const [sending, setSending] = useState(false);
  const source = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return undefined;
    const es = new EventSource(`${GATEWAY}/v1/jobs/${jobId}/stream`);
    source.current = es;
    es.addEventListener("thread", (e) => {
      try { setRun(JSON.parse((e as MessageEvent).data)); } catch { /* a half-written frame */ }
    });
    /* The browser reconnects an EventSource on its own; the next frame is a whole thread, so
       there is nothing to reconcile and nothing to show the watcher about the interruption. */
    return () => { es.close(); source.current = null; };
  }, [jobId]);

  /** Answer whatever is waiting. `approve` is what turns an agreed plan into a rented machine. */
  const answer = useCallback(
    async (text: string, approve = false) => {
      if (!jobId || !run?.pending || sending) return;
      setSending(true);
      try {
        const r = await fetch(`${GATEWAY}/v1/jobs/${jobId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qid: run.pending.qid, text, approve }),
        });
        if (r.ok) setRun(await r.json());
      } finally { setSending(false); }
    },
    [jobId, run?.pending, sending],
  );

  return { run, answer, sending };
}
