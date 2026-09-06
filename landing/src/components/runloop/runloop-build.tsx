import {
  BranchIcon,
  GaugeIcon,
  RepoIcon,
  TemplateIcon,
  ToolboxIcon,
} from "./runloop-icons";
import { DarkCard, SectionHeading } from "./runloop-primitives";

const SMALL_CARDS = [
  {
    title: "Tooling for Builders",
    body: "Reuse tools, files, and keys via Agent, Object, & Secret store for seamless Agentic development",
    Icon: ToolboxIcon,
  },
  {
    title: "Repo Connections",
    body: "Automatically infer a build environment for git repositories in any language without the tedious setup",
    Icon: RepoIcon,
  },
  {
    title: "Sandbox templates",
    body: "Run and customize templates with the latest agent frameworks, pre-built and optimized for Runloop Sandboxes",
    Icon: TemplateIcon,
  },
  {
    title: "Git for Agent State",
    body: "Snapshot and branch from sandbox disk state; develop on sandboxes with SSH, CLI, and IDE connections",
    Icon: BranchIcon,
  },
] as const;

export function RunloopBuild() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          eyebrow="Build"
          lede="Runloop's Devboxes are code sandbox development environments that offer the fastest path to secure, production-ready AI Agents"
        >
          Make AI Agents Customer-Ready With Devboxes
        </SectionHeading>

        <div className="mt-12 grid gap-4 md:mt-16 lg:grid-cols-2">
          <DarkCard className="flex flex-col justify-between p-6 md:p-8">
            <div className="flex min-h-[180px] items-center justify-center py-6 md:min-h-[240px]">
              <GaugeIcon className="size-[150px] text-[#4ec49b] md:size-[190px]" />
            </div>
            <div>
              <h3 className="text-[20px] leading-tight font-medium text-white md:text-[22px]">
                Performant Sandbox Infrastructure
              </h3>
              <p className="mt-3 max-w-[46ch] text-[14px] leading-[1.6] text-run-subtle">
                Utilize our 2x faster vCPUs running on our custom bare-metal
                hypervisor
              </p>
              <p className="mt-4 max-w-[46ch] text-[14px] leading-[1.6] text-run-subtle">
                Framework agnostic and lightning-fast starts plus ultra fast
                command execution at 100ms. The only provider with arm64 and x86
                support
              </p>
            </div>
          </DarkCard>

          <div className="grid gap-4 sm:grid-cols-2">
            {SMALL_CARDS.map(({ title, body, Icon }) => (
              <DarkCard key={title} className="flex flex-col p-6">
                <Icon className="size-10 text-[#4ec49b]" />
                <h3 className="mt-8 text-[15px] leading-tight font-medium text-white">
                  {title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-run-subtle">
                  {body}
                </p>
              </DarkCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
