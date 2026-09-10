"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Static, type Stage } from "./connecting";
import { fileSize, type Run, type RunEvent, type RunMessage } from "./use-run";

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
  const [wants, setWants] = useState<Face | null>(null);
  /** how many files the person has already looked at, so a new one can be flagged on the tab */
  const [seenFiles, setSeenFiles] = useState(0);
  const dived = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  /* a finished run is asking nothing, whatever the thread last recorded */
  const pending = run.phase === "ended" ? null : run.pending;
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

  const files = run.events.filter((e) => e.kind === "file" && e.url);
  const hasScreen = live || connecting;
  /* A finished run with something to show for itself opens on the thing it made. */
  const auto: Face = pending ? "talk"
    : hasScreen ? "screen"
    : run.phase === "ended" && files.length ? "files"
    : "talk";
  const face: Face =
    wants === "screen" && !hasScreen ? auto
    : wants === "files" && !files.length ? auto
    : (wants ?? auto);

  /* Opening the folder, or leaving it, counts as having seen what is in it. */
  const pick = (f: Face) => {
    if (f === "files" || face === "files") setSeenFiles(files.length);
    setWants(f);
  };
  const swap = (
    <Swap face={face} setWants={pick} waiting={Boolean(pending)} hasScreen={hasScreen}
          fileCount={files.length} unseen={files.length > seenFiles && face !== "files" && run.phase !== "ended"} />
  );

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

  if (face === "files") {
    return (
      <div className="relative flex h-full min-h-0 flex-col">
        <Files files={files} />
        {swap}
      </div>
    );
  }

  if (face === "screen") {
    return (
      <div className="relative flex h-full min-h-0 flex-col">
        {live ? <Machine run={run} /> : <Tuning run={run} stage={stage} />}
        {swap}
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <Globe stage={stage} />
      {swap}

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
  fileCount,
  unseen,
}: {
  face: Face;
  setWants: (v: Face) => void;
  waiting: boolean;
  hasScreen: boolean;
  fileCount: number;
  unseen: boolean;
}) {
  const tabs: Face[] = ["talk", ...(hasScreen ? ["screen" as const] : []), ...(fileCount ? ["files" as const] : [])];
  if (tabs.length < 2) return null;
  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-0.5 rounded-[9px] border border-white/10 bg-[oklch(0.12_0.006_85/0.86)] p-0.5 backdrop-blur-md">
      {tabs.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => setWants(f)}
          className={`kl-num relative cursor-pointer rounded-[7px] px-2.5 py-1 text-[9.5px] tracking-[0.14em] uppercase transition-colors ${
            face === f ? "bg-white/12 text-white/85" : "text-white/35 hover:text-white/65"
          }`}
        >
          {f === "talk" ? "chat" : f === "screen" ? "screen" : `files ${fileCount}`}
          {(f === "talk" && waiting && face !== "talk") || (f === "files" && unseen) ? (
            <span aria-hidden className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-[var(--kl-amber)]" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

/**
 * The run's own folder.
 *
 * What the agent handed over, listed the way a folder lists things: what it is, how big, when
 * it arrived, and a button to take it. The hash sits in the secondary line because it is the same
 * hash the receipt carries — there for whoever wants to check, quiet for whoever does not.
 */
function Files({ files }: { files: RunEvent[] }) {
  const total = files.reduce((n, f) => n + (f.bytes ?? 0), 0);
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* right padding keeps the heading clear of the tab control in the corner */}
      <div className="shrink-0 border-b border-white/[0.07] py-4 pr-56 pl-5">
        <span className="kl-num block text-[10px] tracking-[0.16em] text-white/30 uppercase">workspace</span>
        <p className="mt-1 text-[13px] text-white/70">
          {files.length} file{files.length === 1 ? "" : "s"}
          <span className="kl-num ml-2 text-white/30">{fileSize(total)}</span>
        </p>
      </div>

      <ul className="kl-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {files.map((f, i) => {
          const ext = (f.name?.split(".").pop() ?? "file").slice(0, 4).toUpperCase();
          return (
            <li
              key={`${f.at}-${i}`}
              className="kl-rise grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-[11px] px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              <span className="kl-num flex h-10 w-10 items-center justify-center rounded-[9px] border border-white/10 bg-white/[0.03] text-[9px] tracking-[0.06em] text-[var(--kl-amber)]/80">
                {ext}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-white/85">{f.name}</span>
                <span className="kl-num mt-0.5 block truncate text-[10.5px] text-white/30">
                  {fileSize(f.bytes)} · {clock(f.at)}
                  {f.sha256 ? <span className="text-white/20"> · sha256 {f.sha256.slice(0, 10)}…</span> : null}
                </span>
              </span>
              <a
                href={f.url}
                download={f.name}
                className="flex items-center gap-1.5 rounded-[9px] border border-white/12 px-3 py-1.5 text-[12px] text-white/70 transition-colors hover:border-[var(--kl-amber)]/50 hover:text-white"
              >
                <svg viewBox="0 0 16 16" aria-hidden className="size-3.5 text-[var(--kl-amber)]"
                     fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download
              </a>
            </li>
          );
        })}
      </ul>

      <p className="shrink-0 border-t border-white/[0.07] px-5 py-3 text-[11px] leading-[1.5] text-white/25">
        Kept while this page is open, and for half an hour after you close it.
      </p>
    </div>
  );
}

