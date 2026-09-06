import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { RunloopBenchmarks } from "@/components/runloop/runloop-benchmarks";
import { RunloopBuild } from "@/components/runloop/runloop-build";
import { RunloopCtaBand } from "@/components/runloop/runloop-cta-band";
import { RunloopFaq } from "@/components/runloop/runloop-faq";
import { RunloopFeatures } from "@/components/runloop/runloop-features";
import { RunloopFooter } from "@/components/runloop/runloop-footer";
import { RunloopHero } from "@/components/runloop/runloop-hero";
import { RunloopNav } from "@/components/runloop/runloop-nav";
import { RunloopScale } from "@/components/runloop/runloop-scale";
import { RunloopVpc } from "@/components/runloop/runloop-vpc";

/**
 * "Britti Sans" is a licensed foundry face and is not redistributable, so the
 * page asks for it first and falls back to Plus Jakarta Sans — the closest
 * geometric grotesque on Google Fonts (same single-storey g, similar aperture).
 */
const brittiFallback = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-britti-fallback",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Runloop - Your AI Agent Accelerator",
  description:
    "Launch AI agents on secure code sandboxes, refine with evaluations, and ship on AI infrastructure built for enterprise scale",
};

export default function RunloopPage() {
  return (
    <div
      className={`${brittiFallback.variable} ${plexMono.variable} min-h-screen bg-[#e9ecea] text-run-fg [font-family:"Britti_Sans",var(--font-britti-fallback),Arial,sans-serif] antialiased`}
    >
      <RunloopNav />
      <main>
        <RunloopHero />
        <RunloopBuild />
        <RunloopScale />
        <RunloopBenchmarks />
        <RunloopFeatures />
        <RunloopCtaBand />
        <RunloopVpc />
        <RunloopFaq />
      </main>
      <RunloopFooter />
    </div>
  );
}
