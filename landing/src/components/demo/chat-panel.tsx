"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Static, type Stage } from "./connecting";
import type { Run, RunMessage } from "./use-run";

/**
 * The large panel, which is two different things in sequence.
 *
 * Before a plan is approved it is a conversation, over a turning globe. Approving one hands the
 * panel to the machine: the talk fades, the globe is fallen into, the picture breaks up, and
 * what comes out the other side is the screen of the computer that was rented — filling the box,
 * black above and below, with no second window inside the first.
 *
 * The transcript does not survive that, and should not: once there is a machine to watch, a
 * scrolling history is the wrong shape for what the agent is saying. It says one thing at a
 * time now, on a card, and the card it said before slides back behind it.
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
  const [step, setStep] = useState<"focus" | "dive" | "static">("focus");
  /** null follows the run; a click pins one face until the run has something new to show. */
  const [wants, setWants] = useState<"talk" | "screen" | null>(null);
  const dived = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const pending = run.pending;
  const live = Boolean(run.liveUrl) && (run.phase === "working" || run.phase === "ended");
  const connecting = run.phase === "working" && !live;

  /**
   * An agent is not one machine and one conversation in that order.
   *
   * It takes a desktop, hits a wall, hands it back for a stealth browser, comes back to the
   * desktop, and asks a question in the middle of all that. So the panel is not a slideshow
   * that runs once: it follows what is happening, and a question always wins, because that is
   * the only state where the run is waiting on the person rather than the other way round.
   */
  useEffect(() => { if (pending) setWants(null); }, [pending?.qid]);
  useEffect(() => { if (run.leaseId) setWants(null); }, [run.leaseId]);

  const auto: "talk" | "screen" = pending ? "talk" : live || connecting ? "screen" : "talk";
  const face = wants === "screen" && !live && !connecting ? "talk" : (wants ?? auto);

  /**
   * Approval starts a sequence, not a spinner.
   *
   * Nine hundred milliseconds to let the conversation go and leave the globe alone in the panel,
   * a second and a half falling into it, and then static — which lasts exactly as long as the
   * machine takes, because that is the thing being waited for.
   */
  useEffect(() => {
    if (!connecting) return undefined;
    /* The fall into the globe is the moment work begins. Doing it again every time the agent
       swaps machines mid-run would be a title sequence in the middle of the film. */
    if (dived.current) { setStep("static"); return undefined; }
    dived.current = true;
    setStep("focus");
    const a = setTimeout(() => setStep("dive"), 900);
    const b = setTimeout(() => setStep("static"), 2400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [connecting]);

  const stage: Stage = live ? "live" : connecting ? step : "idle";

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [run.messages.length, pending?.qid]);

  function send(text: string, approve = false) {
    if (!pending) return;
    if (!approve && !text.trim()) return;
    onAnswer(text.trim(), approve);
    setDraft("");
  }

  if (face === "screen") {
    return (
      <div className="relative flex h-full min-h-0 flex-col">
        {live ? <Machine run={run} /> : <Tuning run={run} stage={stage} />}
        <Swap face={face} setWants={setWants} waiting={Boolean(pending)} hasScreen={live || connecting} />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <Globe stage={stage} />
      <Swap face={face} setWants={setWants} waiting={false} hasScreen={live || connecting} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div ref={scroller} className="kl-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ol className="flex flex-col gap-5">
            {run.messages.map((m, i) => (
              <Message key={`${m.at}-${i}`} m={m} />
            ))}
            {run.phase === "scanning" && !pending ? <Working text="reading what Kleeto has" /> : null}
          </ol>
        </div>
        <Composer run={run} draft={draft} setDraft={setDraft} send={send} sending={sending} />
      </div>
    </div>
  );
}

/**
 * Which face you are looking at, and a way to look at the other one.
 *
 * Small and in the corner: the run decides this correctly almost always, and the control is
 * there for the times it does not — reading back what was said while the machine works, or
 * going to watch after answering a question.
 */
function Swap({
  face,
  setWants,
  waiting,
  hasScreen,
}: {
  face: "talk" | "screen";
  setWants: (v: "talk" | "screen" | null) => void;
  waiting: boolean;
  hasScreen: boolean;
}) {
  if (!hasScreen) return null;
  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-0.5 rounded-[9px] border border-white/10 bg-[oklch(0.12_0.006_85/0.86)] p-0.5 backdrop-blur-md">
      {(["talk", "screen"] as const).map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => setWants(f)}
          className={`kl-num relative cursor-pointer rounded-[7px] px-2.5 py-1 text-[9.5px] tracking-[0.14em] uppercase transition-colors ${
            face === f ? "bg-white/12 text-white/85" : "text-white/35 hover:text-white/65"
          }`}
        >
          {f === "talk" ? "chat" : "screen"}
          {f === "talk" && waiting && face !== "talk" ? (
            <span aria-hidden className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-[var(--kl-amber)]" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** Between machines: the box the next one will appear in, tuning until it does. */
function Tuning({ run, stage }: { run: Run; stage: Stage }) {
  const first = !run.events.some((e) => e.kind === "return");
  return (
    <div className="relative flex h-full min-h-0 flex-col bg-black">
      <div className="relative min-h-0 flex-1">
        <Globe stage={stage} />
        {stage === "static" ? <Static label={first ? "finding a machine" : "changing machines"} /> : null}
      </div>
      <CardStream messages={run.messages} ended={run.phase === "ended"} />
    </div>
  );
}

/**
 * The machine, once there is one.
 *
 * Black to the edges with the screen centred in it, because a desktop is 16:9 and this panel is
 * not: the bars are what honesty about the aspect ratio looks like. The viewer is asked for its
 * bare mode, so what is embedded is the picture rather than a second page with its own header,
 * its own clock and its own scrollbar.
 */
function Machine({ run }: { run: Run }) {
  const src = run.liveUrl ? `${run.liveUrl}${run.liveUrl.includes("?") ? "&" : "?"}bare=1` : "";
  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <div className="relative min-h-0 flex-1">
        <iframe
          src={src}
          title="The machine this run rented"
          scrolling="no"
          className="absolute inset-0 h-full w-full"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <CardStream messages={run.messages} ended={run.phase === "ended"} />
    </div>
  );
}

/**
 * What the agent is saying while it works, one card at a time.
 *
 * A transcript is for reading afterwards; this is for glancing at while watching a screen. The
 * newest thing sits in front and the one before it slides back behind, so you can see there was
 * a before without having to read it again.
 */
function CardStream({ messages, ended }: { messages: RunMessage[]; ended: boolean }) {
  /* Only what the agent said after work started. Its opening paragraph about what Kleeto has
     was an introduction, and repeating it on a card over a running desktop would be reading out
     the beginning of a story that has already moved on. */
  const approvedAt =
    [...messages].reverse().find((m) => m.role === "user" && m.kind === "plan")?.at ?? 0;
  const said = messages
    .filter((m) => m.role === "agent" && m.kind === "note" && m.at >= approvedAt)
    .slice(-4);
  if (said.length === 0) {
    return (
      <div className="flex h-[104px] shrink-0 items-center border-t border-white/[0.07] px-5">
        <p className="kl-num text-[11px] tracking-[0.14em] text-white/25 uppercase">working</p>
      </div>
    );
  }

  return (
    <div className="relative h-[112px] shrink-0 border-t border-white/[0.07] px-4 pt-3 pb-4">
      {said.map((m, i) => {
        const back = said.length - 1 - i;      // 0 is the newest, in front
        return (
          <article
            key={`${m.at}-${i}`}
            className="absolute inset-x-4 bottom-4 rounded-[12px] border border-white/10 bg-[oklch(0.19_0.01_85/0.96)] px-4 py-3 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              transform: `translateY(${-back * 9}px) scale(${1 - back * 0.035})`,
              opacity: back === 0 ? 1 : Math.max(0, 0.42 - (back - 1) * 0.14),
              zIndex: 10 - back,
            }}
          >
            <span className="kl-num block text-[9.5px] tracking-[0.16em] text-white/30 uppercase">
              {back === 0 && ended ? "finished" : "agent"}
            </span>
            <p className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-white/80">{m.text}</p>
          </article>
        );
      })}
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
 * The field is live only while the agent is actually waiting on an answer. The run is closed to
 * instructions once work starts — a machine is running and being charged for — and the field
 * says which of those it is rather than sitting there greyed out with no explanation.
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
          ? "The agent is thinking. It will ask when it needs something."
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

      {/* stretch, so the button is the height of the thing it sits beside */}
      <div className="flex items-stretch gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); }
          }}
          rows={plan ? 1 : 2}
          placeholder={plan ? "Or tell it what to change" : "Answer, or say anything else it should know"}
          className="kl-scroll min-h-[42px] flex-1 resize-none rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] leading-[1.5] text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
        />
        {plan ? (
          <div className="flex shrink-0 items-stretch gap-2">
            <button
              type="button"
              disabled={sending || !draft.trim()}
              onClick={() => send(draft)}
              className="cursor-pointer rounded-[10px] border border-white/12 px-3.5 text-[12.5px] text-white/60 transition-colors hover:border-white/25 hover:text-white/85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Change it
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => send(draft, true)}
              className="cursor-pointer rounded-[10px] bg-[var(--kl-amber)] px-4 text-[12.5px] font-medium text-[#171310] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start work
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={sending || !draft.trim()}
            onClick={() => send(draft)}
            className="flex w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-[var(--kl-amber)] text-[#171310] transition-opacity disabled:cursor-not-allowed disabled:opacity-25"
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
