import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-6 lg:px-[60px]", className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-[12px] tracking-[0.12em] text-sol-accent uppercase",
        className,
      )}
    >
      <span aria-hidden className="inline-block size-[5px] bg-sol-accent" />
      {children}
    </p>
  );
}

/** Section H2 — first half white, second half amber (or muted). */
export function SectionHeading({
  lead,
  highlight,
  tone = "accent",
  breakLine = false,
  className,
}: {
  lead: string;
  highlight?: string;
  tone?: "accent" | "muted";
  breakLine?: boolean;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[26px] leading-[1.16] font-normal tracking-[-0.015em] text-white sm:text-[30px] md:text-[36px]",
        className,
      )}
    >
      {lead}
      {highlight ? (
        <>
          {breakLine ? <br /> : " "}
          <span className={tone === "accent" ? "text-sol-accent" : "text-sol-muted"}>
            {highlight}
          </span>
        </>
      ) : null}
    </h2>
  );
}

/** The site's only filled button: near-white face inside a translucent 4px frame. */
export function SolidButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-block rounded-[4px] bg-white/[0.06] p-1", className)}>
      <Link
        href={href}
        className="flex h-10 items-center justify-center rounded-[2px] bg-[#fcfdfd] px-6 font-mono text-[13px] tracking-[0.09em] text-black uppercase transition-colors hover:bg-white"
      >
        {children}
      </Link>
    </span>
  );
}

/** Outlined uppercase CTA used inside cards and under the benchmark charts. */
export function OutlineButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-[2px] border border-white/15 px-4 font-mono text-[12px] tracking-[0.09em] text-white uppercase transition-colors hover:border-white/35 hover:bg-white/5",
        className,
      )}
    >
      {children}
    </Link>
  );
}
