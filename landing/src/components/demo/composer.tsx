"use client";

import { useEffect, useState } from "react";
import { AgentOrb, type AgentMark } from "./agent-orb";
import { AGENT_META } from "./agents-meta";
import { HbarMark, UsdcMark, X402Mark } from "./marks";
import { Picker } from "./picker";
import { useBoard } from "./use-board";

/**
 * The prompt bar, shaped like the one an agent developer already uses.
 *
 * Everything on it is chosen before the job is queued and frozen after, because these settings
 * are what the run is given; letting them change afterwards would show one thing and run
 * another.
 */
const PRESETS = [
  { title: "Model something", sub: "Blender, FreeCAD, KiCad",
    prompt: "Rent a desktop on the engineering image. In KiCad, draw a 40x30mm board outline, place two footprints, route a track between them, run DRC until it is clean, and export the Gerbers." },
  { title: "Make a document", sub: "Scribus, darktable",
    prompt: "Rent a desktop on the studio image. Render a product shot in Blender, correct it in darktable, then lay it out as a one-page A4 sheet in Scribus and export the PDF." },
  { title: "Work a database", sub: "DBeaver, GnuCash",
    prompt: "Rent a desktop on the office image. Connect DBeaver to a SQLite file, run a query totalling amounts by category, export the CSV, then enter the transactions into GnuCash and produce a balance report." },
  { title: "Use a site with no API", sub: "a real browser",
    prompt: "Rent a browser. Find eight used road bikes under six hundred within fifteen miles on a classifieds site, and give me price, frame size and the link for each." },
];

/** What a level costs you in patience, in the vendors' own terms. */
const EFFORT_NOTES: Record<string, string> = {
  low: "Fewest steps, quickest answer",
  medium: "The vendor's own default",
  high: "Thinks longer before acting",
  xhigh: "Slower, for work that needs care",
  max: "Slowest and most thorough",
  off: "No thinking budget at all",
  on: "Thinking budget on",
};

const GATEWAY = process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

type Agent = {
  id: string; label: string; efforts: string[]; defaultEffort: string;
  note: string; mark?: AgentMark; price: { in: number; out: number } | null; default: boolean;
};

