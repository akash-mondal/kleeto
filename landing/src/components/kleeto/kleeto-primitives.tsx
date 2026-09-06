"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "@/components/solari-product/use-motion";

/** Small uppercase label in a pill. Light = on the page ground, dark = on a card. */
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
        "kl-num inline-flex items-center rounded-[390px] px-3.5 py-1.5 text-[11px] leading-none tracking-[0.14em] uppercase",
        tone === "light"
          ? "bg-white/80 text-kl-fg shadow-[0_1px_2px_oklch(0.21_0.012_85/0.06)]"
          : "bg-white/10 text-kl-on-card",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Boxed highlight word: outlined box with four corner handles, like a selected
 * object in a design tool. Amber on both light and dark.
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
  const text = tone === "light" ? "text-kl-amber-deep" : "text-kl-amber";
  const dot = tone === "light" ? "bg-[var(--kl-ground)]" : "bg-[var(--kl-card-deep)]";
  return (
    <span
      className={cn(
        "relative ml-[0.15em] inline-block border border-[var(--kl-amber)]/70 px-[0.26em] pt-[0.04em] pb-[0.1em] align-baseline",
        text,
        className,
      )}
    >
      {children}
      {["-top-[3px] -left-[3px]", "-top-[3px] -right-[3px]", "-bottom-[3px] -left-[3px]", "-bottom-[3px] -right-[3px]"].map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={cn("absolute size-[6px] rounded-full border border-[var(--kl-amber)]", dot, pos)}
        />
      ))}
    </span>
  );
}

/** Eyebrow + h2 + lede. Left-aligned by default; `align="center"` for the hero-like sections. */
export function SectionHeading({
  children,
  lede,
  align = "left",
  tone = "light",
  className,
}: {
  children: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2, once: true });
  const dark = tone === "dark";
  return (
    <div
      ref={ref}
      className={cn("flex flex-col", align === "center" ? "items-center text-center" : "items-start text-left", className)}
    >
      <h2
        data-shown={inView}
        className={cn(
          "kl-display kl-reveal w-full max-w-[18ch] text-[32px] leading-[1.08] font-medium md:text-[46px]",
          dark ? "text-kl-on-card" : "text-kl-fg",
        )}
      >
        {children}
      </h2>
      {lede ? (
        <p
          data-shown={inView}
          style={{ transitionDelay: "80ms" }}
          className={cn(
            "kl-reveal mt-5 w-full max-w-[56ch] text-[15px] leading-[1.6] [--kl-reveal-y:15.6px] md:text-[16px]",
            dark ? "text-kl-on-card-muted" : "text-kl-muted",
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** Dark warm card, 24px radius. Children draw on `--kl-on-card`. */
export function DarkCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "kl-card relative overflow-hidden rounded-[24px] shadow-[0_18px_40px_-24px_oklch(0.14_0.01_85/0.5)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Page-width wrapper. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 md:px-6", className)}>{children}</div>;
}

/** Scroll-reveal wrapper using the measured Solari curve. */
export function Reveal({
  children,
  className,
  delayMs = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  y?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15, once: true });
  return (
    <div
      ref={ref}
      data-shown={inView}
      style={{ transitionDelay: `${delayMs}ms`, ["--kl-reveal-y" as string]: `${y}px` }}
      className={cn("kl-reveal", className)}
    >
      {children}
    </div>
  );
}

/** Pill buttons. Primary = dark on light / amber on dark. */
export function PillButton({
  href,
  children,
  variant = "primary",
  tone = "light",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  tone?: "light" | "dark";
  className?: string;
}) {
  const primary =
    tone === "light"
      ? "bg-[var(--kl-card-deep)] text-kl-on-card hover:opacity-90"
      : "bg-[var(--kl-amber)] text-[var(--kl-card-deep)] hover:opacity-90";
  const ghost =
    tone === "light"
      ? "border border-kl-line text-kl-fg hover:bg-white/60"
      : "border border-white/20 text-kl-on-card hover:bg-white/10";
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-[390px] px-7 py-3.5 text-[13px] leading-none font-medium transition-[opacity,background-color]",
        variant === "primary" ? primary : ghost,
        className,
      )}
    >
      {children}
    </a>
  );
}
