"use client";

import { useState } from "react";
import { ChevronDownIcon, RunloopMark } from "./runloop-icons";
import { cn } from "@/lib/utils";

const DROPDOWNS = [
  {
    label: "Developer",
    items: [
      { title: "Docs", desc: "Guides and API reference" },
      { title: "Python SDK", desc: "Build with Python" },
      { title: "TypeScript SDK", desc: "Build with Node.js" },
      { title: "CLI Tool", desc: "Run from your terminal" },
      { title: "Demos", desc: "See Runloop in action" },
    ],
  },
  {
    label: "Company",
    items: [
      { title: "About Runloop", desc: "Learn who we are, what we’re building, and why it matters" },
      { title: "Careers", desc: "Work with us on the future of AI infrastructure" },
      { title: "Blog", desc: "Thoughts, updates, and technical insights" },
      { title: "Runloop in the Media", desc: "Press coverage and mentions across the web" },
    ],
  },
] as const;

const LINKS = ["Pricing", "Docs"] as const;

export function RunloopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6 md:pt-5">
      <nav className="mx-auto w-full max-w-[1120px] rounded-[390px] bg-white/85 px-5 py-3 shadow-[0_1px_2px_rgba(20,21,21,0.04),0_12px_28px_-20px_rgba(20,21,21,0.35)] backdrop-blur-md md:px-7 md:py-3.5">
        <div className="flex items-center justify-between gap-6">
          <a
            href="/runloop"
            className="flex shrink-0 items-center gap-2 text-run-fg"
            aria-label="Runloop home"
          >
            <RunloopMark className="size-[19px]" />
            <span className="text-[15px] leading-none font-bold tracking-[0.16em]">
              RUNLOOP
            </span>
          </a>

          <div className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            {DROPDOWNS.map((menu) => (
              <div key={menu.label} className="group relative">
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1.5 py-2 text-[13px] text-run-muted transition-colors hover:text-run-fg"
                  aria-haspopup="true"
                >
                  {menu.label}
                  <ChevronDownIcon className="size-3.5 text-run-subtle" />
                </button>
                <div className="invisible absolute top-full left-1/2 w-[300px] -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="rounded-[16px] bg-white p-2 shadow-[0_20px_50px_-20px_rgba(20,21,21,0.35)]">
                    {menu.items.map((item) => (
                      <a
                        key={item.title}
                        href="#"
                        className="block rounded-[10px] px-3 py-2.5 transition-colors hover:bg-run-section"
                      >
                        <span className="block text-[13px] font-medium text-run-fg">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-[1.45] text-run-muted">
                          {item.desc}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="py-2 text-[13px] text-run-muted transition-colors hover:text-run-fg"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-4 lg:flex">
            <a
              href="#"
              className="text-[13px] font-medium text-run-fg transition-opacity hover:opacity-70"
            >
              Contact Us
            </a>
            <a
              href="#"
              className="rounded-[390px] bg-run-card-deep px-5 py-2.5 text-[13px] leading-none font-medium text-white transition-opacity hover:opacity-90"
            >
              Login
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-run-section text-run-fg lg:hidden"
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
          <div className="mt-4 flex flex-col gap-1 border-t border-run-subtle/50 pt-4 lg:hidden">
            {[...DROPDOWNS.map((d) => d.label), ...LINKS, "Contact Us"].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="rounded-[10px] px-2 py-2.5 text-[14px] text-run-fg"
                >
                  {label}
                </a>
              ),
            )}
            <a
              href="#"
              className="mt-2 rounded-[390px] bg-run-card-deep px-5 py-3 text-center text-[13px] font-medium text-white"
            >
              Login
            </a>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
