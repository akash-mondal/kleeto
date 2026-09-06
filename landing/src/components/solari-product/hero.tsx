import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ActionPair } from "./buttons";
import { Container } from "./primitives";

/** Amber-outlined chip that names the product above the H1. */
export function HeroBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[3px] border border-sol-accent bg-sol-accent/10 px-2.5 py-1 font-mono text-[12px] font-medium tracking-[0.06em] text-sol-accent uppercase">
      {children}
    </span>
  );
}

/**
 * Shared hero for /browsers, /sandboxes and /desktops: product chip, two-tone
 * H1, supporting line, the Start for Free / View Docs pair, and a media column.
 */
export function ProductHero({
  badge,
  titleLead,
  titleAccent,
  description,
  media,
  stacked = true,
}: {
  badge: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  media: ReactNode;
  stacked?: boolean;
}) {
  return (
    <section className="pt-10 pb-16 md:pt-[46px] md:pb-[120px]">
      <Container>
        <div className="grid items-start gap-12 md:grid-cols-2 md:gap-x-14">
          <div className="flex flex-col items-center text-center md:items-start md:pt-[46px] md:text-left">
            <HeroBadge>{badge}</HeroBadge>
            <h1
              className={cn(
                "mt-7 text-[34px] leading-[1.06] font-normal tracking-[-0.03em] text-white md:mt-8 md:text-[55px]",
              )}
            >
              {titleLead}
              <span className={cn("text-sol-accent", stacked && "block")}>
                {stacked ? titleAccent : ` ${titleAccent}`}
              </span>
            </h1>
            <p className="mt-4 max-w-[420px] text-[15px] leading-[1.55] text-[#e7e7e2] md:mt-5 md:text-[16px]">
              {description}
            </p>
            <ActionPair className="mt-8 items-center md:mt-9" />
          </div>
          <div className="min-w-0">{media}</div>
        </div>
      </Container>
    </section>
  );
}
