import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Boxes, Building2, Workflow } from "lucide-react";

import { SolariFooter, SolariNav } from "@/components/site/solari-chrome";
import {
  ClosingCta,
  CodeTabs,
  FaqSection,
  FeatureCard,
  MockBar,
  MockChrome,
  ProductHero,
  Section,
  SectionIntro,
  SectionNote,
} from "@/components/solari-product";
import type { CodeSample } from "@/components/solari-product";
import { AuroraCard } from "@/components/solari-product/aurora";
import { Reveal } from "@/components/solari-product/reveal";
import type { RevealStep } from "@/components/solari-product/reveal";

export const metadata: Metadata = {
  title: "A Full Desktop to Drive — Solari Desktops",
  description:
    "Control desktop apps with real mouse and keyboard input. Pause, resume, and pick up where you left off.",
};

const SAMPLES: readonly CodeSample[] = [
  {
    language: "TypeScript",
    install: "npm install @solarisdk/desktop",
    code: `const d = await pt.desktops.create({
    template: "office",
    record: true,
})

await d.connect()
await d.health()

// Computer use: mouse, keyboard, hotkeys
await d.mouse.doubleClick(100, 100)
await d.keyboard.type("hello world")

await d.open("libreoffice", ["--writer"])

// Stream the desktop or capture a frame
console.log("stream:", d.streamUrl)

const png = await d.screenshot()`,
  },
  {
    language: "Python",
    install: "pip install solari-desktop",
    code: `d = pt.desktops.create(
    template="office",
    record=True,
)

d.connect()
d.health()

# Computer use: mouse, keyboard, hotkeys
d.mouse.double_click(100, 100)
d.keyboard.type("hello world")

d.open("libreoffice", ["--writer"])

# Stream the desktop or capture a frame
print("stream:", d.stream_url)

png = d.screenshot()`,
  },
];

const SHEET_ROWS: readonly (readonly string[])[] = [
  ["2", "Axiom", "M. Chen", "$82k", "Active"],
  ["3", "Nexus", "R. Patel", "$64k", "Review"],
  ["4", "Ironclad", "J. Kim", "$91k", "Active"],
  ["5", "Meridian", "S. Lee", "$73k", "New"],
];

