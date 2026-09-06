"use client";

import Image from "next/image";

import { Container, DarkCard, Reveal, SectionHeading } from "./kleeto-primitives";

type Mark = { name: string; file: string };

/**
 * Real brand marks from `public/images/logos/`. The order runs desktop apps
 * first (what a person would have open), then the runtimes, stores and tools a
 * team installs on a machine. Three of these files (GitHub, Ollama, Vercel)
 * are drawn in white, so the strip sits on a dark panel where every mark is
 * legible without recolouring anyone's logo.
 */
const MARKS: readonly Mark[] = [
  { name: "Linux", file: "linux.svg" },
  { name: "Google Chrome", file: "googlechrome.svg" },
  { name: "Firefox", file: "firefoxbrowser.svg" },
  { name: "Visual Studio Code", file: "vscode-original.svg" },
  { name: "Slack", file: "slack-original.svg" },
  { name: "Salesforce", file: "salesforce-original.svg" },
  { name: "Python", file: "python.svg" },
  { name: "Node.js", file: "nodedotjs.svg" },
  { name: "Docker", file: "docker.svg" },
  { name: "GitHub", file: "github.svg" },
  { name: "Puppeteer", file: "puppeteer.svg" },
  { name: "PostgreSQL", file: "postgresql.svg" },
  { name: "Redis", file: "redis.svg" },
  { name: "MongoDB", file: "mongodb.svg" },
  { name: "Supabase", file: "supabase.svg" },
  { name: "Neon", file: "neon.svg" },
  { name: "Ollama", file: "ollama.svg" },
  { name: "Terraform", file: "terraform.svg" },
  { name: "Kubernetes", file: "kubernetes.svg" },
  { name: "Cloudflare", file: "cloudflare.svg" },
];

export function LogoStrip() {
  return (
    <section className="kl-section py-20 md:py-24">
      <Container>
        <SectionHeading
          lede="The desktop and the machine are ordinary Linux. The tools your team already uses install and run the way they do everywhere else."
        >
          It runs what you already run.
        </SectionHeading>

        <Reveal delayMs={80} y={16} className="mt-10 md:mt-12">
          <DarkCard className="px-6 py-7 md:px-8 md:py-8">
            <ul className="grid grid-cols-5 items-center justify-items-center gap-x-4 gap-y-7 sm:grid-cols-7 md:grid-cols-10 md:gap-x-6">
              {MARKS.map((mark) => (
                <li key={mark.file} className="flex items-center justify-center">
                  <Image
                    src={`/images/logos/${mark.file}`}
                    alt={mark.name}
                    title={mark.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-8 w-auto opacity-85 transition-[opacity,transform] duration-300 ease-out hover:-translate-y-0.5 hover:opacity-100 md:h-9 motion-reduce:transition-none"
                  />
                </li>
              ))}
            </ul>
          </DarkCard>
        </Reveal>

        <Reveal delayMs={160} y={12}>
          <p className="kl-num mt-5 border-t border-kl-line pt-3 text-[12px] text-kl-muted">
            apt, pip and npm work · bring your own image · nothing here is a shim
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
