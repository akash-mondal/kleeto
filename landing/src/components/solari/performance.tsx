import { Container, Eyebrow, OutlineButton, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

type Row = { label: string; value: number; display: string };

type Chart = {
  caption: string;
  rows: readonly Row[];
};

const BROWSER_CHART: Chart = {
  caption: "End-to-End Browser Latency",
  rows: [
    { label: "Solari", value: 199, display: "199ms" },
    { label: "Kernel", value: 778, display: "778ms" },
    { label: "Steel", value: 867, display: "867ms" },
    { label: "Browserbase", value: 2888, display: "2,888ms" },
  ],
};

const SANDBOX_CHART: Chart = {
  caption: "Full Sandbox Lifecycle",
  rows: [
    { label: "Solari", value: 8.2, display: "8.2s" },
    { label: "E2B", value: 10.8, display: "10.8s" },
    { label: "Modal", value: 11.9, display: "11.9s" },
    { label: "Daytona", value: 13.6, display: "13.6s" },
    { label: "CodeSandbox", value: 24.8, display: "24.8s" },
  ],
};

function BenchmarkChart({ chart }: { chart: Chart }) {
  const max = Math.max(...chart.rows.map((r) => r.value));
  return (
    <div className="border border-white/10 bg-black p-5 md:p-10">
      <p className="font-mono text-[12px] tracking-[0.12em] text-sol-accent uppercase">
        {chart.caption}
      </p>
      <div className="mt-6 flex flex-col gap-[26px]">
        {chart.rows.map((row, i) => {
          const winner = i === 0;
          return (
            <Reveal
              key={row.label}
              variant="body"
              delay={i * 60}
              className="flex items-center gap-3 md:gap-5"
            >
              <span className="w-[86px] shrink-0 text-right text-[13px] text-white md:w-[150px] md:text-[16px]">
                {row.label}
              </span>
              <span className="h-6 flex-1 rounded-[4px] bg-sol-card md:h-7">
                <span
                  className={`block h-full rounded-[4px] ${winner ? "bg-sol-accent" : "bg-[#707070]"}`}
                  style={{ width: `${(row.value / max) * 100}%` }}
                />
              </span>
              <span
                className={`w-[58px] shrink-0 text-right font-mono text-[12px] md:w-[78px] md:text-[13px] ${
                  winner ? "text-sol-accent" : "text-[#d7d8da]"
                }`}
              >
                {row.display}
              </span>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

export function Performance() {
  return (
    <section className="bg-sol-bg py-20 md:py-[120px]">
      <Container>
        <Reveal variant="heading">
          <Eyebrow>Performance</Eyebrow>
          <SectionHeading className="mt-5" lead="The fastest browser," highlight="by 4x" />
        </Reveal>
        <Reveal variant="media" className="mt-9">
          <BenchmarkChart chart={BROWSER_CHART} />
        </Reveal>
        <Reveal variant="body">
          <p className="mt-9 max-w-[1080px] text-[16px] leading-[1.55] text-white md:text-[17px]">
            Against every other browser provider on Steel&rsquo;s own open-source benchmark. Create,
            connect, navigate, and release, measured end to end.
          </p>
        </Reveal>
        <Reveal variant="body" delay={70} className="mt-8">
          <OutlineButton href="/browsers" className="h-10 px-5">
            Explore Browsers
          </OutlineButton>
        </Reveal>

        <Reveal variant="heading">
          <SectionHeading className="mt-24" lead="The fastest sandbox," highlight="end to end" />
        </Reveal>
        <Reveal variant="media" className="mt-9">
          <BenchmarkChart chart={SANDBOX_CHART} />
        </Reveal>
        <Reveal variant="body">
          <p className="mt-9 max-w-[1080px] text-[16px] leading-[1.55] text-white md:text-[17px]">
            On the open-source nibzard benchmark, same heavy workload on every provider: create the
            machine, run the code, tear it down. Solari finishes the round trip first.
          </p>
        </Reveal>
        <Reveal variant="body" delay={70} className="mt-8">
          <OutlineButton href="/sandboxes" className="h-10 px-5">
            Explore Sandboxes
          </OutlineButton>
        </Reveal>
      </Container>
    </section>
  );
}
