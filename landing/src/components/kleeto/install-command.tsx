"use client";

import { useState } from "react";

/**
 * The one line that puts Kleeto inside someone's own agent.
 *
 * A command, not a docs link: the people this page is for already live in a terminal, and the
 * fastest proof that there is no signup is that there is nothing to sign up for before pasting.
 * The skill's repo carries the highlight because it is the only part worth remembering.
 */
export const INSTALL = { tool: "npx skills add", pkg: "akash-mondal/kleeto-skill" } as const;

export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const line = `${INSTALL.tool} ${INSTALL.pkg}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(line);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* no clipboard permission: the command is still selectable text */
    }
  };

  return (
    <div className="w-full max-w-[520px] text-left">
      <span
        className="block text-[10.5px] tracking-[0.18em] text-kl-muted uppercase"
        style={{ fontFamily: "var(--font-azeret)" }}
      >
        Install on your agent
      </span>
      {/* never truncated: a command cut off at the width of a phone is a command nobody can read.
          On a narrow screen the repo drops to its own line instead of hiding off the edge. */}
      <div className="mt-2.5 flex items-center gap-3 rounded-[12px] bg-[var(--kl-card-deep)] py-3 pr-3 pl-4 text-[12.5px] text-kl-on-card sm:py-3.5 sm:pl-5 sm:text-[14px]">
        <code
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5 select-all"
          style={{ fontFamily: "var(--font-azeret)" }}
        >
          <span className="whitespace-nowrap">
            <span className="text-kl-on-card/45">$ </span>
            {INSTALL.tool}
          </span>
          <span className="rounded-[4px] bg-[var(--kl-amber)]/18 px-1.5 py-0.5 whitespace-nowrap text-[var(--kl-amber)]">
            {INSTALL.pkg}
          </span>
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy install command"}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-kl-on-card/55 transition-colors hover:bg-white/10 hover:text-kl-on-card"
        >
          {copied ? (
            <svg viewBox="0 0 16 16" aria-hidden className="size-4 text-[var(--kl-amber)]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
              <path d="M10.5 3.5v-.4A1.1 1.1 0 0 0 9.4 2H3.1A1.1 1.1 0 0 0 2 3.1v6.3a1.1 1.1 0 0 0 1.1 1.1h.4" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-[1.55] text-kl-muted">
        Works with Claude Code, Codex, Cursor and dozens more agents.
      </p>
    </div>
  );
}
