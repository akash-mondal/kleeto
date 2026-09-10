"use client";

import { useState } from "react";
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

export function Composer({ onRun }: { onRun?: (prompt: string) => void }) {
  const [value, setValue] = useState("");

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
        <div className="flex items-center gap-2 px-3 pb-3">
          <span className="kl-num flex items-center gap-2 rounded-[8px] border border-white/10 px-2.5 py-1.5 text-[11.5px] text-white/60">
            <span aria-hidden className="size-1.5 rounded-full bg-[var(--kl-amber)]" />
            GPT-6 Astra
          </span>
          <span className="kl-num rounded-[8px] border border-white/10 px-2.5 py-1.5 text-[11.5px] text-white/45">
            High
          </span>
          <span className="kl-num hidden rounded-[8px] border border-white/10 px-2.5 py-1.5 text-[11.5px] text-white/45 sm:inline">
            x402 · testnet
          </span>
          <span className="flex-1" />
          <button
            type="button"
            disabled={!value.trim()}
            onClick={() => onRun?.(value.trim())}
            className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] bg-[var(--kl-amber)] text-[#171310] transition-opacity disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Send"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

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
