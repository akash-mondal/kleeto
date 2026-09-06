"use client";

import { AuroraCard } from "@/components/solari-product/aurora";
import { ProductShot, type ProductShotAsset } from "@/components/solari-product/media";

/** Three captures from the browser take, each a different site and a different job. */
const SHOT_STORE: ProductShotAsset = { src: "/images/kleeto/web-store.jpg", width: 1280, height: 720 };
const SHOT_MARKET: ProductShotAsset = { src: "/images/kleeto/web-market.jpg", width: 1280, height: 720 };
const SHOT_MAP: ProductShotAsset = { src: "/images/kleeto/web-map.jpg", width: 1280, height: 720 };

import { BoxedWord, Container, DarkCard, Reveal, SectionHeading } from "./kleeto-primitives";

type Mode = {
  title: string;
  body: string;
  shot: ProductShotAsset;
  alt: string;
};

const MODES: readonly Mode[] = [
  {
    title: "Works a marketplace",
    body: "Classifieds have no API at all. Your agent reads the asking price, the condition and where the seller is, then decides whether it is worth an offer.",
    shot: SHOT_MARKET,
    alt: "A browser lease on a classifieds listing showing the asking price, condition and the seller's location",
  },
  {
    title: "Works a map",
    body: "Plan a route, read the turn-by-turn back and hand the result on. A window you can watch, and step into when it stalls.",
    shot: SHOT_MAP,
    alt: "A browser lease showing a driving route on OpenStreetMap with turn-by-turn directions",
  },
];


export function BrowserShowcase() {
  return (
    <section id="browser" className="kl-section scroll-mt-20 py-24 md:py-32">
      <Container>
        <SectionHeading
          lede="Real Chrome, not a scraper. For the parts of the web that never shipped an API, metered by the second like every other lane."
        >
          A browser that behaves like <BoxedWord>a person&apos;s.</BoxedWord>
        </SectionHeading>

        <Reveal delayMs={80} className="mt-12 md:mt-16">
          <DarkCard className="p-6 md:p-8">
            <div className="grid items-center gap-8 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-5">
                <h3 className="kl-display text-[20px] leading-[1.15] font-medium text-kl-on-card">
Checks a price like a customer would
                </h3>
                <p className="mt-3 max-w-[42ch] text-[14px] leading-[1.6] text-kl-on-card-muted">
                  A real Chrome on a real storefront: open the product, read the price, check
                  which sizes are in stock. Nothing is faked at the network layer.
                </p>
              </div>
              <div className="md:col-span-7">
                <ProductShot
                  asset={SHOT_STORE}
                  alt="A browser lease on a live storefront, reading the price and the size and colour options of a product"
                  sizes="(min-width: 768px) 640px, 100vw"
                  className="overflow-hidden rounded-[12px] border border-white/10"
                />
              </div>
            </div>
          </DarkCard>
        </Reveal>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {MODES.map((mode, index) => (
            <Reveal key={mode.title} delayMs={160 + index * 80} className="h-full">
              <AuroraCard className="rounded-[24px]">
                <ProductShot
                  asset={mode.shot}
                  alt={mode.alt}
                  sizes="(min-width: 768px) 570px, 100vw"
                  className="border-b border-white/10"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="kl-display text-[20px] leading-[1.15] font-medium text-kl-on-card">
                    {mode.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.55] text-kl-on-card-muted">{mode.body}</p>
                </div>
              </AuroraCard>
            </Reveal>
          ))}
        </div>

      </Container>
    </section>
  );
}
