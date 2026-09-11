"use client";

import { AuroraCard } from "@/components/showcase/aurora";
import { ProductShot, type ProductShotAsset } from "@/components/showcase/media";

/**
 * Frames recorded off real leases: each lane card shows the
 * lane actually running, rather than an illustration of it.
 */
const SHOTS = {
  // One capture per slot, and no capture is reused anywhere else on the page: the
  // desktop lane shows GIMP mid-edit, the browser lane a live Grafana dashboard, the
  // machine lane four cores pinned under a hashing job.
  desktop: { src: "/images/kleeto/lane-desktop.jpg", width: 1280, height: 720 },
  browser: { src: "/images/kleeto/lane-browser.jpg", width: 1280, height: 720 },
  machine: { src: "/images/kleeto/lane-machine.jpg", width: 1280, height: 720 },
} as const satisfies Record<string, ProductShotAsset>;

import { BoxedWord, Container, Reveal, SectionHeading } from "./kleeto-primitives";

type Lane = {
  name: string;
  id: string;
  headline: string;
  body: string;
  spec: string;
  perHour: string;
  perTenMin: string;
  boot: string;
  shot: ProductShotAsset;
  alt: string;
};

/**
 * Desktop first, browser second, bare machine last: the two lanes that look
 * like a screen a person would use lead, and the headless box is where raw
 * capability gets advertised. Prices from `src/lanes.mjs` (x1.10 margin);
 * boot times measured 4 Sep 2026.
 */
const LANES: readonly Lane[] = [
  {
    name: "Desktop",
    id: "desktop-2",
    headline: "A full Linux desktop",
    body: "Xfce with Chrome, LibreOffice, a file manager and a terminal. Your agent clicks, types and reads the screen. You can watch it live, or take the mouse yourself.",
    spec: "2 vCPU · 4 GB · 20 GB disk · 1280×720 · VNC",
    perHour: "$0.148 / hr",
    perTenMin: "10 min ≈ 2.5¢",
    boot: "1.3 s",
    shot: SHOTS.desktop,
    alt: "GIMP open on a desktop lease, with the rendered image loaded and the filter menu in use",
  },
  {
    name: "Browser",
    id: "browser-fast",
    headline: "A real browser",
    body: "Chrome on a CDP endpoint, headless or headful. Playwright and Puppeteer connect to it unchanged.",
    spec: "Chrome · CDP · screenshots · recording",
    perHour: "$0.11 / hr",
    perTenMin: "10 min ≈ 1.8¢",
    boot: "~1 s",
    shot: SHOTS.browser,
    alt: "A browser lease showing a live Grafana dashboard with running pods and container counts",
  },
  {
    name: "Machine",
    id: "machine-2",
    headline: "A machine to do the heavy part",
    body: "Headless Linux with a shell, a stateful Python REPL, volumes and a public preview URL. Install what you need, then render, build or serve.",
    spec: "1–8 vCPU · 2–16 GB · 10 GB disk",
    perHour: "from $0.062 / hr",
    perTenMin: "10 min ≈ 1.0¢",
    boot: "0.75 s",
    shot: SHOTS.machine,
    alt: "btop on a machine lease with all four cores at full load under a hashing job",
  },
];

const ALL_LANES: readonly { id: string; perHour: string }[] = [
  { id: "machine-1", perHour: "$0.062" },
  { id: "machine-2", perHour: "$0.126" },
  { id: "machine-4", perHour: "$0.252" },
  { id: "machine-8", perHour: "$0.501" },
  { id: "desktop-2", perHour: "$0.148" },
  { id: "desktop-4", perHour: "$0.274" },
  { id: "browser-fast", perHour: "$0.11" },
];

export function KleetoLanes() {
  return (
    <section id="lanes" className="kl-ground scroll-mt-20 py-24 md:py-32">
      <Container>
        <SectionHeading
          lede="A browser for a form, a machine for the heavy pass, a desktop when the app has no API. Whichever you take, the price per second comes back in the 402, your agent pays it in HBAR or USDC, and Hedera settles it."
        >
          Rent only what the job needs, <BoxedWord>by the second.</BoxedWord>
        </SectionHeading>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
          {LANES.map((lane, index) => (
            <Reveal key={lane.id} delayMs={index * 80} className="h-full">
              <AuroraCard className="rounded-[24px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 motion-reduce:transition-none">
                <ProductShot
                  asset={lane.shot}
                  alt={lane.alt}
                  sizes="(min-width: 768px) 380px, 100vw"
                  className="border-b border-white/10"
                />
                <div className="flex flex-1 flex-col p-6">
                  <p className="kl-num text-[11px] tracking-[0.14em] text-kl-amber uppercase">{lane.id}</p>
                  <h3 className="kl-display mt-3 min-h-[49px] text-[22px] leading-[1.1] font-medium text-kl-on-card">
                    {lane.headline}
                  </h3>
                  <p className="mt-2 min-h-[88px] text-[14px] leading-[1.55] text-kl-on-card-muted">{lane.body}</p>
                  <p className="kl-num mt-4 min-h-[36px] text-[12px] leading-[1.5] text-kl-on-card-muted">{lane.spec}</p>

                  <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                    <div>
                      <p className="kl-num text-[20px] leading-none text-kl-on-card">{lane.perHour}</p>
                      <p className="kl-num mt-2 text-[12px] text-kl-on-card-muted">{lane.perTenMin}</p>
                    </div>
                    <div className="text-right">
                      <p className="kl-num text-[11px] tracking-[0.14em] text-kl-on-card-muted uppercase">boot</p>
                      <p className="kl-num mt-1.5 text-[14px] leading-none text-kl-on-card">{lane.boot}</p>
                    </div>
                  </div>
                </div>
              </AuroraCard>
            </Reveal>
          ))}
        </div>

              </Container>
    </section>
  );
}
