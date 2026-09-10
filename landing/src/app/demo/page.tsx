import type { Metadata } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";

import "@/components/kleeto/kleeto.css";
import "@/shaders/threeui.css";
import { PredictiveArcCanvas } from "@/components/demo/shaders";
import { AgentBalance } from "@/components/demo/agent-balance";
import { Composer } from "@/components/demo/composer";
import { KleetoLockup } from "@/components/kleeto/kleeto-logo";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const azeret = Azeret_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-azeret", display: "swap" });

export const metadata: Metadata = {
  title: "Try it · Kleeto",
  description:
    "A workspace with an agent that holds its own wallet. Give it a job and watch it rent the computer it needs, by the second, on Hedera.",
};

export default function DemoPage() {
  return (
    <div className={`kleeto ${archivo.variable} ${azeret.variable} relative min-h-screen overflow-hidden bg-[#0d0b09]`}>
      {/* the field, from ThreeUI's own source */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <PredictiveArcCanvas variant="signal-particles" mode="dark" speed={1.0} hue={0} saturation={1.0} brightness={1.0} />
      </div>
      {/* enough scrim to read type over it, not enough to hide it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: "radial-gradient(70% 55% at 50% 45%, oklch(0.1 0.01 85 / 0.35), oklch(0.09 0.008 85 / 0.86) 78%)" }}
      />

      <div className="relative z-20 flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
          <KleetoLockup className="text-white" href="/" />
          <AgentBalance />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 md:px-10">
          <Composer />
        </main>

        <footer className="px-6 pb-6 text-center text-[12px] text-white/30 md:px-10">
          The agent pays each 402 from its own Hedera account. Every second is on a public ledger.
        </footer>
      </div>
    </div>
  );
}
