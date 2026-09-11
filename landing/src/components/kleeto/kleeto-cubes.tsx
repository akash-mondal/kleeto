import { cn } from "@/lib/utils";

/**
 * Isometric cube clusters for the Kleeto hero.
 *
 * An isometric lattice with a 2:1 projection, painted
 * back-to-front (ascending x + y + z). Retoned: every face is a warm grey on
 * hue 85 with very low chroma, so the cluster reads as a quiet object on the
 * paper ground. Exactly one cube per page carries the `amber` tone on its top
 * face, the brief keeps amber rare.
 */
export type KleetoCubeTone = "dark" | "mid" | "light" | "amber";

export interface KleetoCubeSpec {
  x: number;
  y: number;
  z: number;
  tone?: KleetoCubeTone;
}

const W = 55; // half width of the top rhombus
const H = 32; // half depth of the top rhombus
const S = 64; // vertical side height

function project(c: KleetoCubeSpec) {
  return { px: (c.x - c.y) * W, py: (c.x + c.y) * H - c.z * S };
}

/* Warm greys derived from the kl tokens (hue 85, chroma <= 0.02). */
const TONES: Record<KleetoCubeTone, [string, string]> = {
  dark: ["oklch(0.62 0.02 85)", "oklch(0.78 0.016 85)"],
  mid: ["oklch(0.76 0.018 85)", "oklch(0.88 0.012 85)"],
  light: ["oklch(0.88 0.012 85)", "oklch(0.96 0.007 85)"],
  amber: ["var(--kl-amber)", "oklch(0.88 0.12 88)"],
};
const SIDE: [string, string] = ["oklch(0.93 0.009 85)", "oklch(0.975 0.006 85)"];
const LEFT_FACE = "oklch(0.955 0.008 85)";
const STROKE = "oklch(0.45 0.02 85)";

export function KleetoCubes({
  cubes,
  uid,
  className,
}: {
  cubes: readonly KleetoCubeSpec[];
  /** Namespaces the gradient ids so several clusters can coexist in one page. */
  uid: string;
  className?: string;
}) {
  const sorted = [...cubes].sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const cube of cubes) {
    const { px, py } = project(cube);
    minX = Math.min(minX, px - W);
    maxX = Math.max(maxX, px + W);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py + 2 * H + S);
  }
  const pad = 3;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  return (
    <svg viewBox={viewBox} className={cn("h-auto w-full", className)} aria-hidden="true" focusable="false">
      <defs>
        {(Object.keys(TONES) as KleetoCubeTone[]).map((tone) => (
          <linearGradient key={tone} id={`${uid}-${tone}`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" style={{ stopColor: TONES[tone][0] }} />
            <stop offset="100%" style={{ stopColor: TONES[tone][1] }} />
          </linearGradient>
        ))}
        <linearGradient id={`${uid}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: SIDE[0] }} />
          <stop offset="100%" style={{ stopColor: SIDE[1] }} />
        </linearGradient>
      </defs>
      {sorted.map((cube) => {
        const { px, py } = project(cube);
        const tone = cube.tone ?? "light";
        const top = `${px},${py} ${px + W},${py + H} ${px},${py + 2 * H} ${px - W},${py + H}`;
        const left = `${px - W},${py + H} ${px},${py + 2 * H} ${px},${py + 2 * H + S} ${px - W},${py + H + S}`;
        const right = `${px + W},${py + H} ${px},${py + 2 * H} ${px},${py + 2 * H + S} ${px + W},${py + H + S}`;
        return (
          <g
            key={`${cube.x}-${cube.y}-${cube.z}`}
            stroke={STROKE}
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeLinejoin="round"
          >
            <polygon points={left} fill={LEFT_FACE} />
            <polygon points={right} fill={`url(#${uid}-side)`} />
            <polygon points={top} fill={`url(#${uid}-${tone})`} />
          </g>
        );
      })}
    </svg>
  );
}

/* The single amber face lives in the left cluster; the right cluster is all grey. */
export const KLEETO_CUBES_LEFT: readonly KleetoCubeSpec[] = [
  { x: 0, y: 0, z: 2, tone: "amber" },
  { x: 1, y: 0, z: 1, tone: "mid" },
  { x: 0, y: 1, z: 1, tone: "dark" },
  { x: 1, y: 1, z: 1, tone: "light" },
  { x: 2, y: 1, z: 0, tone: "mid" },
  { x: 0, y: 2, z: 0, tone: "mid" },
  { x: 1, y: 2, z: 0, tone: "light" },
  { x: 2, y: 2, z: 0, tone: "light" },
  { x: 1, y: 3, z: 0, tone: "mid" },
];

export const KLEETO_CUBES_RIGHT: readonly KleetoCubeSpec[] = [
  { x: 1, y: 0, z: 2, tone: "dark" },
  { x: 2, y: 0, z: 1, tone: "light" },
  { x: 0, y: 1, z: 1, tone: "dark" },
  { x: 1, y: 1, z: 1, tone: "light" },
  { x: 2, y: 1, z: 1, tone: "mid" },
  { x: 1, y: 2, z: 0, tone: "mid" },
  { x: 2, y: 2, z: 0, tone: "light" },
  { x: 0, y: 2, z: 0, tone: "light" },
  { x: 1, y: 3, z: 0, tone: "light" },
  { x: 1, y: 3, z: -1, tone: "light" },
];
