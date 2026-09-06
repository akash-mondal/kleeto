"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Container, Eyebrow, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

type FaqItem = { q: string; a: string };

/**
 * Questions are verbatim from the source DOM. The source ships every panel closed and
 * does not render answer copy into the saved HTML, so the answers below are written to
 * match the site's own claims (see the products, performance and platform sections).
 */
const ITEMS: readonly FaqItem[] = [
  {
    q: "What is Solari?",
    a: "Solari is the infrastructure layer AI agents run on. Browsers, sandboxes, and desktops are all available from one API, with the same authentication and session management across every environment.",
  },
  {
    q: "What's the difference between a browser, a sandbox, and a VM?",
    a: "A cloud browser is a hosted browser session for agents that need to browse, authenticate, and interact with the web. A sandbox is isolated compute for running code and tools. A desktop is a full operating system for agents that need to control applications directly.",
  },
  {
    q: "Can Solari run in our VPC?",
    a: "Yes. Solari can be deployed inside your own cloud account so environments, session data, and network traffic stay within your perimeter.",
  },
  {
    q: "Can agents pause work and resume it later?",
    a: "Yes. Sandboxes and desktops restore from memory snapshots, so an agent can pause an idle workflow and resume the same applications and state in under a second.",
  },
  {
    q: "What languages and frameworks does Solari support?",
    a: "Drive browsers with Playwright, Puppeteer, or any CDP client. Sandboxes and desktops run standard Linux images, so Python, Node.js, and anything you can install in a container works.",
  },
  {
    q: "How do agents stay undetected in Solari browsers?",
    a: "Browser sessions launch with stealth, residential proxies, and captcha handling as first-class launch options, so agents keep working on sites that block ordinary automation.",
  },
  {
    q: "How does Solari run AI-generated code safely?",
    a: "Generated code executes inside an isolated sandbox with its own filesystem and network boundary. Nothing an agent runs can reach your systems, and every environment is torn down when the task finishes.",
  },
  {
    q: "Can I bring my own environment?",
    a: "Yes. Start browsers, sandboxes, and desktops from your own image so your packages, dependencies, tools, and system configuration are already installed and ready.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-sol-bg py-20 md:py-[120px]">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[500px_1fr] md:gap-x-[80px]">
          <Reveal variant="heading">
            <Eyebrow>FAQ</Eyebrow>
            <SectionHeading
              className="mt-5"
              lead="Before you deploy."
              highlight="Everything you need to know."
              tone="muted"
              breakLine
            />
          </Reveal>

          <div className="flex flex-col gap-3">
            {ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <Reveal
                  key={item.q}
                  variant="media"
                  delay={i * 60}
                  className="rounded-[4px] border border-white/10 bg-sol-panel"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <span className="flex-1 text-[15px] leading-[1.35] text-white">{item.q}</span>
                    <Plus
                      aria-hidden
                      strokeWidth={1.5}
                      className={`size-5 shrink-0 text-[#f0f2f5] transition-transform duration-200 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                  {isOpen ? (
                    <p className="px-5 pb-4 text-[14px] leading-[1.55] text-sol-muted">{item.a}</p>
                  ) : null}
                </Reveal>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
