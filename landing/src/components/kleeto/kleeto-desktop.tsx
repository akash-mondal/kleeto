"use client";

import { AuroraCard } from "@/components/solari-product/aurora";
import { AppDock, ProductShot, type ProductShotAsset } from "@/components/solari-product/media";

/** A frame from the recording in `agent-runs/hero-recording`, a real lease, not a mock. */
const REAL_WORKSPACE: ProductShotAsset = {
  src: "/images/kleeto/show-blender.jpg",
  width: 1280,
  height: 720,
};

/** Two more captures, each with the pointer position the shoot logged for that frame. */
const SHOT_APPS: ProductShotAsset = { src: "/images/kleeto/show-apps.jpg", width: 1280, height: 720 };
const SHOT_VECTOR: ProductShotAsset = { src: "/images/kleeto/show-vector.jpg", width: 1280, height: 720 };

import { AgentPointer } from "./agent-pointer";
import { BoxedWord, Container, DarkCard, Reveal, SectionHeading } from "./kleeto-primitives";

type Support = {
  title: string;
  body: string;
  shot: ProductShotAsset;
  alt: string;
  /** Where the pointer sat when the frame was taken, in the capture's 1280x720 space. */
  pointer: { x: number; y: number };
};

const SUPPORTING: readonly Support[] = [
  {
    title: "Four apps, one meter",
    body: "The agent reads the page, edits the sheet, runs the number in a shell and opens the export. Apps with no API still get used, and the whole job bills as a single lease.",
    shot: SHOT_APPS,
    alt: "A desktop lease running Chrome, LibreOffice Calc, a terminal printing a computed total, and a PDF export of the same sheet",
    pointer: { x: 470, y: 300 },
  },
  {
    title: "Boot with your tools already installed",
    body: "Install once, snapshot the desktop, then start copies of it whenever work arrives. This one came up with Inkscape open on the file. You never pay for the same setup twice.",
    shot: SHOT_VECTOR,
    alt: "Inkscape on a desktop lease with a vector plate open and a group of nine objects selected on the canvas",
    pointer: { x: 452, y: 396 },
  },
];


export function DesktopShowcase() {
  return (
    <section id="desktop" className="kl-ground scroll-mt-20 py-24 md:py-32">
      <Container>
        <SectionHeading
          lede="Real applications on a real screen, driven by mouse and keyboard. Rented by the second and paid for out of the agent's own balance, in HBAR or USDC."
        >
          The apps your agent needs are <BoxedWord>already open.</BoxedWord>
        </SectionHeading>

        <Reveal delayMs={80} className="mt-12 md:mt-16">
          <DarkCard>
            <ProductShot
              asset={REAL_WORKSPACE}
              alt="Blender open on a desktop-4 lease with a torus-knot scene framed in the camera view"
              sizes="(min-width: 1240px) 1140px, (min-width: 768px) 92vw, 100vw"
            />
            <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
              <AppDock />
              <p className="max-w-[46ch] text-[13px] leading-[1.55] text-kl-on-card-muted md:text-right">
                Blender has no API. The agent drives the real application with mouse and
                keyboard, then reads the result off the screen.
              </p>
            </div>
          </DarkCard>
        </Reveal>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {SUPPORTING.map((card, index) => (
            <Reveal key={card.title} delayMs={160 + index * 80} className="h-full">
              <AuroraCard className="rounded-[24px]">
                <div className="relative border-b border-white/10">
                  <ProductShot asset={card.shot} alt={card.alt} sizes="(min-width: 768px) 570px, 100vw" />
                  <AgentPointer x={card.pointer.x} y={card.pointer.y} />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="kl-display text-[20px] leading-[1.15] font-medium text-kl-on-card">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.55] text-kl-on-card-muted">{card.body}</p>
                </div>
              </AuroraCard>
            </Reveal>
          ))}
        </div>

      </Container>
    </section>
  );
}
