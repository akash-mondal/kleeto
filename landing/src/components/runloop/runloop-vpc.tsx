import {
  BarChartIcon,
  CloudIcon,
  CubeIcon,
  RunloopMark,
  ToolboxIcon,
} from "./runloop-icons";
import { PillEyebrow } from "./runloop-primitives";

const BULLETS = [
  {
    lead: "SOC 2",
    rest: " - Built with compliance in mind, focusing on secure network boundaries, isolated compute, and auditable deployments",
  },
  {
    lead: "Single Tenant support -",
    rest: " Dedicated software instance and infrastructure keeping your data and compute secure",
  },
  {
    lead: "Deploy to Your Cloud",
    rest: " – Operate within your existing AWS, GCP, or Azure accounts while maintaining direct ownership of infrastructure and data",
  },
  {
    lead: "Multi-Region",
    rest: " – Deploy across regions to optimize latency and availability, and to align with local data residency needs",
  },
] as const;

const HOSTED = [
  { label: "Host Agents (Bedrock/Vertex)", Icon: ToolboxIcon },
  { label: "20k+ DevBoxes", Icon: CubeIcon },
  { label: "Benchmarking engines", Icon: BarChartIcon },
] as const;

/**
 * The "cloud" diagram: a large dark disc overlapping a rounded dark lobe.
 * Rebuilt from two CSS shapes rather than the original raster illustration.
 */
function VpcCloud() {
  return (
    <div className="relative mx-auto aspect-[7/5] w-full max-w-[520px]">
      <div className="absolute top-[30%] right-[2%] h-[42%] w-[56%] rounded-[390px] bg-run-card-deep shadow-[0_30px_60px_-30px_rgba(9,19,21,0.6)]" />
      <div className="absolute top-[4%] left-0 aspect-square w-[66%] rounded-full bg-run-card-deep shadow-[0_30px_60px_-30px_rgba(9,19,21,0.6)]" />

      <div className="absolute top-[9%] left-[4%] aspect-square w-[58%] rounded-full border border-run-accent/40" />

      <div className="absolute top-[19%] left-[9%] w-[54%]">
        <div className="flex items-center gap-1.5 text-white">
          <RunloopMark className="size-[15px]" />
          <span className="text-[13px] leading-none font-bold tracking-[0.16em]">
            RUNLOOP
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          {HOSTED.map(({ label, Icon }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-[11px] text-[#4ec49b] md:text-[12px]"
            >
              <Icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute top-[41%] right-[7%] w-[34%]">
        <div className="flex items-center gap-2 text-white">
          <CloudIcon className="size-4 text-[#4ec49b]" />
          <span className="text-[12px] leading-none">Your VPC</span>
        </div>
        <ul className="mt-2.5 space-y-1.5 pl-1">
          {["Control plane", "Data plane"].map((label) => (
            <li
              key={label}
              className="relative pl-3 text-[11px] text-[#4ec49b] before:absolute before:top-[6px] before:left-0 before:size-[3px] before:rounded-full before:bg-[#4ec49b]"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function RunloopVpc() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex justify-center">
          <PillEyebrow>Enterprise-grade AI infrastructure</PillEyebrow>
        </div>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div>
            <h2 className="text-[30px] leading-[1.12] font-medium tracking-[-0.02em] text-run-fg md:text-[44px]">
              Deploy to VPC
            </h2>
            <ul className="mt-8 space-y-4">
              {BULLETS.map((bullet) => (
                <li
                  key={bullet.lead}
                  className="relative max-w-[46ch] pl-4 text-[14px] leading-[1.6] text-run-muted before:absolute before:top-[9px] before:left-0 before:size-[3px] before:rounded-full before:bg-run-muted"
                >
                  <strong className="font-medium text-run-fg">
                    {bullet.lead}
                  </strong>
                  {bullet.rest}
                </li>
              ))}
            </ul>
          </div>
          <VpcCloud />
        </div>
      </div>
    </section>
  );
}
