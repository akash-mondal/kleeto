import type { Metadata } from "next";
import { Monitor, Zap } from "lucide-react";

import { SolariFooter, SolariNav } from "@/components/site/solari-chrome";
import {
  AuthLoop,
  ClosingCta,
  CodeTabs,
  ColumnChart,
  FaqSection,
  FeatureCard,
  FeatureCarousel,
  GpuLoop,
  HumanizerMock,
  ProductHero,
  ReplayLoop,
  Reveal,
  Section,
  SectionIntro,
  SectionNote,
  StatRow,
  StealthLoop,
  TelemetryLoop,
  TileMock,
  WindowMock,
} from "@/components/solari-product";
import type {
  CarouselCard,
  ChartBar,
  CodeSample,
  RevealStep,
  StatItem,
} from "@/components/solari-product";

export const metadata: Metadata = {
  title: "Cloud Browsers Built for Agents — Solari",
  description:
    "A production-ready browser for agents, built for persistent sessions, stealth, and high-speed automation at any scale.",
};

const SAMPLES: readonly CodeSample[] = [
  {
    language: "TypeScript",
    install: "npm install @solarisdk/browser",
    code: `import { Solari } from "@solarisdk/browser"

const solari = new Solari({
    apiKey: process.env.SOLARI_API_KEY!,
})

const browser = await solari.launch({
    stealth: true,
    proxy: "us",
})

const page = await browser.newPage()

await page.goto("https://example.com")

console.log(await page.title())

await browser.close()
await solari.close()`,
  },
  {
    language: "Python",
    install: "pip install solari-browser",
    code: `from solari import Solari

solari = Solari(api_key=os.environ["SOLARI_API_KEY"])

browser = solari.launch(
    stealth=True,
    proxy="us",
)

page = browser.new_page()

page.goto("https://example.com")

print(page.title())

browser.close()
solari.close()`,
  },
  {
    language: "Go",
    install: "go get github.com/solarisdk/browser-go",
    code: `client := solari.New(os.Getenv("SOLARI_API_KEY"))

browser, err := client.Launch(ctx, solari.LaunchOptions{
    Stealth: true,
    Proxy:   "us",
})

page, err := browser.NewPage(ctx)

page.Goto(ctx, "https://example.com")

fmt.Println(page.Title(ctx))

browser.Close(ctx)
client.Close(ctx)`,
  },
  {
    language: "Rust",
    install: "cargo add solari-browser",
    code: `let solari = Solari::new(env::var("SOLARI_API_KEY")?);

let browser = solari.launch(LaunchOptions {
    stealth: true,
    proxy: "us".into(),
}).await?;

let page = browser.new_page().await?;

page.goto("https://example.com").await?;

println!("{}", page.title().await?);

browser.close().await?;`,
  },
  {
    language: "C++",
    install: "vcpkg install solari-browser",
    code: `solari::Client client(std::getenv("SOLARI_API_KEY"));

auto browser = client.launch({
    .stealth = true,
    .proxy = "us",
});

auto page = browser.new_page();

page.goto("https://example.com");

std::cout << page.title() << std::endl;

browser.close();`,
  },
];

const LATENCY_AXIS = ["10,000ms", "8,000ms", "6,000ms", "4,000ms", "2,000ms", "0ms"] as const;

const LATENCY_BARS: readonly ChartBar[] = [
  { label: "Solari", value: 199, display: "199ms" },
  { label: "Kernel", value: 793.84, display: "793.84ms" },
  { label: "Steel", value: 894.13, display: "894.13ms" },
  { label: "Browserbase", value: 2966.87, display: "2,966.87ms" },
  { label: "Hyperbrowser", value: 3657.11, display: "3,657.11ms" },
  { label: "Anchorbrowser", value: 8001.29, display: "8,001.29ms" },
];

const STATS: readonly StatItem[] = [
  { value: "8ms", label: "Session spin-up", detail: "Fastest cold-start time across tested providers." },
  { value: "10×", label: "Faster to ready", detail: "32 ms versus 317 ms for the next-fastest provider." },
  { value: "4x", label: "Faster end-to-end", detail: "4x faster than the next fastest provider." },
  { value: "100%", label: "Benchmark success rate", detail: "Zero failures across 5,000 measured runs." },
];

const HUMANIZER: readonly { term: string; body: string }[] = [
  { term: "Curved trajectories", body: "Bézier paths with natural drift, never point-to-point jumps." },
  {
    term: "Variable velocity",
    body: "Speeds up through the middle and slows into the target, the way Fitts’s law predicts a real hand.",
  },
  { term: "Overshoot and settle", body: "Lands slightly past the target, then corrects, like a real pointer." },
  {
    term: "Real event streams",
    body: "Genuine coalesced pointer events, human typing cadence, and natural scroll, not teleported inputs.",
  },
];