function clock(at: number) {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
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
      <CardStream run={run} />
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
      <CardStream run={run} />
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
type Card = { at: number; text?: string; file?: RunEvent };
type Face = "talk" | "screen" | "files";

function CardStream({ run }: { run: Run }) {
  const { messages } = run;
  const ended = run.phase === "ended";
  /* Only what the agent said after work started. Its opening paragraph about what Kleeto has
     was an introduction, and repeating it on a card over a running desktop would be reading out
     the beginning of a story that has already moved on. */
  /* The *first* approval, not the most recent one. An agent that revises its plan mid-run — to
     escalate to a stealth browser, say — gets a second approval, and taking the latest one as
     the cutoff would erase everything it had already said and everything it had already handed
     over. Work started when work started. */
  const approvedAt = messages.find((m) => m.role === "user" && m.kind === "plan")?.at ?? 0;
  /* A file the agent handed over is news in the same sense a sentence is, so it arrives in the
     same place rather than in a bar of its own. It is the one card you can click. */
  const cards: Card[] = [
    ...messages
      .filter((m) => m.role === "agent" && m.kind === "note" && m.at >= approvedAt)
      .map((m) => ({ at: m.at, text: m.text })),
    ...run.events
      .filter((e) => e.kind === "file" && e.url && e.at >= approvedAt)
      .map((e) => ({ at: e.at, file: e })),
  ].sort((a, b) => a.at - b.at);
  const said = cards.slice(-4);
  if (said.length === 0) {
    return (
      <div className="flex h-[104px] shrink-0 items-center border-t border-white/[0.07] px-5">
        <p className="kl-num text-[11px] tracking-[0.14em] text-white/25 uppercase">working</p>
      </div>
    );
  }

  return (
    <div className="relative h-[112px] shrink-0 border-t border-white/[0.07] px-4 pt-3 pb-4">
      {said.map((c, i) => {
        const back = said.length - 1 - i;      // 0 is the newest, in front
        const style = {
          transform: `translateY(${-back * 9}px) scale(${1 - back * 0.035})`,
          opacity: back === 0 ? 1 : Math.max(0, 0.42 - (back - 1) * 0.14),
          zIndex: 10 - back,
        };
        const shell =
          "absolute inset-x-4 bottom-4 rounded-[12px] border px-4 py-3 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

        if (c.file) {
          const f = c.file;
          return (
            <a
              key={`${c.at}-${i}`}
              href={back === 0 ? f.url : undefined}
              download={f.name}
              style={style}
              className={`${shell} flex items-center gap-3 border-[var(--kl-amber)]/30 bg-[oklch(0.19_0.01_85/0.97)] ${
                back === 0 ? "cursor-pointer hover:border-[var(--kl-amber)]/60" : "pointer-events-none"
              }`}
            >
              <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0 text-[var(--kl-amber)]"
                   fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="min-w-0 flex-1">
                <span className="kl-num block text-[9.5px] tracking-[0.16em] text-white/30 uppercase">
                  yours to keep
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-white/85">{f.name}</span>
              </span>
              <span className="kl-num shrink-0 text-[10.5px] text-white/35 tabular-nums">
                {fileSize(f.bytes)}
              </span>
            </a>
          );
        }

        return (
          <article key={`${c.at}-${i}`} style={style}
                   className={`${shell} border-white/10 bg-[oklch(0.19_0.01_85/0.96)]`}>
            <span className="kl-num block text-[9.5px] tracking-[0.16em] text-white/30 uppercase">
              {back === 0 && ended ? "finished" : "agent"}
            </span>
            <p className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-white/80">{c.text}</p>
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