/** The hero illustration: a spreadsheet and a CRM record open on one machine. */
function DesktopMock() {
  return (
    <div className="overflow-hidden rounded-[4px] border border-white/10 bg-[#0d1118]">
      <div className="flex items-center gap-4 border-b border-white/10 px-3 py-2 font-mono text-[9px] tracking-[0.12em] text-sol-muted uppercase">
        <span className="text-white">Finder</span>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
      </div>
      <div className="relative p-4 pb-10">
        <div className="w-[78%] overflow-hidden rounded-[3px] border border-white/10 bg-black">
          <MockChrome label="Accounts.xlsx" />
          <table className="w-full border-collapse text-left font-mono text-[9px] text-[#bbc7c6]">
            <thead>
              <tr className="border-b border-white/10 text-sol-muted">
                {["", "A", "B", "C", "D"].map((c) => (
                  <th key={c} className="px-2 py-1.5 font-normal">
                    {c}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                {["1", "Company", "Owner", "ARR", "Status"].map((c) => (
                  <th key={c} className="px-2 py-1.5 text-left font-normal text-white">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHEET_ROWS.map((row) => (
                <tr key={row[1]} className="border-b border-white/[0.06] last:border-b-0">
                  {row.map((cell, index) => (
                    <td key={`${row[1]}-${index}`} className="px-2 py-1.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="absolute right-4 bottom-4 w-[58%] overflow-hidden rounded-[3px] border border-white/10 bg-[#0b0f16] shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
          <MockChrome label="Salesforce · Account" />
          <div className="flex items-center gap-3 border-b border-white/10 px-3 py-1.5 font-mono text-[8px] tracking-[0.14em] text-sol-muted uppercase">
            <span className="text-white">Sales</span>
            <span>Accounts</span>
            <span>Opportunities</span>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white">Axiom</span>
              <span className="rounded-[2px] border border-sol-accent px-1.5 py-0.5 font-mono text-[8px] tracking-[0.14em] text-sol-accent uppercase">
                Edit
              </span>
            </div>
            {[
              ["Company", "Axiom"],
              ["Owner", "M. Chen"],
              ["ARR", "$82,000"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between font-mono text-[9px]">
                <span className="text-sol-muted">{label}</span>
                <span className="text-[#bbc7c6]">{value}</span>
              </div>
            ))}
            <div className="mt-1 flex gap-1">
              {["Qualified", "Proposal", "Negotiation", "Closed"].map((stage, index) => (
                <span
                  key={stage}
                  className={`flex-1 rounded-[2px] px-1 py-1 text-center font-mono text-[7px] tracking-[0.1em] uppercase ${
                    index === 0 ? "bg-sol-accent text-black" : "bg-white/[0.06] text-sol-muted"
                  }`}
                >
                  {stage}
                </span>
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[8px] text-sol-muted">
              <span>Activity · Follow up call</span>
              <span>Aug 15</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[8px] text-sol-muted">
              <span>Related · Files</span>
              <span>1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowMock({ shape }: { shape: "record" | "fanout" | "clone" }) {
  if (shape === "record") {
    return (
      <div className="flex h-[150px] gap-2 rounded-[3px] border border-white/10 bg-black/70 p-3">
        <div className="flex w-6 flex-col gap-2 pt-1">
          <MockBar className="h-[6px] w-[6px]" />
          <MockBar className="h-[6px] w-[6px]" />
          <MockBar className="h-[6px] w-[6px]" />
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-[2px] border border-white/10 p-2">
          <MockBar className="w-2/3" />
          <MockBar className="w-1/2" />
          <div className="mt-1 flex-1 rounded-[2px] border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    );
  }
  if (shape === "fanout") {
    return (
      <div className="flex h-[150px] items-center gap-3">
        <div className="h-[26px] flex-1 rounded-[2px] border border-white/15" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-[26px] rounded-[2px] border border-white/15" />
          <div className="h-[26px] rounded-[2px] border border-white/15" />
          <div className="h-[26px] rounded-[2px] border border-white/15" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-[150px] items-center gap-3">
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-[26px] rounded-[2px] border border-white/15" />
        <div className="h-[26px] rounded-[2px] border border-white/15" />
        <div className="h-[26px] rounded-[2px] border border-white/15" />
      </div>
      <div className="size-[26px] shrink-0 rounded-[2px] border border-white/15" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-[26px] rounded-[2px] border border-white/15" />
        <div className="h-[26px] rounded-[2px] border border-white/15" />
        <div className="h-[26px] rounded-[2px] border border-white/15" />
      </div>
    </div>
  );
}

const USE_CASES: readonly {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  shape: "record" | "fanout" | "clone";
}[] = [
  {
    icon: Building2,
    eyebrow: "ERP & CRM Automation",
    title: "Update Salesforce, SAP, and Oracle",
    description:
      "Read records, enter data, update fields, and move information between enterprise systems without relying on APIs.",
    shape: "record",
  },
  {
    icon: Workflow,
    eyebrow: "Cross-App Workflows",
    title: "Move work across desktop apps",
    description:
      "Pull data from one application, transform it, and enter it into Excel, internal tools, or another desktop application.",
    shape: "fanout",
  },
  {
    icon: Boxes,
    eyebrow: "Custom Environments",
    title: "Bring your own environment",
    description:
      "Launch desktops with your applications, files, dependencies, and configuration already installed.machine.",
    shape: "clone",
  },
];

const LIFECYCLE: readonly { label: string; body: ReactNode }[] = [
  {
    label: "Idle → Pause",
    body: (
      <>
        When a session goes idle, it <strong className="font-semibold text-white">pauses instead of shutting down</strong>{" "}
        and stops billing. An open connection keeps it awake.
      </>
    ),
  },
  {
    label: "Resume",
    body: (
      <>
        Continue exactly where you left off.{" "}
        <strong className="font-semibold text-white">Files, processes, and machine size</strong> remain intact,
        and the session resumes in under a second.
      </>
    ),
  },
  {
    label: "Recover",
    body: (
      <>
        Sessions <strong className="font-semibold text-white">survive hardware failure</strong>. A paused
        machine can restart on another host without losing state.
      </>
    ),
  },
  {
    label: "Fork",
    body: (
      <>
        Capture any machine and relaunch it, or fork it into many.{" "}
        <strong className="font-semibold text-white">Set up an environment once</strong> and clone it
        efficiently for every run.
      </>
    ),
  },
];

export default function DesktopsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sol-bg text-white">
      <SolariNav />
      <main className="flex-1">
        <ProductHero
          badge="Computers"
          titleLead="A Full Desktop"
          titleAccent="to Drive"
          stacked={false}
          description="Control desktop apps with real mouse and keyboard input. Pause, resume, and pick up where you left off."
          media={<DesktopMock />}
        />

        <Section>
          <Reveal variant="heading">
            <SectionIntro eyebrow="Computer use" lead="Control Any Desktop." accent="Run Any Workflow." />
          </Reveal>
          <Reveal variant="media" step={1}>
            <CodeTabs
              className="mt-8"
              samples={SAMPLES}
              caption="Create and control desktop environments with mouse, keyboard, application launch, streaming, screenshots, and session recording."
            />
          </Reveal>
          <Reveal variant="text" step={2}>
            <SectionNote className="mt-8">
              Give agents full mouse and keyboard control over desktop applications. Open software, enter data,
              move between apps, and complete workflows end to end.
            </SectionNote>
          </Reveal>
        </Section>

        <Section>
          <Reveal variant="heading">
            <SectionIntro eyebrow="Use cases" lead="Built for the" accent="work agents actually do" />
          </Reveal>
          {/* Aurora sweep: 12.03 % of the viewport changes here on the live page. */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {USE_CASES.map((useCase, index) => (
              <Reveal
                key={useCase.title}
                variant="media"
                step={(index + 1) as RevealStep}
                className="h-full"
              >
                <AuroraCard>
                  <FeatureCard
                    className="h-full border-0 bg-transparent"
                    icon={useCase.icon}
                    eyebrow={useCase.eyebrow}
                    title={useCase.title}
                    description={useCase.description}
                    visualPosition="top"
                    visual={<FlowMock shape={useCase.shape} />}
                  />
                </AuroraCard>
              </Reveal>
            ))}
          </div>
          <Reveal variant="text" step={4}>
            <SectionNote className="mt-8">
              Automate workflows across ERP systems, CRM platforms, office software, internal tools, and custom
              desktop environments.
            </SectionNote>
          </Reveal>
        </Section>

        <Section>
          <Reveal variant="heading">
            <SectionIntro eyebrow="Long-horizon lifecycle" lead="Pause and resume at anytime" />
          </Reveal>
          {/* Verified against reference/motion/desktops/02-*: zero pixels change
              across all six captured frames, so this row is genuinely static on
              the live page. Scroll reveal is the only motion it gets. */}
          <div className="mt-8 divide-y divide-white/10 rounded-[4px] border border-white/10 bg-sol-panel">
            {LIFECYCLE.map((item, index) => (
              <Reveal
                key={item.label}
                variant="text"
                step={(index + 1) as RevealStep}
                className="grid gap-3 px-5 py-5 md:grid-cols-[180px_1fr] md:gap-8"
              >
                <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.18em] text-sol-accent uppercase">
                  <span aria-hidden className="inline-block size-[5px] bg-sol-accent" />
                  {item.label}
                </span>
                <p className="text-[13px] leading-[1.6] text-sol-muted">{item.body}</p>
              </Reveal>
            ))}
          </div>
          <Reveal variant="text" step={5}>
            <SectionNote className="mt-8">
              Enterprise workflows run for minutes or hours, with long idle gaps. You shouldn’t pay for a
              machine that’s just sitting there while the model thinks.
            </SectionNote>
          </Reveal>
        </Section>

        <FaqSection />
        <ClosingCta />
      </main>
      <SolariFooter />
    </div>
  );
}
