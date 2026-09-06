"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Container, Eyebrow, SectionHeading } from "./primitives";

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * The same eight questions run under every product page. Answers are written
 * from the product copy on these pages — the live accordion ships its bodies
 * lazily, so they are not present in the captured DOM.
 */
export const SOLARI_FAQ: readonly FaqItem[] = [
  {
    question: "What is Solari?",
    answer:
      "Solari is agent infrastructure: cloud browsers, sandboxes and full desktops that agents can drive. One control plane, one client contract, and the fastest cold starts of any provider we have measured.",
  },
  {
    question: "What's the difference between a browser, a sandbox, and a VM?",
    answer:
      "A cloud browser is a managed Chromium session for web automation. A sandbox is an isolated microVM for running code, tools and long tasks. A desktop is a full machine with a screen, so agents can use real applications with mouse and keyboard.",
  },
  {
    question: "Can Solari run in our VPC?",
    answer:
      "Yes. Solari can be deployed inside your own network so sessions, files and telemetry never leave your perimeter, while you keep the same SDKs and control plane.",
  },
  {
    question: "Can agents pause work and resume it later?",
    answer:
      "Yes. When a session goes idle it pauses instead of shutting down and stops billing. Files, processes and machine size stay intact, and the session resumes in under a second.",
  },
  {
    question: "What languages and frameworks does Solari support?",
    answer:
      "There are SDKs for TypeScript, Python, Go, Rust and C++, and browsers connect through Playwright, Puppeteer, Selenium or raw CDP without rewriting your agent.",
  },
  {
    question: "How do agents stay undetected in Solari browsers?",
    answer:
      "Solari humanizes cursor movement with curved paths, variable speeds, natural acceleration and subtle overshoot, and adds CAPTCHA solving plus residential proxy support for harder-to-access sites.",
  },
  {
    question: "How does Solari run AI-generated code safely?",
    answer:
      "Every sandbox is a Cloud Hypervisor microVM with its own kernel and hardware-backed isolation, so model-generated and untrusted code never shares a kernel with the rest of your infrastructure.",
  },
  {
    question: "Can I bring my own environment?",
    answer:
      "Yes. Start every session from your own image, with your exact runtime, dependencies, tools and system configuration already installed.",
  },
];

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[4px] border border-white/10 bg-sol-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <span className="text-[13px] leading-[1.4] text-white md:text-[14px]">{item.question}</span>
        {open ? (
          <Minus className="size-4 shrink-0 text-[#f0f2f5]" />
        ) : (
          <Plus className="size-4 shrink-0 text-[#f0f2f5]" />
        )}
      </button>
      <div className={cn("px-4 pb-4", !open && "hidden")}>
        <p className="text-[13px] leading-[1.6] text-sol-muted">{item.answer}</p>
      </div>
    </div>
  );
}

/** FAQ block: heading on the left, accordion on the right. */
export function FaqSection({ items = SOLARI_FAQ }: { items?: readonly FaqItem[] }) {
  return (
    <section className="py-16 md:py-[104px]">
      <Container>
        <div className="grid gap-10 md:grid-cols-2 md:gap-x-14">
          <div className="flex flex-col gap-3">
            <Eyebrow>FAQ</Eyebrow>
            <SectionHeading lead="Before you deploy." accent="Everything you need to know" stacked />
          </div>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <FaqRow key={item.question} item={item} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
