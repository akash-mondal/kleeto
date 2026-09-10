import type { Metadata } from "next";
import { Archivo, Azeret_Mono } from "next/font/google";

import "@/components/kleeto/kleeto.css";
import { KleetoNav } from "@/components/kleeto/kleeto-nav";
import { KleetoHero } from "@/components/kleeto/kleeto-hero";
import { ProductsTrio } from "@/components/kleeto/kleeto-products";
import { KleetoLanes } from "@/components/kleeto/kleeto-lanes";
import { LogoStrip } from "@/components/kleeto/kleeto-logos";
import { DesktopShowcase } from "@/components/kleeto/kleeto-desktop";
import { BrowserShowcase } from "@/components/kleeto/kleeto-browser";
import { KleetoMeter } from "@/components/kleeto/kleeto-meter";
import { KleetoCtaBand } from "@/components/kleeto/kleeto-cta-band";
import { KleetoReceipt } from "@/components/kleeto/kleeto-receipt";
import { KleetoFaq } from "@/components/kleeto/kleeto-faq";
import { KleetoFooter } from "@/components/kleeto/kleeto-footer";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const azeret = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-azeret",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kleeto: your agent's own desktop and browser, paid by the second",
  description:
    "Your agent answers a 402, gets a real desktop to open applications on and a browser that gets through the blockers, and pays in HBAR or USDC on Hedera from its own account. No signup, no API key, no card.",
};

export default function KleetoPage() {
  return (
    <div className={`kleeto ${archivo.variable} ${azeret.variable} min-h-screen`}>
      <KleetoNav />
      <main>
        <KleetoHero />
        <ProductsTrio />
        <KleetoLanes />
        <LogoStrip />
        <DesktopShowcase />
        <BrowserShowcase />
        <KleetoMeter />
        <KleetoCtaBand />
        <KleetoReceipt />
        <KleetoFaq />
      </main>
      <KleetoFooter />
    </div>
  );
}
