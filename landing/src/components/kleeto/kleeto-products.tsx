"use client";

import { useEffect, useRef, useState } from "react";

import { useInView, usePrefersReducedMotion } from "@/components/showcase/use-motion";
import { BoxedWord, Container, DarkCard, Reveal, SectionHeading } from "./kleeto-primitives";

/**
 * The three products, side by side under the hero (brief v2 §1/§3: lead with
 * the desktop and the browser, show the machine and never the infrastructure).
 *
 * Each column carries a real recording rather than a mock: the clip opens on a
 * dark card holding the prompt the agent was given, then cross-fades into the
 * take of it doing the work. That card is also the poster, so a column that has
 * not started yet still reads as "here is the task".
 *
 * Playback is per column, never section-wide: every video is `preload="none"`
 * and only starts once its own column is in view, so three clips never race
 * each other on a slow connection. Off screen each one pauses again, and under
 * `prefers-reduced-motion: reduce` nothing autoplays, the poster stands with a
 * play button.
 */

type Product = {
  key: string;
  title: string;
  slug: "browser" | "desktop" | "machine";
  body: string;
  cta: string;
  href: string;
  stat: string;
  /** What the recording shows, for people who cannot see it. */
  ariaLabel: string;
};

const PRODUCTS: readonly Product[] = [
  {
    key: "browsers",
    title: "Cloud Browsers",
    slug: "browser",
    body: "For the sites that never shipped an API. Your agent fills in portals, signs in on a user's behalf and reads pages back, in real Chrome on a CDP endpoint.",
    cta: "Explore browsers",
    href: "#browser",
    stat: "about 1 s to spin up",
    ariaLabel:
      "Recording of an agent on a browser lease. It opens on the prompt it was given, find a place on a map and zoom in, then Chrome loads the map, searches for the place and zooms in on it.",
  },
  {
    key: "desktops",
    title: "Computer Desktops",
    slug: "desktop",
    body: "A live screen your agent drives and you can watch. Blender, LibreOffice, a file manager, anything that expects a desktop.",
    cta: "Explore desktops",
    href: "#desktop",
    stat: "1.3 s to spin up",
    ariaLabel:
      "Recording of an agent on a desktop lease. It opens on the prompt it was given, then the agent drives a full Linux desktop, opening applications, clicking and typing on screen.",
  },
  {
    key: "machines",
    title: "Bare Machines",
    slug: "machine",
    body: "No screen, just compute. Renders, builds, servers and long jobs, with every core in view while they run.",
    cta: "Explore machines",
    href: "#lanes",
    stat: "0.75 s to spin up",
    ariaLabel:
      "Recording of an agent on a bare machine lease. It opens on the prompt it was given, then a shell runs the job and prints its output, no desktop, no browser.",
  },
];

export function ProductsTrio() {
  return (
    <section id="products" className="kl-ground scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
      <Container className="px-0 md:px-0">
        <SectionHeading
          lede="Each box is a real recording of an agent at work. It opens on the prompt the agent was given, then shows what it did about it."
        >
          Give it the machine <BoxedWord>the job needs.</BoxedWord>
        </SectionHeading>

        <Reveal className="mt-10 md:mt-14" delayMs={80}>
          <DarkCard>
            <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              {PRODUCTS.map((product) => (
                <ProductColumn key={product.key} product={product} />
              ))}
            </div>
          </DarkCard>
        </Reveal>
      </Container>
    </section>
  );
}

function ProductColumn({ product }: { product: Product }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  const reduced = usePrefersReducedMotion();

  // Under reduced motion the clip only ever runs if the reader asks for it.
  const [requested, setRequested] = useState(false);
  const allowed = reduced ? requested : true;
  const showPlayButton = reduced && !requested;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Set on the element as well as in JSX: autoplay policies read the
    // property, and the attribute alone is not enough after a rehydrate.
    video.muted = true;

    if (!allowed || !inView) {
      video.pause();
      return;
    }
    const play = video.play();
    if (play) play.catch(() => undefined);
  }, [allowed, inView]);

  return (
    <div ref={ref} className="flex flex-col gap-5 p-6 md:p-7">
      <h3 className="kl-display text-[18px] leading-[1.2] font-medium text-kl-on-card md:text-[20px]">
        {product.title}
      </h3>

      <div className="relative aspect-video w-full overflow-hidden rounded-[8px] border border-white/10">
        <video
          ref={videoRef}
          className="size-full object-cover"
          poster={`/video/lane-${product.slug}-poster.webp`}
          preload="none"
          muted
          loop
          playsInline
          aria-label={product.ariaLabel}
        >
          <source src={`/video/lane-${product.slug}.mp4`} type="video/mp4" />
        </video>

        {showPlayButton ? (
          <button
            type="button"
            onClick={() => setRequested(true)}
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-[oklch(0.14_0.01_85/0.35)] transition-colors hover:bg-[oklch(0.14_0.01_85/0.25)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--kl-amber)]"
          >
            <span className="flex items-center gap-2 rounded-[390px] bg-[var(--kl-card-deep)]/90 px-4 py-2.5 text-[12px] leading-none font-medium text-kl-on-card">
              <span
                aria-hidden="true"
                className="block size-0 border-y-[5px] border-l-[9px] border-y-transparent border-l-current"
              />
              Play the recording
            </span>
          </button>
        ) : null}
      </div>

      <p className="text-[13px] leading-[1.6] text-kl-on-card-muted md:text-[14px]">{product.body}</p>

      <a
        href={product.href}
        className="kl-num mt-auto inline-flex w-fit items-center justify-center rounded-[8px] border border-white/20 px-4 py-2.5 text-[11px] leading-none tracking-[0.14em] text-kl-on-card uppercase transition-colors hover:border-[var(--kl-amber)]/60 hover:text-kl-amber focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kl-amber)]"
      >
        {product.cta}
      </a>

      <p className="kl-num border-t border-white/10 pt-4 text-[11px] leading-none text-kl-on-card-muted">
        {product.stat}
      </p>
    </div>
  );
}
