import type { Metadata } from "next";
import { Boxes, Cpu, FolderOpen, Gauge, LayoutGrid, Layers, Scan, Zap } from "lucide-react";

import { SolariFooter, SolariNav } from "@/components/site/solari-chrome";
import {
  ClosingCta,
  CodeTabs,
  ComparisonTable,
  FaqSection,
  FeatureCard,
  Footnote,
  ProductHero,
  Section,
  SectionIntro,
  SectionNote,
  StatRow,
  TrackChart,
} from "@/components/solari-product";
import type {
  ChartBar,
  CodeSample,
  StatItem,
  TableColumn,
  TableRow,
} from "@/components/solari-product";
import { AuroraCard } from "@/components/solari-product/aurora";
import { Reveal } from "@/components/solari-product/reveal";
import type { RevealStep } from "@/components/solari-product/reveal";
import { StatefulTerminal } from "@/components/solari-product/terminal-loop";

export const metadata: Metadata = {
  title: "Run Code in a Real Machine — Solari Sandboxes",
  description:
    "Isolated compute for code, tools, and long-running tasks. Snapshot, fork, and resume in seconds.",
};

const SAMPLES: readonly CodeSample[] = [
  {
    language: "TypeScript",
    install: "npm install @solarisdk/sandbox",
    code: `import { SandboxClient } from "@solarisdk/sandbox"

const sandboxes = new SandboxClient({
    apiKey: process.env.SOLARI_API_KEY!,
    baseUrl: "https://api.getsolari.com",
})

const sbx = await sandboxes.create({
    template: "base",
})

const res = await sbx.commands.run("echo", {
    args: ["hello", "world"],
})

console.log(res.exitCode, res.stdout)

await sbx.kill()`,
  },
  {
    language: "Python",
    install: "pip install solari-sandbox",
    code: `from solari import SandboxClient

sandboxes = SandboxClient(
    api_key=os.environ["SOLARI_API_KEY"],
    base_url="https://api.getsolari.com",
)

sbx = sandboxes.create(template="base")

res = sbx.commands.run("echo", args=["hello", "world"])

print(res.exit_code, res.stdout)

sbx.kill()`,
  },
  {
    language: "Go",
    install: "go get github.com/solarisdk/sandbox-go",
    code: `sandboxes := solari.NewSandboxClient(solari.Config{
    APIKey:  os.Getenv("SOLARI_API_KEY"),
    BaseURL: "https://api.getsolari.com",
})

sbx, err := sandboxes.Create(ctx, solari.SandboxOptions{
    Template: "base",
})

res, err := sbx.Commands.Run(ctx, "echo", "hello", "world")

fmt.Println(res.ExitCode, res.Stdout)

sbx.Kill(ctx)`,
  },
  {
    language: "Rust",
    install: "cargo add solari-sandbox",
    code: `let sandboxes = SandboxClient::new(Config {
    api_key: env::var("SOLARI_API_KEY")?,
    base_url: "https://api.getsolari.com".into(),
});

let sbx = sandboxes.create(SandboxOptions {
    template: "base".into(),
}).await?;

let res = sbx.commands().run("echo", &["hello", "world"]).await?;

println!("{} {}", res.exit_code, res.stdout);

sbx.kill().await?;`,
  },
  {
    language: "C++",
    install: "vcpkg install solari-sandbox",
    code: `solari::SandboxClient sandboxes({
    .api_key = std::getenv("SOLARI_API_KEY"),
    .base_url = "https://api.getsolari.com",
});

auto sbx = sandboxes.create({ .template_name = "base" });

auto res = sbx.commands().run("echo", { "hello", "world" });

std::cout << res.exit_code << " " << res.stdout << std::endl;

sbx.kill();`,
  },
];

const LIFECYCLE_BARS: readonly ChartBar[] = [
  { label: "Solari", value: 8.2, display: "8.2s" },
  { label: "E2B", value: 10.8, display: "10.8s" },
  { label: "Modal", value: 11.9, display: "11.9s" },
  { label: "Daytona", value: 13.6, display: "13.6s" },
  { label: "CodeSandbox", value: 24.8, display: "24.8s" },
];

const STATS: readonly StatItem[] = [
  { value: "8.2s", label: "Full FFT lifecycle", detail: "Fastest sandbox in the field" },
  { value: "1.3x", label: "Faster than the next best", detail: "8.2s vs E2B 10.8s" },
  { value: "Top 2", label: "On every phase", detail: "The only provider never slower than second" },
];

