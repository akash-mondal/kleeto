"use client";

import { useEffect, useRef, useState } from "react";
import { Connecting, Static } from "./connecting";
import type { Run, RunMessage } from "./use-run";

/**
 * The conversation, and then the machine.
 *
 * This panel is the whole of the run's front half. The agent reads what Kleeto has, says what
 * it could do, asks what it needs, and proposes a plan; none of that costs anything. The moment
 * a plan is approved and a machine comes up, the same panel becomes the window onto that
 * machine, with the talk continuing underneath — because once there is something to watch, the
 * screen is the more important thing on the page, and the transcript is how you know why.
 */
export function ChatPanel({
  run,
  onAnswer,
  sending,
}: {
  run: Run;
  onAnswer: (text: string, approve?: boolean) => void;
  sending: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [diving, setDiving] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const pending = run.pending;
  const live = run.liveUrl && (run.phase === "working" || run.phase === "ended");

  /**
   * The dive lasts as long as the dive; the static lasts as long as the wait.
   *
   * Approving a plan is the moment a machine has to be found and started, which takes the
   * better part of a minute for a desktop. Rather than a spinner over an empty panel, the world
   * behind the conversation is fallen into and the picture breaks up — and it stays broken up
   * until the live view genuinely exists, so the noise is the wait itself rather than a fixed
   * animation that finishes before the machine does.
   */
  useEffect(() => {
    if (run.phase !== "working" || live) { setDiving(false); return undefined; }
    setDiving(true);
    const t = setTimeout(() => setDiving(false), 1500);
    return () => clearTimeout(t);
  }, [run.phase, live]);

  const stage = run.phase !== "working" || live ? "idle" : diving ? "dive" : "static";

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [run.messages.length, pending?.qid]);

  /** One way in for every affordance: a chip, the send button, Enter, or "start work". */
  function send(text: string, approve = false) {
    if (!pending) return;
    if (!approve && !text.trim()) return;
    onAnswer(text.trim(), approve);
    setDraft("");
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {live ? null : <Connecting stage={stage} />}
      {live || stage === "static" ? (
        <div className="relative z-10 shrink-0 border-b border-white/[0.07] p-3">
          {/* capped, so the screen never squeezes the transcript down to a slit: what the
              machine is doing is only legible next to why it is doing it */}
          <div className="relative mx-auto aspect-video max-h-[38vh] w-full overflow-hidden rounded-[12px] border border-white/10 bg-black">
            {live ? (
              <iframe
                src={run.liveUrl!}
                title="The machine this run rented"
                className="absolute inset-0 h-full w-full"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              /* the same box the machine will appear in, tuning in until it does */
              <Static />
            )}
          </div>
        </div>
      ) : null}

      <div ref={scroller} className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <ol className="flex flex-col gap-5">
          {run.messages.map((m, i) => (
            <Message key={`${m.at}-${i}`} m={m} />
          ))}
          {run.phase === "scanning" && !pending ? <Working text="reading what Kleeto has" /> : null}
          {run.phase === "working" && !live ? <Working text="bringing a machine up" /> : null}
        </ol>
      </div>

      <div className="relative z-10">
        <Composer run={run} draft={draft} setDraft={setDraft} send={send} sending={sending} />
      </div>
    </div>
  );
}

/** One turn. No bubbles: a row of text with a marker, the way a transcript reads. */
function Message({ m }: { m: RunMessage }) {
  const agent = m.role === "agent";
  const plan = m.kind === "plan" && agent;
  return (
    <li className="kl-rise grid grid-cols-[16px_1fr] gap-3">
      <span aria-hidden className="pt-[7px]">
        <span
          className={`block size-1.5 rounded-full ${
            m.kind === "question" || plan
              ? "bg-[var(--kl-amber)]"
              : agent
                ? "bg-white/25"
                : "border border-white/30"
          }`}
        />
      </span>
      <div className="min-w-0">
        <span className="kl-num block text-[10px] tracking-[0.14em] text-white/25 uppercase">
          {agent ? (plan ? "the plan" : "agent") : "you"}
        </span>
        <p
          className={`mt-1 max-w-[68ch] text-[13.5px] leading-[1.68] whitespace-pre-wrap ${
            agent ? "text-white/80" : "text-white/55"
          } ${plan ? "text-white/90" : ""}`}
        >
          {m.text}
        </p>
      </div>
    </li>
  );
}

/** Something is happening that has no text yet. Three dots would say less than five words. */
function Working({ text }: { text: string }) {
  return (
    <li className="grid grid-cols-[16px_1fr] gap-3">
      <span aria-hidden className="pt-[7px]">
        <span className="kl-pulse block size-1.5 rounded-full bg-[var(--kl-amber)]" />
      </span>
      <span className="kl-num pt-[1px] text-[11.5px] text-white/35">{text}…</span>
    </li>
  );
}

/**
 * What the person can do right now, which is usually nothing.
 *
 * The input is only live while the agent is actually waiting on an answer. Once work starts the
 * run is closed to instructions — a machine is running and being charged for, and a message
 * arriving mid-task would either be ignored or would change a job that is already half done.
 * The field says which of those it is rather than sitting there greyed out with no explanation.
 */
function Composer({
  run,
  draft,
  setDraft,
  send,
  sending,
}: {
  run: Run;
  draft: string;
  setDraft: (v: string) => void;
  send: (text: string, approve?: boolean) => void;
  sending: boolean;
}) {
  const pending = run.pending;
  const plan = pending?.kind === "plan";

  const closed =
    run.phase === "queued"
      ? run.position > 0
        ? `Waiting for a machine. You are ${run.position} in the line.`
        : "Waiting for a worker to pick this up."
      : run.phase === "ended"
        ? "This run is finished."
        : !pending
          ? run.phase === "working"
            ? "The agent is working and cannot take new instructions. It will speak up if it needs you."
            : "The agent is thinking. It will ask when it needs something."
          : null;

  if (closed) {
    return (
      <div className="shrink-0 border-t border-white/[0.07] px-5 py-4">
        <p className="text-[12.5px] leading-[1.55] text-white/30">{closed}</p>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-white/[0.07] px-4 pt-3 pb-4">
      {pending?.options?.length ? (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {pending.options.map((o) => (
            <button
              key={o}
              type="button"
              disabled={sending}
              onClick={() => send(o)}
              className="kl-num cursor-pointer rounded-[7px] border border-white/12 px-2.5 py-1.5 text-[11.5px] text-white/60 transition-colors hover:border-white/25 hover:text-white/85"
            >
              {o}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); }
          }}
          rows={plan ? 1 : 2}
          placeholder={plan ? "Or tell it what to change" : "Answer, or say anything else it should know"}
          className="min-h-[38px] flex-1 resize-none rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] leading-[1.5] text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
        />
        {plan ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={sending || !draft.trim()}
              onClick={() => send(draft)}
              className="cursor-pointer rounded-[9px] border border-white/12 px-3 py-2 text-[12.5px] text-white/60 transition-colors hover:border-white/25 hover:text-white/85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Change it
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => send(draft, true)}
              className="cursor-pointer rounded-[9px] bg-[var(--kl-amber)] px-3.5 py-2 text-[12.5px] font-medium text-[#171310] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start work
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={sending || !draft.trim()}
            onClick={() => send(draft)}
            className="flex size-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-[var(--kl-amber)] text-[#171310] transition-opacity disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Send"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {plan ? (
        <p className="mt-2 text-[11.5px] leading-[1.5] text-white/25">
          Nothing has been rented and nothing paid for yet. Starting work is what spends money.
        </p>
      ) : null}
    </div>
  );
}
