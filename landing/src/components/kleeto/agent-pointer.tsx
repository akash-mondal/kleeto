import { cn } from "@/lib/utils";

/**
 * The agent's pointer, drawn over a still.
 *
 * The guest's screenshots do not composite the X cursor, so a still of a lease shows the
 * work but not the hand doing it, and reads as a person's screenshot. This marks where the
 * pointer actually was when the frame was taken: `x` and `y` are the coordinates the shoot
 * script logged, in the capture's own 1280x720 space. Same shape and amber tag as the
 * pointer in the hero film, so the two read as one agent.
 */
export function AgentPointer({
  x,
  y,
  label = "agent",
  className,
}: {
  x: number;
  y: number;
  label?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute flex items-start gap-1.5", className)}
      style={{ left: `${(x / 1280) * 100}%`, top: `${(y / 720) * 100}%` }}
    >
      <svg viewBox="0 0 12 18" width="13" height="19" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
        <path
          d="M1 1 L1 15 L4.5 11.6 L7 17 L9.4 15.9 L6.9 10.8 L11 10.6 Z"
          fill="#171310"
          stroke="var(--kl-amber)"
          strokeWidth="1.2"
        />
      </svg>
      <b className="kl-num translate-y-[9px] rounded-[5px] bg-[var(--kl-amber)] px-1.5 py-[3px] text-[10px] leading-none font-medium tracking-[0.06em] text-[#171310]">
        {label}
      </b>
    </span>
  );
}
