"use client";

import { useEffect, useRef, useState } from "react";
import { TextPathStudies } from "./shaders";

/**
 * The globe, and the dive into it.
 *
 * While the agent is still working out what you want, the panel has a world behind it turning
 * slowly — ThreeUI's typographic globe, its own source, running untouched in its own frame.
 * The moment a plan is approved the machine has to come from somewhere, so the globe is dived
 * into: it scales toward one point on its face, smears, and breaks into static, and the static
 * holds until the machine is actually there. That last part is the honest bit — the noise is
 * not a timed flourish, it ends when the live view exists and not a moment before.
 *
 * The dive target is a point on the globe's face, not a located city. The sphere runs inside a
 * sandboxed frame whose geometry this cannot address, and the gateway does not publish which
 * region a machine came up in, so naming one would be decoration pretending to be data.
 */
type Stage = "idle" | "dive" | "static";

/** A few spots to fall toward, so two runs in a row do not dive down the same line. */
const SPOTS = [
  { x: "38%", y: "42%" },
  { x: "58%", y: "55%" },
  { x: "47%", y: "36%" },
  { x: "62%", y: "44%" },
];

export function Connecting({ stage }: { stage: Stage }) {
  const [spot] = useState(() => SPOTS[Math.floor(Math.random() * SPOTS.length)]);
  const diving = stage !== "idle";
  if (stage === "static") return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-[transform,filter,opacity] duration-[1400ms] ease-[cubic-bezier(0.7,0,0.84,0)] motion-reduce:transition-none"
        style={{
          transformOrigin: `${spot.x} ${spot.y}`,
          /* idle, the world sits low and to the right of the reading column rather than under
             it — present in the room, not competing with the sentence being read */
          transform: diving ? "scale(7)" : "translate(18%, 14%) scale(1.05)",
          filter: diving ? "blur(14px) brightness(1.5)" : "blur(0px)",
          opacity: diving ? 0.9 : 0.34,
        }}
      >
        <TextPathStudies variant="globe-study" mode="dark" scale={1} opacity={1} hue={0} saturation={1} brightness={1} />
      </div>

      {/* the reading side stays dark, so type never sits on top of a moving letterform */}
      {stage === "idle" ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, oklch(0.145 0.008 85 / 0.94) 22%, oklch(0.145 0.008 85 / 0.55) 58%, transparent 92%)",
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Snow, drawn rather than shipped.
 *
 * A looping video of static would be a heavier download than the thing it depicts. This is the
 * real article: white noise per pixel at quarter resolution, scaled up, with the roll bar an
 * untuned set has — and it stops dead when the panel unmounts, because nothing on this page
 * animates once there is nothing to say.
 */
export function Static() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return undefined;
    const ctx = el.getContext("2d", { alpha: false });
    if (!ctx) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ctx.fillStyle = "#141210";
      ctx.fillRect(0, 0, el.width, el.height);
      return undefined;
    }

    let raf = 0;
    let roll = 0;
    const w = (el.width = 160);
    const h = (el.height = 90);
    const frame = ctx.createImageData(w, h);

    const paint = () => {
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        /* warm grey rather than television's blue-white, so the noise belongs to this page */
        const v = (Math.random() * 255) | 0;
        d[i] = v; d[i + 1] = (v * 0.97) | 0; d[i + 2] = (v * 0.9) | 0; d[i + 3] = 255;
      }
      ctx.putImageData(frame, 0, 0);
      roll = (roll + 1.6) % h;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, roll, w, 6);
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="kl-rise absolute inset-0 overflow-hidden">
      <canvas
        ref={canvas}
        className="h-full w-full opacity-[0.5]"
        style={{ imageRendering: "pixelated" }}
      />
      {/* the corners fall off the way a tube's do, so the noise reads as a screen tuning in
          rather than as a rectangle of grey laid over the panel */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(70% 70% at 50% 50%, transparent 30%, oklch(0.12 0.006 85 / 0.9) 100%)" }}
      />
      <span className="kl-num absolute inset-x-0 bottom-4 text-center text-[10.5px] tracking-[0.18em] text-white/45 uppercase">
        finding a machine
      </span>
    </div>
  );
}
