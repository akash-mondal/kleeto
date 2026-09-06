import {
  BrowserIcon,
  ChipIcon,
  CubeIcon,
  DockerIcon,
  MemoryIcon,
  NetworkIcon,
  ShieldIcon,
  SuspendIcon,
} from "./runloop-icons";
import { DarkCard, SectionHeading } from "./runloop-primitives";

const FEATURES = [
  {
    title: "Sandbox",
    body: "Secure, isolated, micro-VM* environment (Two layers of security, VM + Container)",
    Icon: CubeIcon,
  },
  {
    title: "Connectivity",
    body: "Work freely with MCP Servers, Tools, SSH Tunnels, Websockets & APIs",
    Icon: NetworkIcon,
  },
  {
    title: "Memory",
    body: "Place, store and work with critical context inside of isolated sandbox environments",
    Icon: MemoryIcon,
  },
  {
    title: "Browser + Computer Use",
    body: "Enable your agents to take control and manage browsers and computers",
    Icon: BrowserIcon,
  },
  {
    title: "Suspend & Resume",
    body: "Minimize costs for bursty agentic workflows. Easily start, stop & resume workflows for continuous operations",
    Icon: SuspendIcon,
  },
  {
    title: "SOC2, HIPAA & GDPR",
    body: "Enterprise-grade security and privacy standards, fully supporting SOC 2, HIPAA, and GDPR",
    Icon: ShieldIcon,
  },
  {
    title: "ARM Support",
    body: "Utilize architecture agnostic components with full support for ARM devices",
    Icon: ChipIcon,
  },
  {
    title: "Full Docker Support",
    body: "Comprehensive support for Docker Compose, Docker in Docker, and nested Docker files",
    Icon: DockerIcon,
  },
] as const;

export function RunloopFeatures() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          eyebrow="Why Runloop"
          lede="Superior developer experience optimized specifically for agents & orchestrated AI systems"
        >
          Features, Tools &amp; Ecosystem for Agentic Development
        </SectionHeading>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
          {FEATURES.map(({ title, body, Icon }) => (
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
