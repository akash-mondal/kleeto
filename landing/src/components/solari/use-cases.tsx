"use client";

import { useState } from "react";
import {
  Bot,
  Box,
  Brain,
  Building2,
  ChartColumn,
  Clock,
  Code,
  Eye,
  FileInput,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Globe,
  KeyRound,
  Landmark,
  Layers,
  Monitor,
  MousePointerClick,
  Repeat,
  Search,
  ShieldCheck,
  ShoppingCart,
  SquareTerminal,
  TestTube,
  Ticket,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Container, Eyebrow, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

type UseCase = {
  icon: LucideIcon;
  title: string;
  description: string;
  tags: readonly string[];
};

type Group = { id: string; label: string; icon: LucideIcon; items: readonly UseCase[] };

const GROUPS: readonly Group[] = [
  {
    id: "browsers",
    label: "Browsers",
    icon: Globe,
    items: [
      {
        icon: Search,
        title: "Web Scraping",
        description:
          "Pull pricing, listings, company data, and market signals from live websites without maintaining brittle scraping infrastructure.",
        tags: ["Amazon", "LinkedIn", "Google"],
      },
      {
        icon: Bot,
        title: "Browser Agents",
        description:
          "Let agents navigate sites, fill forms, upload files, and complete multi-step browser workflows end to end.",
        tags: ["Salesforce", "HubSpot", "Stripe"],
      },
      {
        icon: ShoppingCart,
        title: "E-Commerce Monitoring",
        description:
          "Track prices, inventory, listings, and competitor changes continuously instead of checking marketplaces manually.",
        tags: ["Amazon", "Shopify", "Google"],
      },
      {
        icon: KeyRound,
        title: "Authenticated Workflows",
        description:
          "Keep sessions signed in so agents can return to authenticated portals and continue work without logging in every run.",
        tags: ["Salesforce", "HubSpot", "Stripe"],
      },
      {
        icon: Users,
        title: "Lead Research",
        description:
          "Find companies, collect prospect data, and enrich records automatically before leads enter your sales workflow.",
        tags: ["LinkedIn", "Google", "HubSpot"],
      },
      {
        icon: TestTube,
        title: "End-to-End Testing",
        description:
          "Test signup, login, checkout, and account flows in real browser sessions before broken journeys reach customers.",
        tags: ["Shopify", "Stripe", "GitHub"],
      },
      {
        icon: Eye,
        title: "Competitive Intelligence",
        description:
          "Monitor competitor pricing, products, and site changes automatically instead of repeatedly checking pages by hand.",
        tags: ["Google", "Amazon", "Shopify"],
      },
      {
        icon: FileInput,
        title: "Portal Automation",
        description:
          "Enter data, submit forms, and complete workflows inside portals that don't expose the APIs your agents need.",
        tags: ["Salesforce", "HubSpot", "Stripe"],
      },
      {
        icon: Layers,
        title: "High-Volume Operations",
        description:
          "Run browser sessions in parallel so large automation workloads finish faster without manually managing each session.",
        tags: ["Amazon", "LinkedIn", "Google"],
      },
    ],
  },
  {
    id: "sandboxes",
    label: "Sandboxes",
    icon: Box,
    items: [
      {
        icon: Code,
        title: "Code Interpreter",
        description:
          "Execute generated code and return files, charts, tables, or structured output without provisioning infrastructure for each task.",
        tags: ["Python", "Node.js", "Jupyter"],
      },
      {
        icon: SquareTerminal,
        title: "Coding Agents",
        description:
          "Give agents a clean workspace to edit code, install packages, run commands, test changes, and debug safely.",
        tags: ["GitHub", "VS Code", "Git"],
      },
      {
        icon: ShieldCheck,
        title: "AI Evaluations",
        description:
          "Run identical agent tasks in reproducible environments to compare models, prompts, and agent behavior reliably.",
        tags: ["Python", "Docker", "GitHub"],
      },
      {
        icon: Brain,
        title: "Reinforcement Learning",
        description:
          "Launch, reset, and fork training environments in parallel to scale agent rollouts without manually managing compute.",
        tags: ["PyTorch", "Python", "Linux"],
      },
      {
        icon: ChartColumn,
        title: "Data Analysis",
        description:
          "Load datasets, run analysis, and generate charts or artifacts so agents can finish analytical workflows end to end.",
        tags: ["Python", "Jupyter", "PyTorch"],
      },
      {
        icon: Layers,
        title: "Parallel Execution",
        description:
          "Split large workloads across multiple environments so independent jobs execute simultaneously instead of sequentially.",
        tags: ["Docker", "Linux", "GitHub"],
      },
      {
        icon: Clock,
        title: "Long-Running Jobs",
        description:
          "Keep processes alive for tasks that take minutes or hours without forcing agents to restart their work.",
        tags: ["Linux", "Python", "Node.js"],
      },
      {
        icon: GitBranch,
        title: "Build & Test",
        description:
          "Build projects and run integration tests in clean environments so generated code is validated before production.",
        tags: ["GitHub", "Docker", "Git"],
      },
      {
        icon: Box,
        title: "Bring Your Own Environment",
        description:
          "Start agents with your packages, dependencies, tools, and system configuration already installed and ready.",
        tags: ["Docker", "Ubuntu", "Linux"],
      },
    ],
  },
  {
    id: "desktops",
    label: "Desktops",
    icon: Monitor,
    items: [
      {
        icon: Building2,
        title: "ERP & CRM Automation",
        description:
          "Enter records, update accounts, and complete workflows inside enterprise applications without repetitive manual system work.",
        tags: ["Salesforce", "SAP", "Oracle"],
      },
      {
        icon: MousePointerClick,
        title: "Computer Use",
        description:
          "Let agents click, type, open applications, and complete workflows that require direct interaction with desktop software.",
        tags: ["Windows", "Ubuntu", "Linux"],
      },
      {
        icon: FileText,
        title: "Document Workflows",
        description:
          "Create reports, edit spreadsheets, and move data between desktop applications without repetitive copy-and-paste work.",
        tags: ["Excel", "Word", "Notion"],
      },
      {
        icon: Landmark,
        title: "Finance Operations",
        description:
          "Reconcile records, update financial systems, and complete recurring finance workflows across spreadsheets and ERP software.",
        tags: ["Excel", "SAP", "Oracle"],
      },
      {
        icon: Ticket,
        title: "IT Service Operations",
        description:
          "Open tickets, update incidents, and complete repetitive service workflows so IT teams can clear operational queues faster.",
        tags: ["ServiceNow", "Slack", "Windows"],
      },
      {
        icon: UserCog,
        title: "HR Operations",
        description:
          "Update employee records and process recurring HR requests across enterprise systems without repetitive administrative work.",
        tags: ["Workday", "SAP", "Slack"],
      },
      {
        icon: FileSpreadsheet,
        title: "Desktop QA",
        description:
          "Test complete application workflows with mouse and keyboard input to catch UI and process failures before release.",
        tags: ["Windows", "Salesforce", "ServiceNow"],
      },
      {
        icon: Repeat,
        title: "Long-Running Automation",
        description:
          "Pause idle workflows and resume the same applications and state later instead of restarting long-running work.",
        tags: ["SAP", "Salesforce", "Oracle"],
      },
      {
        icon: Monitor,
        title: "Bring Your Own Environment",
        description:
          "Launch desktops with your applications, files, configuration, and tooling already installed for your agents.",
        tags: ["Windows", "Ubuntu", "Linux"],
      },
    ],
  },
];

const COLLAPSED_COUNT = 6;

export function UseCases() {
  const [active, setActive] = useState(GROUPS[0].id);
  const [expanded, setExpanded] = useState(false);
  const group = GROUPS.find((g) => g.id === active) ?? GROUPS[0];
  const items = expanded ? group.items : group.items.slice(0, COLLAPSED_COUNT);

  return (
    <section id="use-cases" className="bg-sol-bg py-20 md:py-[120px]">
      <Container>
        <Reveal variant="heading">
          <Eyebrow>Use Cases</Eyebrow>
          <SectionHeading className="mt-5" lead="What teams run on Solari" />
        </Reveal>

        <div
          role="tablist"
          aria-label="Use case categories"
          className="mt-10 grid grid-cols-1 border border-white/10 sm:grid-cols-3"
        >
          {GROUPS.map((g, i) => {
            const on = g.id === active;
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setActive(g.id);
                  setExpanded(false);
                }}
                className={`relative flex items-center gap-3 px-6 py-5 text-left font-mono text-[12px] tracking-[0.12em] uppercase transition-colors ${
                  i > 0 ? "border-t border-white/10 sm:border-t-0 sm:border-l" : ""
                } ${on ? "text-sol-accent" : "text-white hover:text-sol-accent/80"}`}
              >
                <Icon className="size-[18px]" strokeWidth={1.5} />
                {g.label}
                {on ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-6 bottom-[-1px] h-[2px] bg-sol-accent"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal
                key={item.title}
                as="article"
                variant="media"
                delay={(i % 3) * 70}
                className="flex flex-col gap-4 rounded-[4px] border border-white/10 bg-[#0a0b0e] p-6"
              >
                <Icon className="size-[18px] text-sol-muted" strokeWidth={1.5} />
                <h3 className="text-[15px] font-semibold text-sol-accent">{item.title}</h3>
                <p className="text-[13px] leading-[1.5] text-sol-muted">{item.description}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[2px] border border-white/10 px-2 py-1 font-mono text-[11px] text-sol-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Reveal>
            );
          })}
        </div>

        {expanded ? null : (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex h-10 items-center justify-center rounded-[2px] border border-white/15 px-5 font-mono text-[12px] tracking-[0.09em] text-white uppercase transition-colors hover:border-white/35 hover:bg-white/5"
            >
              Show All {group.items.length} Use Cases
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
