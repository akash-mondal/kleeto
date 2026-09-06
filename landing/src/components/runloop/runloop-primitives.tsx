import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small uppercase label in a rounded white pill that sits above every heading. */
export function PillEyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[390px] px-3.5 py-1.5 font-[family-name:var(--font-plex-mono)] text-[11px] leading-none tracking-[0.14em] uppercase",
        tone === "light"
          ? "bg-white text-run-fg shadow-[0_1px_2px_rgba(20,21,21,0.06)]"
          : "bg-white/10 text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * The signature "boxed highlight word": the last word of a heading sits in a
 * thin outlined rounded box with four small circular handles at its corners,
 * like a selected object in a design tool.
 */
export function BoxedWord({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const line = tone === "light" ? "border-run-accent/50" : "border-[#2fe0a0]/70";
  const dot =
    tone === "light"
      ? "border-run-accent/60 bg-white"
      : "border-[#2fe0a0]/80 bg-[#0a1413]";
  const text = tone === "light" ? "text-run-accent" : "text-[#2fe0a0]";
  return (
    <span
      className={cn(
        "relative mx-1 inline-block border px-[0.28em] pt-[0.04em] pb-[0.1em] align-baseline",
        line,
        text,
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "absolute -top-[3px] -left-[3px] size-[6px] rounded-full border",
          dot,
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute -top-[3px] -right-[3px] size-[6px] rounded-full border",
          dot,
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute -bottom-[3px] -left-[3px] size-[6px] rounded-full border",
          dot,
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute -right-[3px] -bottom-[3px] size-[6px] rounded-full border",
          dot,
        )}
      />
    </span>
  );
}

/** Centred eyebrow + h2 + lede stack used by every section. */
export function SectionHeading({
  eyebrow,
  children,
  lede,
  className,
}: {
  eyebrow?: string;
  children: ReactNode;
  lede?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      {eyebrow ? <PillEyebrow className="mb-6">{eyebrow}</PillEyebrow> : null}
      <h2 className="w-full max-w-[16ch] text-[30px] leading-[1.12] font-medium tracking-[-0.02em] text-run-fg md:max-w-[820px] md:text-[44px]">
        {children}
      </h2>
      {lede ? (
        <p className="mt-4 w-full max-w-[52ch] text-[14px] leading-[1.6] text-run-muted md:max-w-[660px] md:text-[15px]">
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** Dark card used across the page (#353939, 24px radius). */
export function DarkCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-run-card shadow-[0_18px_40px_-24px_rgba(9,19,21,0.45)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
