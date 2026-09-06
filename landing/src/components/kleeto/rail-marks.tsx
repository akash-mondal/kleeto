import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The real marks for the rail this runs on: the x402 logo from x402.org, Circle's USDC,
 * and Hedera's own. Blocky402 publishes no logo asset, their site sets the name in type
 *, so the facilitator appears as a wordmark rather than an invented mark.
 */
export function RailMark({
  name,
  className,
}: {
  name: "x402" | "usdc" | "hedera";
  className?: string;
}) {
  const alt = { x402: "x402", usdc: "USDC", hedera: "Hedera" }[name];
  const ratio = name === "x402" ? 2.6 : 1;
  return (
    <Image
      src={`/images/rail/${name}.svg`}
      alt={alt}
      width={Math.round(24 * ratio)}
      height={24}
      className={cn("h-6 w-auto", className)}
      unoptimized
    />
  );
}

/** The three marks in a row, used under the billing and receipt headings. */
export function RailRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-5", className)}>
      <RailMark name="x402" className="h-5" />
      <span aria-hidden className="h-4 w-px bg-kl-line" />
      <RailMark name="usdc" className="h-5" />
      <span aria-hidden className="h-4 w-px bg-kl-line" />
      <RailMark name="hedera" className="h-5" />
    </div>
  );
}
