import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SolariButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

const base =
  "inline-flex h-[46px] items-center justify-center rounded-[4px] px-7 font-mono text-[13px] tracking-[0.1em] uppercase transition-colors";

/** Filled white pill — `Start for Free`. */
export function SolariButton({ href, children, className }: SolariButtonProps) {
  return (
    <Link
      href={href}
      className={cn(base, "bg-white text-black ring-1 ring-white/60 hover:bg-[#e7e7e2]", className)}
    >
      {children}
    </Link>
  );
}

/** Second button in the pair — same white fill, softer ring. */
export function SolariButtonSecondary({ href, children, className }: SolariButtonProps) {
  return (
    <Link
      href={href}
      className={cn(base, "bg-white text-black ring-1 ring-white/30 hover:bg-[#e7e7e2]", className)}
    >
      {children}
    </Link>
  );
}

/**
 * The `Start for Free` / `View Docs` pair that opens all three product pages.
 * `secondLabel` swaps to `CONTACT SALES` in the closing CTA.
 */
export function ActionPair({
  secondLabel = "View Docs",
  secondHref = "#docs",
  className,
}: {
  secondLabel?: string;
  secondHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-3 sm:w-auto sm:flex-row", className)}>
      <SolariButton href="#start" className="w-full sm:w-[212px]">
        Start for Free
      </SolariButton>
      <SolariButtonSecondary href={secondHref} className="w-full sm:w-[186px]">
        {secondLabel}
      </SolariButtonSecondary>
    </div>
  );
}