const ANTI_BOT: readonly { vendor: string; product: string; body: string }[] = [
  {
    vendor: "Cloudflare",
    product: "Bot Management & Turnstile",
    body: "Scores every request with machine learning trained on Cloudflare’s global network, plus TLS and HTTP fingerprinting and behavioral heuristics. Turnstile replaces the CAPTCHA with an invisible browser challenge.",
  },
  {
    vendor: "DataDome",
    product: "Bot & Online Fraud Protection",
    body: "Runs every request through an AI engine in real time, weighing thousands of client-side and server-side signals to determine whether traffic is automated or human.",
  },
  {
    vendor: "HUMAN",
    product: "Bot Defender (PerimeterX)",
    body: "Uses behavior-based detection to model how real people move, click, and type, backed by interactive challenges that distinguish humans from automation.",
  },
  {
    vendor: "Akamai",
    product: "Bot Manager",
    body: "Grades traffic at the edge using browser fingerprinting, behavioral anomaly detection, and JavaScript telemetry collected while the page runs.",
  },
  {
    vendor: "Google",
    product: "reCAPTCHA",
    body: "Assigns a risk score from on-page behavior. v3 scores silently with no prompt, while v2 can fall back to checkbox and image challenges.",
  },
];

/**
 * The feature coverflow. Six of the eight cards carry their own looping mock —
 * the animations pixel-diffed off the live site (INTERACTION_PATTERNS.md §3).
 */
const FEATURE_CARDS: readonly CarouselCard[] = [
  {
    eyebrow: "Launch",
    title: "Fast cloud browsers",
    description:
      "Launch isolated browser sessions in milliseconds and scale hundreds of parallel workloads without managing infrastructure.",
    visual: <WindowMock url="session.getsolari.com / active" badge="Ready · 8ms" />,
  },
  {
    eyebrow: "Performance",
    title: "GPU acceleration",
    description:
      "Run demanding, canvas-heavy, and media-rich websites on hardware-accelerated browsers built for high-performance agent workloads.",
    visual: (
      <GpuLoop
        label="Render node"
        fps={120}
        metrics={[
          { label: "Frame", value: "8.3ms", fill: 62 },
          { label: "GPU", value: "74%", fill: 74 },
          { label: "Mem", value: "3.8GB", fill: 46 },
        ]}
      />
    ),
  },
  {
    eyebrow: "Observability",
    title: "Browser telemetry",
    description:
      "Stream console logs, DOM changes, network activity, and browser events so agents can inspect failures and recover faster.",
    visual: (
      <TelemetryLoop
        label="agent.run / checkout"
        badge="Live telemetry"
        rows={[
          { tag: "DOM", text: "button[data-submit] changed", meta: "18:42:06.014" },
          { tag: "NET", text: "POST /checkout 200", meta: "18:42:06.181" },
          { tag: "LOG", text: "navigation completed", meta: "18:42:06.244" },
          { tag: "EVT", text: "click · x:824 y:412", meta: "18:42:06.392" },
        ]}
      />
    ),
  },
  {
    eyebrow: "Identity",
    title: "Managed authentication",
    description:
      "Keep agents signed in with secure credential handling, session persistence, and re-authentication flows managed behind the scenes.",
    visual: (
      <AuthLoop
        label="Identity active"
        tiles={["Session 01", "Session 02", "Session 03", "Session 04"]}
        footer="Token refreshed · session preserved"
      />
    ),
  },
  {
    eyebrow: "Access",
    title: "Stealth mode",
    description:
      "Reduce interruptions with built-in CAPTCHA solving and residential proxy support for harder-to-access websites and workflows.",
    visual: <StealthLoop label="Browser" />,
  },
  {
    eyebrow: "Replay",
    title: "Live session replay",
    description:
      "Watch sessions live, take control when needed, or replay recorded runs to understand exactly what an agent saw, clicked, and did.",
    visual: (
      <ReplayLoop
        label="Session replay"
        keyframes={[
          { at: 0, tag: "Load", text: "checkout / cart", meta: "00:00.000" },
          { at: 34, tag: "Click", text: "checkout / confirmation", meta: "00:12.842" },
          { at: 67, tag: "Select", text: "checkout / payment", meta: "00:24.190" },
          { at: 100, tag: "Done", text: "checkout / receipt", meta: "00:31.507" },
        ]}
      />
    ),
  },
  {
    eyebrow: "Integrations",
    title: "Works with your stack",
    description:
      "Connect through Playwright, Puppeteer, Selenium, or raw CDP without rewriting your agent.",
    visual: (
      <TileMock
        label="SDK connections"
        badge="Connected"
        tiles={["Playwright", "Puppeteer", "Selenium", "Raw CDP"]}
        footer="Browser API · one interface"
      />
    ),
  },
  {
    eyebrow: "Files",
    title: "Session files",
    description: "Upload inputs and retrieve downloads directly from browser sessions.",
    visual: (
      <TileMock
        label="Browser session"
        badge="3 files mounted"
        tiles={["brief.pdf", "prompt.json", "assets.zip", "report.csv"]}
        footer="Session storage · synced"
      />
    ),
  },
];