const PHASE_COLUMNS: readonly TableColumn[] = [
  { label: "Solari" },
  { label: "E2B" },
  { label: "Modal" },
  { label: "Daytona" },
  { label: "CodeSandbox" },
];

const PHASE_ROWS: readonly TableRow[] = [
  { label: "Create", cells: ["869ms", "541ms", "2,070ms", "2,202ms", "1,321ms"] },
  { label: "Run code", cells: ["7,019ms", "9,868ms", "6,607ms", "8,531ms", "17,237ms"] },
  { label: "Clean up", cells: ["269ms", "401ms", "3,235ms", "141ms", "6,234ms"] },
  { label: "Total", cells: ["8,158ms", "10,810ms", "11,912ms", "13,589ms", "24,792ms"] },
];

const ISOLATION_COLUMNS: readonly TableColumn[] = [
  { label: "Solari", sub: "microVM" },
  { label: "E2B", sub: "microVM" },
  { label: "Modal", sub: "gVisor" },
  { label: "Daytona", sub: "Sysbox" },
  { label: "Docker", sub: "Container" },
];

const ISOLATION_ROWS: readonly TableRow[] = [
  {
    label: "Isolation technology",
    cells: [
      "Cloud Hypervisor microVM",
      "Firecracker microVM",
      "gVisor sandbox",
      "Sysbox container",
      "Docker container",
    ],
  },
  {
    label: "Dedicated kernel per session",
    cells: ["Yes", "Yes", "Userspace kernel", "No — shared kernel", "No"],
  },
  {
    label: "Untrusted code boundary",
    cells: [
      "Hardware virtualization (KVM)",
      "Hardware virtualization (KVM)",
      "Syscall filtering",
      "Shared host kernel",
      "Shared Kernel",
    ],
  },
  { label: "Security", cells: ["★★★★★", "★★★★★", "★★★★☆", "★★★☆☆", "★☆☆☆☆"] },
];

