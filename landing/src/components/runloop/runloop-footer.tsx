import { ExternalIcon, RunloopMark } from "./runloop-icons";

interface FooterLink {
  label: string;
  external?: boolean;
  tag?: string;
}

const COLUMNS: readonly { title: string; links: readonly FooterLink[] }[] = [
  {
    title: "Features",
    links: [
      { label: "Sandboxes" },
      { label: "Security & Compliance" },
      { label: "Reflex" },
      { label: "Agent Management" },
      { label: "Coordination" },
    ],
  },
  {
    title: "Implementation",
    links: [
      { label: "Reflex" },
      { label: "Benchmarks" },
      { label: "Deploy to VPC" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { label: "Internal Engineering" },
      { label: "Reinforcement Learning" },
      { label: "Agentic Commerce" },
      { label: "Data Analysis" },
      { label: "Model Selection" },
      { label: "AI Native Startup" },
    ],
  },
  {
    title: "Operate",
    links: [
      { label: "Reflex" },
      { label: "Product Releases" },
      { label: "Demos" },
      { label: "Platform Status", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Runloop" },
      { label: "Careers", tag: "Hiring" },
      { label: "Blog" },
      { label: "Runloop in the Media" },
      { label: "Security and Compliance" },
    ],
  },
  {
    title: "Get Started",
    links: [
      { label: "Docs", external: true },
      { label: "Python SDK", external: true },
      { label: "Typescript SDK", external: true },
      { label: "CLI Tool", external: true },
      { label: "Download LLM.txt", external: true },
    ],
  },
];

const SOCIALS = ["Linkedin", "X", "Youtube", "Github"] as const;

const LEGAL = ["Privacy Policy", "Terms Of Service", "Trust Center", "AUP"] as const;

export function RunloopFooter() {
  return (
    <footer className="px-4 pt-8 pb-8 md:px-6 md:pt-12">
      <div className="mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-run-card-deep px-6 py-14 md:rounded-[40px] md:px-12 md:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[420px]">
            <h2 className="bg-[linear-gradient(180deg,#ffffff,#8f9a97)] bg-clip-text text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-transparent md:text-[32px]">
              Get Started With Runloop
            </h2>
            <p className="mt-4 text-[14px] leading-[1.6] text-white/64">
              Start for free and receive $50 in credits to accelerate your AI
              software engineering.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-[390px] border border-white/20 px-6 py-3 text-[13px] leading-none font-medium text-white transition-colors hover:bg-white/10"
            >
              Get Started with Google
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-[390px] bg-white px-6 py-3 text-[13px] leading-none font-medium text-run-fg transition-opacity hover:opacity-90"
            >
              Get Started with GitHub
            </a>
          </div>
        </div>

        <div className="my-12 h-px w-full bg-white/10" />

        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-[13px] font-medium text-white">
                {column.title}
              </p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1.5 text-[13px] text-white/64 transition-colors hover:text-white"
                    >
                      {link.label}
                      {link.external ? (
                        <ExternalIcon className="size-3 opacity-70" />
                      ) : null}
                      {link.tag ? (
                        <span className="rounded-[390px] bg-run-accent/25 px-2 py-0.5 text-[10px] leading-none text-[#4ec49b]">
                          {link.tag}
                        </span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-white">
            <RunloopMark className="size-[17px]" />
            <span className="text-[13px] leading-none font-bold tracking-[0.16em]">
              RUNLOOP
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {SOCIALS.map((social) => (
              <a
                key={social}
                href="#"
                className="text-[13px] text-white/64 transition-colors hover:text-white"
              >
                {social}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/64">
            <span>© 2026 Runloop AI, Inc.</span>
            {LEGAL.map((item) => (
              <a key={item} href="#" className="transition-colors hover:text-white">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