export default function BrowsersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sol-bg text-white">
      <SolariNav />
      <main className="flex-1">
        <ProductHero
          badge="Browsers"
          titleLead="Cloud Browsers"
          titleAccent="Built for Agents"
          description="A production-ready browser for agents, built for persistent sessions, stealth, and high-speed automation at any scale."
          media={
            <CodeTabs
              samples={SAMPLES}
              clip
              caption="Full browser SDK with control plane access and launch() returning a connected Playwright browser."
            />
          }
        />

        <Section>
          <Reveal variant="heading">
            <SectionIntro eyebrow="Benchmarks" lead="Complete more tasks," accent="in less time" />
          </Reveal>
          <Reveal variant="media" step={1} className="mt-8">
            <ColumnChart
              title="End-to-End Latency"
              bars={LATENCY_BARS}
              axis={LATENCY_AXIS}
              max={10000}
            />
          </Reveal>
          <SectionNote className="mt-8">
            Solari is faster, cheaper, and more secure than any provider on the market, enabling you to run
            more agents and complete more tasks at scale.
          </SectionNote>
          <StatRow items={STATS} className="mt-10" />
        </Section>

        <Section>
          <Reveal variant="heading">
            <SectionIntro eyebrow="Humanizer" lead="Moves like a human." accent="Not a bot" />
          </Reveal>
          <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-x-12">
            <Reveal variant="media">
              <HumanizerMock url="humanizer / pointer" />
            </Reveal>
            <ul className="flex flex-col gap-4">
              {HUMANIZER.map((item, index) => (
                <li key={item.term} className="text-[14px] leading-[1.55] text-[#e7e7e2]">
                  <Reveal variant="text" step={(index + 1) as RevealStep}>
                    <span className="font-semibold text-sol-accent">{item.term}</span>. {item.body}
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
          <SectionNote className="mt-8">
            Solari humanizes cursor movement with curved paths, variable speeds, natural acceleration, and
            subtle overshoot. This helps bypass bot detectors and lets agents navigate websites more like a
            real person.
          </SectionNote>
        </Section>

        <Section>
          <Reveal variant="heading">
            <SectionIntro eyebrow="Features" lead="Browsers," accent="built for agents" />
          </Reveal>
          <FeatureCarousel className="mt-8" items={FEATURE_CARDS} label="Browser features" />
        </Section>

        <Section>
          <SectionIntro eyebrow="Two ways to run" lead="Run faster." accent="Debug smarter" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon={Zap}
              eyebrow="Headless"
              title="Run faster"
              description="Execute browser tasks without rendering a visible interface. Lower overhead and faster throughput for automated workloads."
              visualPosition="top"
              visual={<WindowMock url="headless / worker" badge="No display" />}
            />
            <FeatureCard
              icon={Monitor}
              eyebrow="Headful"
              title="See and take control"
              description="Stream the browser live, watch each action, and step in whenever human input is needed."
              visualPosition="top"
              visual={<WindowMock url="headful / live stream" badge="Streaming" />}
            />
          </div>
        </Section>

        <Section>
          <SectionIntro eyebrow="Anti-bot" lead="Bypass the web’s toughest bot detection" />
          <div className="mt-8 divide-y divide-white/10 rounded-[4px] border border-white/10 bg-sol-panel">
            {ANTI_BOT.map((row) => (
              <div key={row.vendor} className="grid gap-3 px-5 py-5 md:grid-cols-[200px_1fr] md:gap-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] text-white">{row.vendor}</span>
                  <span className="font-mono text-[9px] tracking-[0.16em] text-sol-muted uppercase">
                    {row.product}
                  </span>
                </div>
                <p className="text-[13px] leading-[1.6] text-sol-muted">
                  <span className="font-semibold text-white">Cleared.</span> {row.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <FaqSection />
        <ClosingCta />
      </main>
      <SolariFooter />
    </div>
  );
}
