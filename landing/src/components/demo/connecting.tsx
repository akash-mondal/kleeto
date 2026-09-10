"use client";

import { useEffect, useRef, useState } from "react";
import { TextPathStudies } from "./shaders";

/**
 * The world, and the fall into it.
 *
 * While the agent is working out what you want, the panel has a globe turning behind the
 * conversation — ThreeUI's typographic sphere, its own source, running untouched in its frame.
 * Approving a plan starts a sequence rather than a spinner: the talk fades out and leaves the
 * globe alone in the panel, the panel falls toward one point on its face, and the picture breaks
 * into static. The static holds until the machine is actually there, which is the honest part —
 * the noise is the wait itself, not a fixed count that finishes before the desktop does.
 *
 * The point fallen toward is a spot on the globe's face, not a located city. The sphere runs in
 * a sandboxed frame whose geometry this cannot address, and the gateway does not publish which
 * region a machine came up in, so naming one would be decoration pretending to be data.
 */
export type Stage = "idle" | "focus" | "dive" | "static" | "live";

const SPOTS = [
  { x: "38%", y: "42%" },
  { x: "58%", y: "55%" },
  { x: "47%", y: "36%" },
  { x: "62%", y: "44%" },
];

export function Globe({ stage }: { stage: Stage }) {
  const [spot] = useState(() => SPOTS[Math.floor(Math.random() * SPOTS.length)]);
  if (stage === "static" || stage === "live") return null;

  const focused = stage !== "idle";
  const diving = stage === "dive";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-[transform,filter,opacity] motion-reduce:transition-none"
        style={{
          transformOrigin: `${spot.x} ${spot.y}`,
          transform: diving
            ? "scale(7)"
            : focused
              ? "scale(1.02)"
              /* idle it sits low and right of the reading column rather than under it */
              : "translate(18%, 14%) scale(1.05)",
          filter: diving ? "blur(14px) brightness(1.5)" : "blur(0px)",
          opacity: diving ? 0.95 : focused ? 0.8 : 0.34,
          transitionDuration: diving ? "1500ms" : "900ms",
          transitionTimingFunction: diving
            ? "cubic-bezier(0.7, 0, 0.84, 0)"
            : "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <TextPathStudies variant="globe-study" mode="dark" scale={1} opacity={1} hue={0} saturation={1} brightness={1} />
      </div>

      {/* the reading side stays dark while there is reading to do, and clears once there is not */}
      <div
        className="absolute inset-0 transition-opacity duration-[900ms]"
        style={{
          opacity: stage === "idle" ? 1 : 0,
          background:
            "linear-gradient(100deg, oklch(0.145 0.008 85 / 0.94) 22%, oklch(0.145 0.008 85 / 0.55) 58%, transparent 92%)",
        }}
      />
    </div>
  );
}

/**
 * Snow, drawn rather than shipped.
 *
 * A looping video of static would be a heavier download than the thing it depicts. This is the
 * real article: white noise at quarter resolution scaled up, with the roll bar an untuned set
 * has, and it stops dead when the panel unmounts.
 */
export function Static({ label = "finding a machine" }: { label?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return undefined;
    const ctx = el.getContext("2d", { alpha: false });
    if (!ctx) return undefined;
    const w = (el.width = 200);
    const h = (el.height = 112);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ctx.fillStyle = "#141210";
      ctx.fillRect(0, 0, w, h);
      return undefined;
    }

    let raf = 0;
    let roll = 0;
    const frame = ctx.createImageData(w, h);
    const paint = () => {
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        /* warm grey rather than television's blue-white, so the noise belongs to this page */
        const v = (Math.random() * 255) | 0;
        d[i] = v; d[i + 1] = (v * 0.97) | 0; d[i + 2] = (v * 0.9) | 0; d[i + 3] = 255;
      }
      ctx.putImageData(frame, 0, 0);
      roll = (roll + 1.7) % h;
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(0, roll, w, 7);
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="kl-rise absolute inset-0 overflow-hidden bg-black">
      <canvas
        ref={canvas}
        className="h-full w-full opacity-[0.55]"
        style={{ imageRendering: "pixelated" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(72% 72% at 50% 50%, transparent 26%, oklch(0.1 0.006 85 / 0.94) 100%)" }}
      />
      <span className="kl-num absolute inset-x-0 bottom-6 text-center text-[10.5px] tracking-[0.2em] text-white/50 uppercase">
        {label}
      </span>
    </div>
  );
}
