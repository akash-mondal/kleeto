"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { FeatureCard } from "./feature-card";
import { usePrefersReducedMotion } from "./use-motion";

/**
 * The Browsers feature coverflow.
 *
 * Measured from `reference/motion/browsers/06-*` and `07-*`: the centre card is
 * full size and full opacity with a 2px amber rule along its bottom edge, the
 * flanking cards are dimmed, scaled down and pushed back in Z, and a hairline
 * progress bar under the row tracks scroll position (in the captured frame the
 * amber fill is ~1% of a 961px track, i.e. it is a scroll-progress fill, not a
 * per-slide step).
 *
 * Mechanics are native: CSS scroll-snap does the scrolling, so touch, trackpad,
 * drag and keyboard all work without a single event handler; an
 * `IntersectionObserver` watching a narrow band at the centre of the scroller
 * decides which card is active. Auto-advance yields to the user for 6s after
 * any interaction, and is switched off entirely under reduced motion.
 */

export type CarouselCard = {
  eyebrow: string;
  title: string;
  description: string;
  visual: ReactNode;
};

const AUTOPLAY_MS = 4200;
const USER_PAUSE_MS = 6000;

export function FeatureCarousel({
  items,
  label,
  className,
}: {
  items: readonly CarouselCard[];
  label: string;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLSpanElement>(null);
  const pausedUntil = useRef(0);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  const reduced = usePrefersReducedMotion();

  const scrollToIndex = useCallback(
    (index: number, smooth: boolean) => {
      const scroller = scrollerRef.current;
      const card = cardRefs.current[index];
      if (!scroller || !card) return;
      scroller.scrollTo({
        left: card.offsetLeft - (scroller.clientWidth - card.clientWidth) / 2,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [],
  );

  // Which card is under the centre of the scroller.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = cardRefs.current.indexOf(entry.target as HTMLDivElement);
          if (index >= 0) {
            activeRef.current = index;
            setActive(index);
          }
        }
      },
      // A 10%-wide band across the middle of the scroller: only the card
      // sitting on the centre line can intersect it.
      { root: scroller, rootMargin: "0px -45% 0px -45%", threshold: 0 },
    );

    for (const card of cardRefs.current) if (card) observer.observe(card);
    return () => observer.disconnect();
  }, [items.length]);

  // Is the whole row on screen? Nothing auto-advances otherwise.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (!("IntersectionObserver" in window)) {
      const raf = requestAnimationFrame(() => setSectionInView(true));
      return () => cancelAnimationFrame(raf);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setSectionInView(entry.isIntersecting);
      },
      { threshold: 0.3 },
    );
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  // Auto-advance.
  useEffect(() => {
    if (reduced || !sectionInView) return;
    const id = window.setInterval(() => {
      if (performance.now() < pausedUntil.current) return;
      scrollToIndex((activeRef.current + 1) % items.length, true);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reduced, sectionInView, items.length, scrollToIndex]);

  // Scroll-progress fill, written straight to the node so scrolling never
  // triggers a React render.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let queued = false;
    const paint = () => {
      queued = false;
      const bar = progressRef.current;
      if (!bar) return;
      const span = scroller.scrollWidth - scroller.clientWidth;
      const ratio = span > 0 ? scroller.scrollLeft / span : 0;
      bar.style.width = `${Math.min(Math.max(ratio, 0), 1) * 100}%`;
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(paint);
    };

    paint();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  const yieldToUser = useCallback(() => {
    pausedUntil.current = performance.now() + USER_PAUSE_MS;
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    yieldToUser();
    const next = event.key === "ArrowRight" ? activeRef.current + 1 : activeRef.current - 1;
    scrollToIndex(Math.min(Math.max(next, 0), items.length - 1), !reduced);
  };

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div
        ref={scrollerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={yieldToUser}
        onWheel={yieldToUser}
        onTouchStart={yieldToUser}
        className={cn(
          "relative -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain py-2 lg:-mx-[60px]",
          // Percentage padding resolves against the *containing block*, not the
          // scroller, and the scroller is wider than that by its negative
          // margin — hence the `+ 24px` / `+ 60px` terms. Without them the
          // centre card sits off-centre by exactly the bleed.
          "px-[calc(50%+24px-var(--card-w)/2)] lg:px-[calc(50%+60px-var(--card-w)/2)]",
          "[--card-w:min(78vw,320px)] md:[--card-w:min(62vw,400px)] lg:[--card-w:496px]",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sol-accent",
        )}
      >
        {items.map((item, index) => (
          <div
            key={item.title}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}: ${item.title}`}
            className="w-[var(--card-w)] shrink-0 snap-center"
          >
            {/* The 3D transform lives on an inner box: transforming the snap
                target itself moves its snap position and makes the scroller
                fight the animation. */}
            <div
              data-active={index === active}
              data-side={index === active ? "centre" : index < active ? "left" : "right"}
              className={cn(
                "group relative h-full opacity-45",
                "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "data-[side=left]:[transform:perspective(1600px)_translateZ(-110px)_rotateY(7deg)]",
                "data-[side=right]:[transform:perspective(1600px)_translateZ(-110px)_rotateY(-7deg)]",
                "data-[active=true]:[transform:none] data-[active=true]:opacity-100",
                "motion-reduce:opacity-100 motion-reduce:transition-none motion-reduce:[transform:none]",
              )}
            >
              <FeatureCard
                className="h-full"
                eyebrow={item.eyebrow}
                title={item.title}
                description={item.description}
                visual={item.visual}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-sol-accent",
                  "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "group-data-[active=true]:scale-x-100",
                  "motion-reduce:transition-none",
                )}
              />
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden className="h-px w-full bg-white/10">
        <span ref={progressRef} className="block h-full w-0 bg-sol-accent" />
      </div>
    </div>
  );
}
