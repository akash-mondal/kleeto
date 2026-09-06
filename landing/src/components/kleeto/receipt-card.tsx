import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * The rendered receipt: a light thermal-printer slip in Azeret Mono. Hairline
 * border, no shadow, a perforated bottom edge cut with a radial-gradient mask.
 */

type Row = { label: string; value: string; accent?: boolean };

const ROWS: readonly Row[] = [
  { label: "lease", value: "ls_9k2m…" },
  { label: "lane", value: "desktop-2" },
  { label: "started", value: "2026-09-04 10:21:15Z" },
  { label: "seconds", value: "252" },
  { label: "rate", value: "53000 tinybar/s" },
  { label: "credits used", value: "252" },
  { label: "tinybar", value: "13,356,000" },
  { label: "USD", value: "$0.0104" },
  { label: "refunded", value: "3,120 credits" },
];

const PROOF: readonly Row[] = [
  { label: "files out", value: "3" },
  { label: "root", value: "7f3a9c…e2c19e", accent: true },
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
      <p className="mt-2 text-kl-muted">hcs topic 0.0.7181234 · seq 1204</p>

      <Dashed />

      <p className="text-[11px] leading-[1.6] break-all text-kl-muted">
        kid did:hedera:testnet:z6Mk…#key-1 · ES256K
      </p>
    </div>
  );
}
