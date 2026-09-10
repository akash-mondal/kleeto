"use client";

import type { RunEvent } from "./use-run";

/**
 * Everything this run has paid for, as it pays for it.
 *
 * The gateway has always known each settlement; what it did not know was whose run it belonged
 * to, so a watcher would have had to find their own payments in a global feed. These are this
 * run's, in the order the money left, each one a link to the transaction on a public explorer —
 * which is the point of the whole product: you do not have to take the bill on trust.
 */
const hbar = (t?: number | null) => (t == null ? null : (t / 1e8).toFixed(4));

const clock = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const VERB: Record<RunEvent["kind"], string> = {
  topup: "paid in",
  rent: "took",
  return: "gave back",
};

export function LedgerPanel({ events, phase }: { events: RunEvent[]; phase: string }) {
  const paid = events.reduce((n, e) => n + (e.kind === "topup" ? (e.tinybar ?? 0) : 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {events.length === 0 ? (
        <div className="flex h-full flex-col justify-end p-5">
          <p className="max-w-[34ch] text-[12.5px] leading-[1.6] text-white/30">
            {phase === "working"
              ? "The agent is spending now. The first settlement will appear here within a second or two."
              : "Nothing has been paid yet. The agent answers Kleeto’s 402 from its own wallet once you approve its plan, and every payment it makes lands here with a link to the transaction."}
          </p>
        </div>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {events
            .slice()
            .reverse()
            .map((e, i) => (
              <li
                key={`${e.at}-${i}`}
                className="kl-rise grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 border-b border-white/[0.05] py-2.5 last:border-b-0"
              >
                <span className="kl-num text-[10.5px] text-white/25 tabular-nums">{clock(e.at)}</span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] leading-[1.5] text-white/70">
                    <span className="text-white/40">{VERB[e.kind]} </span>
                    {e.kind === "topup"
                      ? `${hbar(e.tinybar)} HBAR of credit`
                      : e.kind === "rent"
                        ? `${e.lane}${e.image && e.image !== "base" ? ` · ${e.image}` : ""}`
                        : `${e.lane} after ${e.seconds}s`}
                  </span>
                  {e.transaction ? (
                    <a
                      href={e.explorer ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="kl-num mt-0.5 inline-block max-w-full truncate text-[10.5px] text-[var(--kl-amber)]/70 underline decoration-[var(--kl-amber)]/20 underline-offset-2 transition-colors hover:text-[var(--kl-amber)] hover:decoration-[var(--kl-amber)]/60"
                    >
                      {e.transaction}
                    </a>
                  ) : e.chainHead ? (
                    <span className="kl-num mt-0.5 block truncate text-[10.5px] text-white/20">
                      chain head {e.chainHead.slice(0, 16)}…
                    </span>
                  ) : null}
                </span>
                <span className="kl-num text-[10.5px] tracking-[0.1em] text-white/20 uppercase">
                  {e.kind}
                </span>
              </li>
            ))}
        </ol>
      )}

      {paid > 0 ? (
        <div className="shrink-0 border-t border-white/[0.07] px-4 py-2.5">
          <span className="kl-num text-[11px] text-white/40 tabular-nums">
            {hbar(paid)} HBAR <span className="text-white/20">funded this run</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
