import { GaugeIcon, ObserveIcon, ScaleIcon } from "./runloop-icons";
import { DarkCard, SectionHeading } from "./runloop-primitives";

const CARDS = [
  {
    title: "Performance",
    Icon: GaugeIcon,
    lines: [
      "Run 10k+ parallel sandboxes",
      "10GB image startup time in <2s",
      "All with leading reliability guarantees",
    ],
  },
  {
    title: "Scalability",
    Icon: ScaleIcon,
    lines: [
      "Automatically scale up/down sandbox CPU or Memory based on your agentic needs in realtime",
    ],
  },
  {
    title: "Observability",
    Icon: ObserveIcon,
    lines: [
      "Get comprehensive monitoring, rich logging & first class support with interactive shells and robust UI",
    ],
  },
] as const;

export function RunloopScale() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          eyebrow="Ship"
          lede="Ship your product then iterate quickly & efficiently"
        >
          Managed AI Infrastructure Distributes Agents at Scale
        </SectionHeading>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
          {CARDS.map(({ title, Icon, lines }) => (
            <DarkCard key={title} className="flex flex-col p-6 md:p-7">
              <Icon className="size-10 text-[#4ec49b]" />
              <h3 className="mt-10 text-[15px] leading-tight font-medium text-white">
                {title}
              </h3>
              <div className="mt-2 space-y-0.5">
                {lines.map((line) => (
                  <p
                    key={line}
                    className="text-[13px] leading-[1.55] text-run-subtle"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </DarkCard>
          ))}
        </div>
      </div>
    </section>
  );
}
