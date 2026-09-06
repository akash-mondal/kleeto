import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Page-wide horizontal rhythm: 1200px cap, 1080px of content at desktop. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-6 lg:px-[60px]", className)}>{children}</div>
  );
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("py-16 md:py-[104px]", className)}>
      <Container>{children}</Container>
    </section>
  );
}

/** Amber square + uppercase letterspaced label that sits above every section. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-sol-accent uppercase md:text-[11px]",
        className,
      )}
    >
      <span aria-hidden className="inline-block size-[5px] bg-sol-accent" />
      {children}
    </p>
  );
}

/**
 * Section headline. The first clause is white, the second is amber — the
 * signature Solari two-tone heading used on every section of every product page.
 */
export function SectionHeading({
  lead,
  accent,
  stacked = false,
  className,
}: {
  lead: string;
  accent?: string;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[26px] leading-[1.14] font-normal tracking-[-0.02em] text-white md:text-[36px]",
        className,
      )}
    >
      {lead}
      {accent ? (
        <span className={cn("text-sol-accent", stacked && "block")}>{stacked ? accent : ` ${accent}`}</span>
      ) : null}
    </h2>
  );
}

export function SectionIntro({
  eyebrow,
  lead,
  accent,
  stacked,
  className,
}: {
  eyebrow: string;
  lead: string;
  accent?: string;
  stacked?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <SectionHeading lead={lead} accent={accent} stacked={stacked} />
    </div>
  );
}

/** Body copy that follows a chart, table or feature grid. */
export function SectionNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("max-w-[700px] text-[15px] leading-[1.55] text-[#e7e7e2]", className)}>
      {children}
    </p>
  );
}

/** Dense grey caption used under benchmark tables. */
export function Footnote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("max-w-[1000px] text-[11px] leading-[1.6] text-sol-muted", className)}>
      {children}
    </p>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[4px] border border-white/10 bg-sol-panel", className)}>{children}</div>
  );
}

/** Small uppercase mono label used inside every mock UI on these pages. */
export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[9px] tracking-[0.16em] uppercase", className)}>{children}</span>
  );
}
