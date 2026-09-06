import type { ReactNode } from "react";
import {
  BarChartIcon,
  ClipboardIcon,
  FingerprintIcon,
  GlobeIcon,
  SlidersIcon,
} from "./runloop-icons";
import { BoxedWord, DarkCard, PillEyebrow } from "./runloop-primitives";

interface Bullet {
  lead: string;
  rest: string;
}

const PUBLIC_BULLETS: readonly Bullet[] = [
  {
    lead: "Run AI agents against SWE-Bench, R2E-Gym, SWE-Smith,",
    rest: " and other standard benchmarks to evaluate performance. Hosted infrastructure, one-click execution",
  },
  {
    lead: "Compare results against published baselines.",
    rest: " See how your agent stacks up on tasks the research community uses to measure progress",
  },
  {
    lead: "No setup required.",
    rest: " Submit your agent and get scored results on the same test sets everyone else is using",
  },
];

const CUSTOM_BULLETS: readonly Bullet[] = [
  {
    lead: "Test on scenarios your AI agent will actually face",
    rest: ". Build evaluation sets from production data or create synthetic scenarios for edge cases you need to handle",
  },
  {
    lead: "Convert Devbox states into test scenarios.",
    rest: " Use real PRs as training data",
  },
  {
    lead: "Use your own data to evaluate performance",
    rest: " or make a training set for fine tuning",
  },
];

const TESTING_CARDS = [
  {
    title: "Testing",
    Icon: BarChartIcon,
    body: "Evaluate your AI agents to measure performance according to your dimensions of success. Define and set your own standards for reliability, problem-solving skills and accuracy",
  },
  {
    title: "Regression Testing",
    Icon: ClipboardIcon,
    body: "Catch silent regressions instantly by evaluating your Agents against benchmarks that are a part of your continuous integration pipeline",
  },
  {
    title: "Fine Tuning",
    Icon: SlidersIcon,
    body: "Run Reinforcement Fine Tuning (RFT) and Supervised Fine Tuning (SFT) experiments at scale to unlock new levels of agentic performance",
  },
] as const;

function BulletList({ bullets }: { bullets: readonly Bullet[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {bullets.map((bullet) => (
        <li
          key={bullet.lead}
          className="relative pl-4 text-[13px] leading-[1.6] text-run-subtle before:absolute before:top-[8px] before:left-0 before:size-[3px] before:rounded-full before:bg-run-subtle"
        >
          <strong className="font-medium text-white">{bullet.lead}</strong>
          {bullet.rest}
        </li>
      ))}
    </ul>
  );
}

/** Wrapper that paints the green rim-glow on the premium card. */
function GlowFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-[26px] bg-[#2fe0a0] p-[2px] shadow-[0_0_0_1px_rgba(47,224,160,0.25),0_0_28px_rgba(47,224,160,0.55),0_0_70px_rgba(47,224,160,0.28)]">
      <div className="relative h-full overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,var(--rl-glow-top),var(--rl-glow-bottom))] [--rl-glow-bottom:#08120f] [--rl-glow-top:#0f2a22]">
        {children}
      </div>
    </div>
  );
}

export function RunloopBenchmarks() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col items-center text-center">
          <PillEyebrow className="mb-6">Refine</PillEyebrow>
          <h2 className="w-full text-[30px] leading-[1.12] font-medium tracking-[-0.02em] text-run-fg md:text-[44px]">
            Benchmarking <BoxedWord>At Scale</BoxedWord>
          </h2>
          <p className="mt-5 w-full max-w-[62ch] text-[14px] leading-[1.6] text-run-muted md:max-w-[740px] md:text-[15px]">
            Test your agents against existing academic Benchmarks like SWE bench
            in minutes. Leverage the best of existing scenarios or customize to
            a proprietary use case
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:mt-16 lg:grid-cols-2">
          <DarkCard className="flex flex-col p-6 md:p-8">
            <div className="flex justify-center py-6 md:py-10">
              <GlobeIcon className="size-[76px] text-[#4ec49b]" />
            </div>
            <div className="mt-auto">
              <h3 className="text-[15px] leading-tight font-medium text-white">
                Public Benchmarks
              </h3>
              <BulletList bullets={PUBLIC_BULLETS} />
              <a
                href="#"
                className="mt-8 inline-flex items-center justify-center rounded-[390px] bg-white px-6 py-3 text-[13px] leading-none font-medium text-run-fg transition-opacity hover:opacity-90"
              >
                Explore Public Benchmarks
              </a>
            </div>
          </DarkCard>

          <GlowFrame>
            <div className="flex h-full flex-col p-6 md:p-8">
              <div className="flex justify-center py-6 md:py-10">
                <FingerprintIcon className="size-[76px] text-[#4ec49b]" />
              </div>
              <div className="mt-auto">
                <h3 className="text-[15px] leading-tight font-medium text-white">
                  Custom Benchmarks
                </h3>
                <BulletList bullets={CUSTOM_BULLETS} />
              </div>
            </div>
          </GlowFrame>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TESTING_CARDS.map(({ title, Icon, body }) => (
            <DarkCard key={title} className="flex flex-col p-6">
              <Icon className="size-10 text-[#4ec49b]" />
              <h3 className="mt-10 text-[15px] leading-tight font-medium text-white">
                {title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-run-subtle">
                {body}
              </p>
            </DarkCard>
          ))}
        </div>
      </div>
    </section>
  );
}
