import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * The rendered receipt: a light thermal-printer slip in Azeret Mono. Hairline
 * border, no shadow, a perforated bottom edge cut with a radial-gradient mask.
 */

type Row = { label: string; value: string; accent?: boolean };

/** A real lease on the live gateway, paid over x402 in USDC and anchored to the topic. */
const ROWS: readonly Row[] = [
  { label: "lease", value: "ls_UgEORVjOD72i" },
  { label: "lane", value: "machine-1" },
  { label: "first tick", value: "2026-09-11 18:36:54Z" },
  { label: "seconds", value: "8" },
  { label: "rate", value: "23,061 tinybar/s" },
  { label: "tinybar", value: "184,488" },
  { label: "paid in", value: "USDC over x402" },
];

const PROOF: readonly Row[] = [
  { label: "genesis", value: "005b3f…5e1df0" },
  { label: "chain head", value: "c6a453…588eeb", accent: true },
];

const PERFORATION: CSSProperties = {
  // 12px pitch of 5px-radius holes bitten out of the bottom edge.
  WebkitMaskImage: "radial-gradient(circle at 6px 100%, transparent 5px, #000 5.5px)",
  maskImage: "radial-gradient(circle at 6px 100%, transparent 5px, #000 5.5px)",
  WebkitMaskSize: "12px 100%",
  maskSize: "12px 100%",
  WebkitMaskRepeat: "repeat-x",
  maskRepeat: "repeat-x",
};

function ReceiptRow({ row }: { row: Row }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-kl-muted">{row.label}</dt>
      <dd className={cn("text-right", row.accent ? "text-kl-amber-deep" : "text-kl-fg")}>{row.value}</dd>
    </div>
  );
}

function Dashed() {
  return <hr className="my-4 border-0 border-t border-dashed border-kl-line" aria-hidden />;
}

export function ReceiptCard({ className }: { className?: string }) {
  return (
    <div
      style={PERFORATION}
      className={cn(
        "kl-num rounded-t-[16px] border border-kl-line bg-white/70 px-6 pt-6 pb-8 text-[12px] leading-[1.7] md:text-[13px]",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4 text-[11px] tracking-[0.14em] uppercase">
        <span className="text-kl-fg">Kleeto · Receipt</span>
        <span className="text-kl-muted">hedera:testnet</span>
      </div>

      <Dashed />

      <dl className="flex flex-col gap-0.5">
        {ROWS.map((row) => (
          <ReceiptRow key={row.label} row={row} />
        ))}
      </dl>

      <Dashed />

      <dl className="flex flex-col gap-0.5">
        {PROOF.map((row) => (
          <ReceiptRow key={row.label} row={row} />
        ))}
      </dl>
      <p className="mt-2 text-kl-muted">hcs topic 0.0.10454763 · seq 4</p>

      <Dashed />

      <p className="text-[11px] leading-[1.6] break-all text-kl-muted">
        each second: sha256(prev|seq|leaseId|tinybar|at)
      </p>
    </div>
  );
}
