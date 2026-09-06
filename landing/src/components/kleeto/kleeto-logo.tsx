import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * The Kleeto mark: a machine standing inside a meter.
 *
 * The dial is twelve engraved ticks rather than a stroked ring, so the meter reads as an
 * instrument and not as a loading spinner. Four ticks are amber, the seconds already spent,
 * and a single dot sits past the fourth one at the point the meter has reached. Inside it
 * stands one true isometric cube, the rented computer, the same solid the hero clusters are
 * built from.
 *
 * All geometry is computed rather than eyeballed: ticks at exact 30 degree steps, tapered
 * from 0.95 to 0.62 units so they look cut into the bezel, and a cube on real 30 degree
 * isometric axes, centred on its own bounding box rather than on its top vertex.
 *
 * Faces inherit `currentColor` so the mark works on paper and on the dark cards; only the
 * top face, the spent ticks and the head carry amber, which keeps the accent as rare here as
 * it is on the page. At 16px the ticks fuse into a bezel and it still reads as a cube in a
 * dial, which nothing else in the category looks like.
 */
export function KleetoMark({
  className,
  style,
  title = "Kleeto",
}: {
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
      className={cn("block", className)}
      style={style}
      fill="none"
    >
      {/* the meter, unspent */}
      <path
        d="M27.82 23.92 L28.77 22.28 L26.27 21.21 L25.65 22.29 Z M22.28 28.77 L23.92 27.82 L22.29 25.65 L21.21 26.27 Z M15.05 30.20 L16.95 30.20 L16.62 27.50 L15.38 27.50 Z M8.08 27.82 L9.72 28.77 L10.79 26.27 L9.71 25.65 Z M3.23 22.28 L4.18 23.92 L6.35 22.29 L5.73 21.21 Z M1.80 15.05 L1.80 16.95 L4.50 16.62 L4.50 15.38 Z M4.18 8.08 L3.23 9.72 L5.73 10.79 L6.35 9.71 Z M9.72 3.23 L8.08 4.18 L9.71 6.35 L10.79 5.73 Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      {/* the seconds already spent, and the head of the run */}
      <path
        d="M16.95 1.80 L15.05 1.80 L15.38 4.50 L16.62 4.50 Z M23.92 4.18 L22.28 3.23 L21.21 5.73 L22.29 6.35 Z M28.77 9.72 L27.82 8.08 L25.65 9.71 L26.27 10.79 Z M30.20 16.95 L30.20 15.05 L27.50 15.38 L27.50 16.62 Z"
        fill="var(--kl-amber, #f5b301)"
      />
      <circle cx="28.41" cy="19.33" r="1.5" fill="var(--kl-amber, #f5b301)" />

      {/* the machine: one isometric cube, lit from above */}
      <path d="M16.00 9.85 L21.80 13.20 L16.00 16.55 L10.20 13.20 Z" fill="var(--kl-amber, #f5b301)" />
      <path d="M10.20 13.20 L16.00 16.55 L16.00 22.15 L10.20 18.80 Z" fill="currentColor" fillOpacity="0.5" />
      <path d="M21.80 13.20 L16.00 16.55 L16.00 22.15 L21.80 18.80 Z" fill="currentColor" fillOpacity="0.82" />
    </svg>
  );
}

/** Mark plus wordmark, the lockup used in the nav and the footer. */
export function KleetoLockup({
  className,
  href = "/",
  size = 22,
}: {
  className?: string;
  href?: string;
  size?: number;
}) {
  return (
    <a
      href={href}
      className={cn("flex shrink-0 items-center gap-2.5", className)}
      aria-label="Kleeto home"
    >
      <KleetoMark className="shrink-0" style={{ width: size, height: size }} />
      <span
        className="text-[15px] leading-none font-semibold tracking-[0.16em]"
        style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"wdth" 118' }}
      >
        KLEETO
      </span>
    </a>
  );
}
