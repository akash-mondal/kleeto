"use client";

import { useEffect, useState } from "react";
import { AgentOrb, type AgentMark } from "./agent-orb";
import { AGENT_META } from "./agents-meta";
import { ChatPanel } from "./chat-panel";
import { LedgerPanel } from "./ledger-panel";
import { MeterDial } from "./meter-dial";
import { Panel } from "./panel";
import { useMeter } from "./use-meter";
import { useRun } from "./use-run";

/**
 * The workspace, once there is a run to watch.
 *
 * Three surfaces, and the split is by what each answers. The large one is what is happening —
 * first as a conversation, then as the machine itself. The two on the right are the two things
 * you cannot get from watching a screen: what this has cost you, and what it has paid, with the
 * transaction ids to check both. They stay up the whole run, because the moment they matter is
 * the moment the screen is most distracting.
 */
const GATEWAY = process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

const PHASE_WORD: Record<string, string> = {
  queued: "waiting for a machine",
  scanning: "reading the catalogue",
  talking: "working out what you want",
  working: "working",
  ended: "finished",
};

export function RunView({
  jobId,
  agentLabel,
  mark,
}: {
  jobId: string;
  agentLabel: string;
  mark: AgentMark;
}) {
  const { run, answer, sending } = useRun(jobId);
  const tick = useMeter(run?.leaseId ?? null);
  const [usdPerHbar, setRate] = useState<number | null>(null);

  /* One read, not a poll: the rate moves by fractions of a cent an hour and the dial would
     rather be wrong in the fourth decimal than spend a request a second being right. */
  useEffect(() => {
    fetch(`${GATEWAY}/v1/demo`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => typeof d.usdPerHbar === "number" && setRate(d.usdPerHbar))
      .catch(() => {});
  }, []);

  const phase = run?.phase ?? "queued";
  /* Once the thread arrives it knows which model is running; until then the composer's guess
     stands, and a run opened from a link has only the thread. */
  const meta = run?.agent ? AGENT_META[run.agent] : null;
  /* A lease that has been handed back is no longer metered, so its stream has nothing left to
     say — but the run was charged for those seconds and the dial should keep saying so rather
     than resetting to zero as if it had never run. */
  const returned = run?.events.find((e) => e.kind === "return");
  const settled = returned ? { seconds: returned.seconds ?? 0, tinybar: returned.tinybar ?? 0 } : null;

  return (
    <div className="kl-enter grid w-full max-w-[1180px] gap-3 lg:h-[min(760px,calc(100vh-150px))] lg:grid-cols-[minmax(0,1.7fr)_minmax(310px,1fr)]">
      <Panel
        label="the run"
        className="min-h-[520px] lg:min-h-0"
        aside={
          <span className="flex items-center gap-2">
            <span className="kl-num text-[10px] tracking-[0.1em] text-white/30 lowercase">
              {PHASE_WORD[phase] ?? phase}
            </span>
            <span aria-hidden className="size-[18px] shrink-0">
              <AgentOrb mark={meta?.mark ?? mark} size={18} />
            </span>
            <span className="kl-num text-[10.5px] text-white/45">{meta?.label ?? agentLabel}</span>
          </span>
        }
      >
        {run ? (
          <ChatPanel run={run} onAnswer={answer} sending={sending} />
        ) : (
          <p className="p-5 text-[12.5px] text-white/30">Opening the run…</p>
        )}
      </Panel>

      <div className="grid min-h-0 gap-3 lg:grid-rows-[minmax(0,1fr)_auto]">
        <Panel
          label="ledger"
          className="min-h-[240px] lg:min-h-0"
          aside={
            <span className="kl-num text-[10px] tracking-[0.1em] text-white/25">
              {run?.asset ? run.asset.toUpperCase() : "—"} · hedera:testnet
            </span>
          }
        >
          <LedgerPanel events={run?.events ?? []} phase={phase} />
        </Panel>

        <Panel
          label="meter"
          aside={
            <span className="kl-num text-[10px] tracking-[0.1em] text-white/25">
              {tick?.lane ?? returned?.lane ?? (run?.leaseId ? "live" : "idle")}
            </span>
          }
        >
          <MeterDial tick={tick} settled={settled} usdPerHbar={usdPerHbar} asset={run?.asset === "hbar" ? "hbar" : "usdc"} />
        </Panel>
      </div>
    </div>
  );
}