export function Composer({
  onStarted,
}: {
  /** Hand the run to the workspace. The bar has done its whole job by then. */
  onStarted?: (run: { id: string; agentLabel: string; mark: AgentMark }) => void;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; position: number } | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("gpt-6-astra");
  const [effort, setEffort] = useState("medium");
  const [asset, setAsset] = useState<"usdc" | "hbar">("usdc");
  const [error, setError] = useState<string | null>(null);
  const { free, queued } = useBoard();
  const locked = Boolean(placed);

  useEffect(() => {
    fetch(`${GATEWAY}/v1/agents`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.agents ?? []);
        const def = (d.agents ?? []).find((a: Agent) => a.default) ?? d.agents?.[0];
        if (def) { setAgentId(def.id); setEffort(def.defaultEffort); }
      })
      .catch(() => {});
  }, []);

  const agent = agents.find((a) => a.id === agentId);

  /** Reasoning levels are per model: Astra has five, GLM and Kimi three, MiniMax a toggle. */
  function pickAgent(id: string) {
    setAgentId(id);
    const a = agents.find((x) => x.id === id);
    if (a) setEffort(a.defaultEffort);
  }

  /**
   * Anything you type is enough to start.
   *
   * There used to be a ten-character floor here, on the theory that an agent given "hi" has
   * nothing to work with. It has plenty: it can say what it found, what it could make, and what
   * that would cost. Turning a greeting away with a rule about sentence length is a worse first
   * impression than any answer the agent could give, so the only thing refused now is nothing
   * at all.
   */
  const ready = value.trim().length > 0;

  /** Submitting is free; the agent pays when it rents. What this buys is a place in the line. */
  async function send() {
    const prompt = value.trim();
    if (!ready || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`${GATEWAY}/v1/jobs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, agent: agentId, effort, asset }),
      });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? "the gateway would not take that");
      if (r.ok) {
        setPlaced({ id: j.id, position: j.position });
        setValue("");
        onStarted?.({
          id: j.id,
          agentLabel: agent?.label ?? agentId,
          mark: agent?.mark ?? AGENT_META[agentId]?.mark ?? "openai",
        });
      }
    } catch {
      setError("could not reach the gateway. It may be restarting; try again in a moment.");
    } finally { setSending(false); }
  }

  return (
    <div className="w-full max-w-[760px]">
      <div className="flex flex-col items-center">
        {/* the model's own mark, drawn rather than pasted in as a logo file */}
        <div className="pointer-events-none mb-7 h-[76px] w-[76px]">
          <AgentOrb mark={agent?.mark ?? AGENT_META[agentId]?.mark ?? "openai"} size={64} />
        </div>
        <h1 className="kl-display text-center text-[30px] leading-[1.15] font-medium text-white md:text-[36px]">
          What should the agent do?
        </h1>
        <p className="mt-3 max-w-[46ch] text-center text-[14px] leading-[1.6] text-white/45">
          Give it a task that needs a real computer. It picks a desktop or a browser, pays from
          its own wallet, and you watch it work, second by second.
        </p>
      </div>

      {/* said before they type, not after they wait: every machine is out right now */}
      {free === 0 && !locked ? (
        <div className="mt-7 flex items-start gap-2.5 rounded-[12px] border border-[var(--kl-amber)]/25 bg-[var(--kl-amber)]/[0.07] px-4 py-3">
          <span aria-hidden className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[var(--kl-amber)]" />
          <p className="text-[13px] leading-[1.55] text-white/70">
            <span className="text-white/90">Both agents are busy right now.</span>{" "}
            {queued > 0
              ? `${queued} task${queued === 1 ? " is" : "s are"} already waiting. Send yours and it joins the line`
              : "Send yours and it starts as soon as one finishes"}
            {" — the agent starts the moment one frees up, and nothing is charged for waiting."}
          </p>
        </div>
      ) : null}

      {/* the bar */}
      <div className="mt-4 rounded-[16px] border border-white/12 bg-[oklch(0.19_0.01_85/0.72)] backdrop-blur-xl">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          /* Enter sends, the way it does in every prompt bar this one is shaped like.
             Shift+Enter is how you get a second line. */
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          rows={3}
          placeholder="Describe a job. It will pick a machine, pay for it, and get to work."
          className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-[1.55] text-white placeholder:text-white/30 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <Picker
            dot
            width="w-[158px]"
            value={agentId}
            onChange={pickAgent}
            disabled={locked}
            options={agents.map((a) => ({
              value: a.id,
              label: a.label,
              note: a.price ? `${a.note} $${a.price.in}/$${a.price.out} per Mtok.` : a.note,
            }))}
          />

          <Picker
            label="Reasoning"
            width="w-[168px]"
            value={effort}
            onChange={setEffort}
            disabled={locked}
            options={(agent?.efforts ?? ["medium"]).map((e) => ({
              value: e, label: e, note: EFFORT_NOTES[e],
            }))}
          />

          {/* what the agent pays in. Both are always accepted; this picks which it reaches for. */}
          <span className="kl-num flex items-center gap-1 rounded-[8px] border border-white/10 py-1 pr-1 pl-2.5 text-[11.5px]">
            <X402Mark className="mr-1 h-[9px] w-auto text-white/40" />
            {(["usdc", "hbar"] as const).map((a) => {
              const Mark = a === "usdc" ? UsdcMark : HbarMark;
              const on = asset === a;
              return (
                <button
                  key={a}
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && setAsset(a)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-[6px] px-1.5 py-1 transition-colors disabled:cursor-not-allowed ${
                    on ? "bg-white/12 text-white/85" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <Mark className={`size-3 ${on ? "" : "opacity-55"}`} />
                  {a.toUpperCase()}
                </button>
              );
            })}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            disabled={!ready || sending}
            onClick={send}
            className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] bg-[var(--kl-amber)] text-[#171310] transition-opacity disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Send"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-[12px] leading-[1.5] text-white/40">{error}</p> : null}

      {placed ? (
        <p className="kl-num mt-3 text-[12px] text-[var(--kl-amber)]">
          {placed.position > 0
            ? `queued at position ${placed.position} — it starts when an agent frees up`
            : "picked up — the agent is renting a machine now"}
        </p>
      ) : null}

      {/* what it can be asked, which is also what the images are for */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {PRESETS.map((p) => (
          <button
            key={p.title}
            type="button"
            onClick={() => setValue(p.prompt)}
            className="cursor-pointer rounded-[12px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span className="block text-[13.5px] text-white/85">{p.title}</span>
            <span className="kl-num mt-0.5 block text-[11px] text-white/35">{p.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
