"use client";

import { useEffect, useRef, useState } from "react";

import { useInView, usePrefersReducedMotion } from "@/components/showcase/use-motion";
import { cn } from "@/lib/utils";

/**
 * The hero film. It opens by showing how a lease actually starts, an agent is
 * given a job, is quoted a price over x402, pays it in USDC through the (the film records
 * one lease; a lease can equally be paid in HBAR)
 * facilitator on Hedera, and the machine answers, then runs thirty windowed
 * applications at a second each. Under every shot is the exchange that produced
 * it, and the pointer is drawn from the coordinates the agent really issued.
 *
 * Motion: plays only while on screen, and never under
 * `prefers-reduced-motion: reduce`, there the poster stands with a play
 * button. Off screen it is paused so nothing decodes unseen.
 */
const DESCRIPTION =
  "A fifty-three-second film: an agent is prompted, quoted a price over x402, pays in USDC through a facilitator on Hedera, and the machine comes up; then thirty windowed applications at a second each, each captioned with the prompt it was given: a live storefront, a Grafana dashboard, a GitHub pull request, a map route, Blender, Inkscape, Dia, " +
  "LibreOffice Calc, Writer and Draw, Gnumeric, AbiWord, Geany, gedit, Mousepad, Meld, Evince, Eye of GNOME, " +
  "gThumb, Thunar, File Roller, Xarchiver, DB Browser for SQLite, Baobab, System Monitor, Task Manager, Disks, " +
  "two calculators, Character Map, Color Picker and PDF Arranger.";

export function HeroFilm({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  const reduced = usePrefersReducedMotion();
  const [requested, setRequested] = useState(false);
  const [playing, setPlaying] = useState(false);

  const allowed = reduced ? requested : true;
  const showPlayButton = reduced && !requested;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Set on the element as well as in JSX: autoplay policies read the property,
    // and the attribute alone is not enough after a rehydrate.
    video.muted = true;
    if (!allowed || !inView) {
      video.pause();
      return;
    }
    const play = video.play();
    if (play) play.catch(() => undefined);
  }, [allowed, inView]);

  return (
    <div
      ref={ref}
      className={cn(
        "kl-card-deep overflow-hidden rounded-[24px] border border-white/10",
        "shadow-[0_36px_80px_-40px_oklch(0.14_0.01_85/0.6)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-5">
        <span className="flex items-center gap-2" aria-hidden="true">
          <span className="block size-3 rounded-full bg-[#ff5f57]" />
          <span className="block size-3 rounded-full bg-[#febc2e]" />
          <span className="block size-3 rounded-full bg-[#28c840]" />
        </span>
        {playing ? (
          <span className="kl-num ml-auto flex shrink-0 items-center gap-1.5 text-[10px] leading-none tracking-[0.14em] text-kl-on-card-muted uppercase">
            <span aria-hidden="true" className="block size-1.5 rounded-full bg-[var(--kl-amber)]" />
            rec
          </span>
        ) : null}
      </div>

      {/* 16:9, never letterboxed */}
      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          className="size-full object-cover"
          poster="/video/film-poster.webp"
          preload="metadata"
          muted
          loop
          playsInline
          autoPlay={!reduced}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={DESCRIPTION}
        >
          <source src="/video/film.webm" type="video/webm" />
          <source src="/video/film.mp4" type="video/mp4" />
        </video>

        {showPlayButton ? (
          <button
            type="button"
            onClick={() => setRequested(true)}
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-[oklch(0.14_0.01_85/0.35)] transition-colors hover:bg-[oklch(0.14_0.01_85/0.25)]"
          >
            <span className="flex items-center gap-2.5 rounded-[390px] bg-[var(--kl-card-deep)]/90 px-5 py-3 text-[13px] leading-none font-medium text-kl-on-card">
              <span
                aria-hidden="true"
                className="block size-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-current"
              />
              Play the recording
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
