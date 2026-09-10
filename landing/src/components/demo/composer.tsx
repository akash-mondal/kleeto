"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BrandOrbs } from "./shaders";

/**
 * The prompt bar, shaped like the one an agent developer already uses.
 *
 * The model and its effort are shown and fixed. This workspace runs one agent on one setting,
 * so a dropdown would be a control that does nothing, and a control that does nothing is worse
 * than a label that tells the truth.
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

const GATEWAY = process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

type Agent = {
  id: string; label: string; efforts: string[]; defaultEffort: string;
  note: string; default: boolean;
};

export function Composer() {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; position: number } | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("gpt-6-astra");
  const [effort, setEffort] = useState("medium");
  const [asset, setAsset] = useState<"usdc" | "hbar">("usdc");
  /** Once a task is in the queue its settings are what it runs with; changing them here
      afterwards would show one thing and run another. */
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
    if (locked) return;
    setAgentId(id);
    const a = agents.find((x) => x.id === id);
    if (a) setEffort(a.defaultEffort);
  }

  /** Submitting is free; the agent pays when it rents. What this buys is a place in the line. */
  async function send() {
    const prompt = value.trim();
    if (prompt.length < 10 || sending) return;
    setSending(true);
    try {
      const r = await fetch(`${GATEWAY}/v1/jobs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, agent: agentId, effort, asset }),
      });
      const j = await r.json();
      if (r.ok) { setPlaced({ id: j.id, position: j.position }); setValue(""); }
    } finally { setSending(false); }
  }

  return (
    <div className="w-full max-w-[760px]">
      <div className="flex flex-col items-center">
        {/* the agent, drawn rather than pasted in as a logo file */}
        <div className="pointer-events-none mb-7 h-[76px] w-[76px]">
          <BrandOrbs variant="openai" size="medium" mode="dark" speed={1.0} />
        </div>
        <h1 className="kl-display text-center text-[30px] leading-[1.15] font-medium text-white md:text-[36px]">
          What should the agent do?
        </h1>
        <p className="mt-3 max-w-[46ch] text-center text-[14px] leading-[1.6] text-white/45">
          It rents the computer it needs and pays for it by the second, from its own wallet.
          You are watching the meter, not a simulation.
        </p>
      </div>

      {/* the bar */}
      <div className="mt-9 rounded-[16px] border border-white/12 bg-[oklch(0.19_0.01_85/0.72)] backdrop-blur-xl">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          placeholder="Describe a job. It will pick a machine, pay for it, and get to work."
          className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-[1.55] text-white placeholder:text-white/30 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
          <label className="kl-num flex items-center gap-2 rounded-[8px] border border-white/10 px-2.5 py-1.5 text-[11.5px] text-white/70">
            <span aria-hidden className="size-1.5 rounded-full bg-[var(--kl-amber)]" />
            <select
              value={agentId}
              onChange={(e) => pickAgent(e.target.value)}
              disabled={locked}
              title={agent?.note}
              className="cursor-pointer appearance-none bg-transparent pr-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#171310]">{a.label}</option>
              ))}
            </select>
          </label>

          <label className="kl-num flex items-center gap-1.5 rounded-[8px] border border-white/10 px-2.5 py-1.5 text-[11.5px] text-white/45">
            <span>Reasoning</span>
            <select
              value={effort}
              onChange={(e) => !locked && setEffort(e.target.value)}
              disabled={locked}
              className="cursor-pointer appearance-none bg-transparent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(agent?.efforts ?? ["medium"]).map((e) => (
                <option key={e} value={e} className="bg-[#171310]">{e}</option>
              ))}
            </select>
          </label>

          {/* what the agent pays in. Both are always accepted; this picks which it reaches for. */}
          <span className="kl-num flex items-center gap-1 rounded-[8px] border border-white/10 py-1 pr-1 pl-2.5 text-[11.5px] text-white/45">
            <Image src="/images/rail/x402.svg" alt="x402" width={26} height={10} className="mr-1 h-[10px] w-auto opacity-70" unoptimized />
            {(["usdc", "hbar"] as const).map((a) => (
              <button
                key={a}
                type="button"
                disabled={locked}
                onClick={() => !locked && setAsset(a)}
                className={`flex cursor-pointer items-center gap-1 rounded-[6px] px-1.5 py-1 transition-colors disabled:cursor-not-allowed ${
                  asset === a ? "bg-white/12 text-white/85" : "text-white/35 hover:text-white/60"
                }`}
              >
                <Image src={`/images/rail/${a}.svg`} alt="" width={12} height={12} className="size-3" unoptimized />
                {a.toUpperCase()}
              </button>
            ))}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            disabled={!value.trim() || sending}
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

      {placed ? (
        <p className="kl-num mt-3 text-[12px] text-[var(--kl-amber)]">
          {placed.position > 0
            ? `queued at position ${placed.position} — it starts when a machine frees up`
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