export default function SandboxesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sol-bg text-white">
      <SolariNav />
      <main className="flex-1">
        <ProductHero
          badge="Sandboxes"
          titleLead="Run Code in a"
          titleAccent="Real Machine"
          description="Isolated compute for code, tools, and long-running tasks. Snapshot, fork, and resume in seconds."
          media={
            <CodeTabs
              samples={SAMPLES}
              clip
              caption="One protocol, many clients. Every SDK uses the same REST + control-WebSocket contract, so sandboxes can be created in one language and controlled from another."
            />
          }
        />

        <Section>
          <Reveal variant="heading">
            <SectionIntro eyebrow="Benchmarks" lead="See how Solari stacks up" />
          </Reveal>
          <Reveal variant="media" step={1} className="mt-8">
            <TrackChart title="Full Sandbox Lifecycle" bars={LIFECYCLE_BARS} max={24.8} />
          </Reveal>
          <Reveal variant="text" step={2}>
            <SectionNote className="mt-8">
              Measured on the open-source Nibzard benchmark, Solari delivers the fastest end-to-end sandbox
              lifecycle.
            </SectionNote>
          </Reveal>
          <Reveal variant="media" step={1}>
            <StatRow items={STATS} className="mt-10" />
          </Reveal>
          <Reveal variant="media" step={2}>
            <ComparisonTable columns={PHASE_COLUMNS} rows={PHASE_ROWS} className="mt-10" />
          </Reveal>
          <Footnote className="mt-4">
            Metric: the open-source <span className="text-sol-accent">nibzard test_fft_performance</span>{" "}
            lifecycle, same harness for every provider. Competitor figures are the benchmark’s own published
            results. Solari run on Solari infrastructure at 1 vCPU / 8 GB (the FFT allocates about 4 GB, so
            every provider runs it sized to fit); the FFT is single threaded, so this reflects single-core
            speed. Solari’s client is a region away from its gateway, so create and clean up are measured
            conservatively.
          </Footnote>
        </Section>

        <Section>
          <Reveal variant="heading">
            <SectionIntro
              eyebrow="Built for agents"
              lead="Fast. Scalable. Stateful."
              accent="Built for AI agents"
            />
          </Reveal>
          {/* Aurora sweep: the biggest animation on the site — 12.69 % of the
              viewport changes here on the live page. */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Reveal variant="media" step={1} className="h-full">
              <AuroraCard>
                <FeatureCard
                  className="h-full border-0 bg-transparent"
                  icon={Zap}
                  eyebrow="Lightning-Fast Infrastructure"
                  title="Start executing in milliseconds"
                  description="Launch a ready sandbox in under 90 ms, with no machine boot delay before the first command."
                  visualPosition="top"
                  visual={
                    <div className="flex h-[180px] items-center justify-center">
                      <span className="text-[54px] leading-none text-sol-accent">90ms</span>
                    </div>
                  }
                />
              </AuroraCard>
            </Reveal>
            <Reveal variant="media" step={2} className="h-full">
              <AuroraCard>
                <FeatureCard
                  className="h-full border-0 bg-transparent"
                  icon={LayoutGrid}
                  eyebrow="Isolated Runtime Protection"
                  title="Protect your infrastructure"
                  description="Run model-generated code inside a dedicated microVM with its own kernel and hardware-backed isolation."
                  visualPosition="top"
                  visual={
                    <div className="flex h-[180px] items-center justify-center">
                      <span className="flex size-[120px] rotate-45 items-center justify-center rounded-[4px] border border-white/15 bg-white/[0.03]">
                        <Cpu className="size-6 -rotate-45 text-sol-muted" />
                      </span>
                    </div>
                  }
                />
              </AuroraCard>
            </Reveal>
            <Reveal variant="media" step={3} className="h-full">
              <AuroraCard>
                <FeatureCard
                  className="h-full border-0 bg-transparent"
                  icon={Layers}
                  eyebrow="Massive Parallel Execution"
                  title="Scale agent workflows instantly"
                  description="Fork one prepared environment into independent workers for parallel tasks, retries, and evaluations."
                  visualPosition="top"
                  visual={
                    <div className="relative h-[180px]">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="absolute h-[104px] w-[150px] rounded-[3px] border border-white/15 bg-black/70"
                          style={{ left: `${i * 26}px`, top: `${34 - i * 12}px` }}
                        />
                      ))}
                    </div>
                  }
                />
              </AuroraCard>
            </Reveal>
          </div>
        </Section>

        <Section>
          <Reveal variant="heading">
            <SectionIntro eyebrow="Capabilities" lead="Everything your agent needs" />
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Reveal variant="media" step={1} className="h-full">
              <div className="flex h-full flex-col gap-5 rounded-[4px] border border-white/10 border-b-2 border-b-sol-accent bg-sol-panel p-5">
                <Boxes className="size-5 text-white" />
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] text-white">Stateful execution</p>
                  <p className="text-[17px] leading-[1.4] text-[#e7e7e2] md:text-[19px]">
                    Let agents run for hours, pause when idle, and resume exactly where they left off without
                    losing context or rebuilding the environment.
                  </p>
                </div>
                {/* Types the run/pause script while the chips below advance. */}
                <StatefulTerminal />
              </div>
            </Reveal>
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: Scan,
                  title: "Rich outputs",
                  description:
                    "Return structured JSON, charts, images, files, logs, and execution metadata, not just plain text.",
                },
                {
                  icon: FolderOpen,
                  title: "Persistent filesystem",
                  description:
                    "Clone repositories, process documents, generate artifacts, and move large files through a persistent filesystem.",
                },
                {
                  icon: Gauge,
                  title: "Scale on demand",
                  description:
                    "Scale from 1 to 16 vCPUs without rebuilding the environment or losing state.",
                },
                {
                  icon: Boxes,
                  title: "Bring your own image",
                  description:
                    "Start every sandbox with your exact runtime, dependencies, tools, and system configuration already installed.",
                },
              ].map((item, index) => (
                <Reveal key={item.title} variant="media" step={(index + 2) as RevealStep}>
                  <FeatureCard
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    accentEdge
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Section>
          <Reveal variant="heading">
            <div className="flex flex-col gap-3">
              <SectionIntro
                eyebrow="Workload isolation"
                lead="Keep untrusted code"
                accent="isolated from your infrastructure"
              />
            </div>
          </Reveal>
          <Reveal variant="media" step={1}>
            <ComparisonTable columns={ISOLATION_COLUMNS} rows={ISOLATION_ROWS} className="mt-8" />
          </Reveal>
          <Reveal variant="text" step={2}>
            <Footnote className="mt-4">
              Isolation model per each vendor’s published architecture. microVM (Solari, E2B) is the strongest
              tier; gVisor filters syscalls in userspace; Sysbox hardens a container but shares the host kernel;
              a standard Docker container also shares the host kernel.
            </Footnote>
          </Reveal>
          <Reveal variant="text" step={3}>
            <SectionNote className="mt-8">
              Run model-generated and untrusted code without putting the rest of your infrastructure at risk.
              Each Solari sandbox gets its own microVM and dedicated kernel, creating a clear boundary between
              workloads.
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
