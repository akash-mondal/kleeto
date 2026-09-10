"use client";

import { useEffect, useState } from "react";

/**
 * The demo agent's own money, read live off the ledger.
 *
 * It sits at the top of the workspace because it is the whole argument: this agent has a
 * wallet and no account with us, and the number goes down as it works. A mocked figure here
 * would undo the point, so it comes from the mirror node through the gateway and shows a
 * dash rather than a guess when it cannot be read.
 */
type Balance = {
  agent: string;
  hbar: { display: string; usd: number };
  usdc: { display: string };
  explorer: string;
};

const GATEWAY = process.env.NEXT_PUBLIC_KLEETO_GATEWAY ?? "https://api.kleeto.fun";

export function AgentBalance() {
  const [b, setB] = useState<Balance | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const read = async () => {
      try {
        const r = await fetch(`${GATEWAY}/v1/demo`, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (alive) { setB(j); setErr(false); }
      } catch {
        if (alive) setErr(true);
      }
    };
    read();
    const t = setInterval(read, 10000);      // it moves while the agent works
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]">
      <span className="flex items-center gap-2">
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--kl-amber)]" />
        <span className="text-white/45">test agent</span>
        <a
          href={b?.explorer ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="kl-num text-white/80 underline-offset-4 hover:underline"
        >
          {b?.agent ?? "0.0.…"}
        </a>
      </span>
      <span className="kl-num text-white/70">
        {err ? "—" : b ? `${b.hbar.display} HBAR` : "…"}
        {b && !err ? <span className="text-white/35"> (${b.hbar.usd.toFixed(2)})</span> : null}
      </span>
      <span className="kl-num text-white/70">{err ? "—" : b ? `${b.usdc.display} USDC` : "…"}</span>
      <span className="text-white/35">hedera:testnet</span>
    </div>
  );
}
