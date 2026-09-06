import { cn } from "@/lib/utils";

/**
 * Isometric cube clusters that flank the hero.
 *
 * The originals are hosted raster/vector artwork; this is a CSS/SVG rebuild.
 * Cubes live on an integer 3D lattice and are projected with a 2:1 isometric
 * transform, then painted back-to-front (ascending x + y + z) so the stack
 * occludes correctly without any z-buffer.
 */
export type CubeTone = "dark" | "mid" | "light";

export interface CubeSpec {
  x: number;
  y: number;
  z: number;
  tone?: CubeTone;
}

const W = 55; // half width of the top rhombus
const H = 32; // half depth of the top rhombus
const S = 64; // vertical side height

function project(c: CubeSpec) {
  return { px: (c.x - c.y) * W, py: (c.x + c.y) * H - c.z * S };
}

export function IsoCubes({
  cubes,
  uid,
  className,
}: {
  cubes: readonly CubeSpec[];
  /** Namespaces the gradient ids so several clusters can coexist in one page. */
  uid: string;
  className?: string;
}) {
  const sorted = [...cubes].sort(
    (a, b) => a.x + a.y + a.z - (b.x + b.y + b.z),
  );

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
    <svg
      viewBox={viewBox}
      className={cn("h-auto w-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-dark`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#2f6d55" />
          <stop offset="100%" stopColor="#7fae9b" />
        </linearGradient>
        <linearGradient id={`${uid}-mid`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#6ba28c" />
          <stop offset="100%" stopColor="#b9d5c8" />
        </linearGradient>
        <linearGradient id={`${uid}-light`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#cfe3d9" />
          <stop offset="100%" stopColor="#eef6f2" />
        </linearGradient>
        <linearGradient id={`${uid}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf3ee" />
          <stop offset="100%" stopColor="#f7fbf9" />
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
            stroke="#0e694e"
            strokeOpacity={0.45}
            strokeWidth={1}
            strokeLinejoin="round"
          >
            <polygon points={left} fill="#f4faf7" />
            <polygon points={right} fill={`url(#${uid}-side)`} />
            <polygon points={top} fill={`url(#${uid}-${tone})`} />
          </g>
        );
      })}
    </svg>
  );
}

export const HERO_CUBES_LEFT: readonly CubeSpec[] = [
  { x: 0, y: 0, z: 2, tone: "dark" },
  { x: 1, y: 0, z: 1, tone: "mid" },
  { x: 0, y: 1, z: 1, tone: "dark" },
  { x: 1, y: 1, z: 1, tone: "light" },
  { x: 2, y: 1, z: 0, tone: "mid" },
  { x: 0, y: 2, z: 0, tone: "mid" },
  { x: 1, y: 2, z: 0, tone: "light" },
  { x: 2, y: 2, z: 0, tone: "light" },
  { x: 1, y: 3, z: 0, tone: "mid" },
];

export const HERO_CUBES_RIGHT: readonly CubeSpec[] = [
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
