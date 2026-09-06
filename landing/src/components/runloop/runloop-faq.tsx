"use client";

import { useState } from "react";
import { PlusIcon, ShieldIcon, SlidersIcon, ToolboxIcon } from "./runloop-icons";
import { PillEyebrow } from "./runloop-primitives";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

const TABS = [
  {
    label: "Features & Security",
    Icon: ShieldIcon,
    items: [
      {
        q: "How easy is it to integrate Runloop with existing AI development pipelines?",
        a: "Integration is straightforward through RunLoop's comprehensive API that maintains existing development workflows while adding powerful sandbox capabilities. The platform provides SDK support and shell tools that can be easily incorporated into current agent architectures. The robust UI makes oversight a easy.",
      },
      {
        q: "What makes Runloop's AI code execution infrastructure enterprise-grade?",
        a: "Runloop delivers SOC2-compliant infrastructure with 24/7 support, comprehensive API access, and enterprise security standards including isolated execution environments and optimized resource allocation. The platform maintains operational reliability while enabling organizations to safely experiment with AI-assisted development at scale.",
      },
      {
        q: "How does Runloop ensure safe and secure code execution for AI agents?",
        a: "Runloop provides enterprise-grade security through isolated micro-VMs that create strong hardware-level boundaries between tenants, preventing AI-generated code from one agent from affecting another. Each Devbox runs in complete isolation with strict network policies and SOC2-compliant infrastructure.",
      },
    ] satisfies FaqItem[],
  },
  {
    label: "The Runloop Difference",
    Icon: SlidersIcon,
    items: [
      {
        q: "Why are AI coding agent benchmarks essential?",
        a: "Benchmarks provide standardized evaluation against industry datasets like SWE-smith, allowing developers to validate agent performance and measure improvements objectively. Runloop's public benchmarks eliminate setup complexity and accelerate developer productivity.",
      },
      {
        q: "What types of AI use cases benefit from Runloop’s infrastructure?",
        a: "Runloop serves AI-first teams that are building coding agents for various innovative use cases. These include applications like automated code review, test generation, long-context debugging, RL-based code synthesis, and benchmark evaluation (e.g., SWE-bench, Multi-SWE). Our customers span a range of organizations, including startups focused on developing AI developer tools, enterprise innovation teams exploring autonomous agents, and academic labs conducting cutting-edge agentic research.",
      },
      {
        q: "Why do AI coding agents need new infrastructure?",
        a: "Traditional serverless and SaaS environments are built for stateless, short-lived tasks. AI agents are long-running, interactive, and stateful—they need a full environment (like a developer laptop), not just a function runner. Runloop’s devboxes provide that environment, with full filesystem access, browser support, snapshots, and isolation. We optimize for fast boot time, suspend/resume, and reliability under bursty, probabilistic workloads.",
      },
    ] satisfies FaqItem[],
  },
  {
    label: "Using Runloop",
    Icon: ToolboxIcon,
    items: [
      {
        q: "How does Runloop support agentic AI workflows?",
        a: "Runloop builds the infrastructure layer for AI coding agents. Our platform provides enterprise-grade devboxes—secure, cloud-hosted development environments where AI agents can safely build, test, and deploy code. These devboxes handle complex, stateful workflows that traditional SaaS infrastructure can't support.",
      },
      {
        q: "Is Runloop suitable for both individual developers and enterprise teams?",
        a: "Yes. The Basic plan supports individual developers and small teams exploring agent infrastructure with no upfront cost. Pro is designed for teams running agents in production with custom benchmarks and higher concurrency. Enterprise covers large organizations with compliance requirements, VPC deployment needs, and high-volume workloads that benefit from custom pricing and dedicated support.",
      },
      {
        q: "How does Runloop pricing work?",
        a: "Runloop is usage-based, with pricing tiers based on compute resources, memory, and desired SLA. We support generous free trials with usage credits to test the platform. For enterprise customers, we offer discounts by volume and commitment-based pricing.",
      },
    ] satisfies FaqItem[],
  },
] as const;

export function RunloopFaq() {
  const [tab, setTab] = useState(0);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const active = TABS[tab];

  return (
    <section className="px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-[1360px] rounded-[32px] bg-white px-4 py-16 md:rounded-[40px] md:px-12 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <div className="flex flex-col items-center text-center">
            <PillEyebrow className="mb-6 bg-run-section shadow-none">
              Faq&apos;s
            </PillEyebrow>
            <h2 className="w-full text-[30px] leading-[1.12] font-medium tracking-[-0.02em] text-run-fg md:text-[44px]">
              Everything You Need to Know
            </h2>
            <p className="mt-4 w-full max-w-[56ch] text-[14px] leading-[1.6] text-run-muted md:max-w-[620px] md:text-[15px]">
              We’re dedicated to solving the complex challenges of
              productionizing AI for software engineering at scale.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="FAQ categories"
            className="mt-10 flex flex-wrap items-center justify-center gap-2 rounded-[390px] bg-run-section p-1.5"
          >
            {TABS.map((entry, index) => (
              <button
                key={entry.label}
                type="button"
                role="tab"
                aria-selected={index === tab}
                onClick={() => {
                  setTab(index);
                  setOpenQuestion(null);
                }}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[390px] px-4 py-2.5 text-[13px] whitespace-nowrap transition-colors",
                  index === tab
                    ? "bg-white text-run-fg shadow-[0_1px_2px_rgba(20,21,21,0.08)]"
                    : "text-run-muted hover:text-run-fg",
                )}
              >
                {index === tab ? (
                  <entry.Icon className="size-4 text-run-accent" />
                ) : null}
                {entry.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="mt-8 divide-y divide-run-subtle/60">
            {active.items.map((item) => {
              const isOpen = openQuestion === item.q;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(isOpen ? null : item.q)}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-start justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-[14px] leading-[1.5] font-medium text-run-fg md:text-[15px]">
                      {item.q}
                    </span>
                    <PlusIcon
                      className={cn(
                        "mt-0.5 size-4 shrink-0 text-[#a1a5a5] transition-transform duration-200",
                        isOpen && "rotate-45",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-6 text-[13px] leading-[1.65] text-run-muted md:text-[14px]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
