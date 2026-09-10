"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { KleetoMark } from "./kleeto-logo";
import { PillButton } from "./kleeto-primitives";

const LINKS = [
  { label: "Desktop", href: "#desktop" },
  { label: "Browser", href: "#browser" },
  { label: "Lanes", href: "#lanes" },
  { label: "x402", href: "#meter" },
  { label: "Docs", href: "#" },
] as const;

function Wordmark() {
  return (
    <a href="/" className="flex shrink-0 items-center gap-2 text-kl-fg" aria-label="Kleeto home">
      <KleetoMark className="size-[22px] text-kl-fg" />
      <span
        className="text-[15px] leading-none font-semibold tracking-[0.16em]"
        style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"wdth" 118' }}
      >
        KLEETO
      </span>
    </a>
  );
}

export function KleetoNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6 md:pt-5">
      <nav className="mx-auto w-full max-w-[1120px] rounded-[390px] border border-[var(--kl-line)]/60 bg-[oklch(0.985_0.005_85/0.85)] px-5 py-3 shadow-[0_1px_2px_oklch(0.21_0.012_85/0.04),0_12px_28px_-20px_oklch(0.21_0.012_85/0.35)] backdrop-blur-md md:px-7 md:py-3.5">
        <div className="flex items-center justify-between gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <Wordmark />

          <div className="hidden items-center justify-center gap-7 lg:flex">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="py-2 text-[13px] text-kl-muted transition-colors hover:text-kl-fg"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden shrink-0 items-center justify-end gap-2.5 lg:flex">
            <PillButton href="#" variant="ghost" className="px-5 py-2.5">
              Read the docs
            </PillButton>
            <PillButton href="/demo" className="px-5 py-2.5">
              Try the demo
            </PillButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="kleeto-nav-menu"
            aria-label="Toggle navigation"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-[var(--kl-section)] text-kl-fg lg:hidden"
          >
            <span className="relative block h-[10px] w-[14px]">
              <span
                className={cn(
                  "absolute left-0 block h-px w-full bg-current transition-transform",
                  open ? "top-[5px] rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 block h-px w-full bg-current transition-transform",
                  open ? "top-[5px] -rotate-45" : "top-[9px]",
                )}
              />
            </span>
          </button>
        </div>

        {open ? (
          <div id="kleeto-nav-menu" className="mt-4 flex flex-col gap-1 border-t border-kl-line pt-4 lg:hidden">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-[8px] px-2 py-2.5 text-[14px] text-kl-fg"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <PillButton href="#" variant="ghost" className="w-full">
                Read the docs
              </PillButton>
              <PillButton href="/demo" className="w-full">
                Try the demo
              </PillButton>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
