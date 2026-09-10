"use client";

import type { Tick } from "./use-meter";

/**
 * The meter, as a dial whose rim is the receipt.
 *
 * Sixty notches, one per second, one revolution per minute — but a notch is not decoration
 * standing in for a number: the gateway hash-chains every second it charges for, and each notch
 * here is one of those ticks. What is on the rim is exactly what is in the proof, which is the
 * one claim this product cannot afford to only assert.
 *
 * Drawn from the stream rather than animated on a timer. If the machine pauses because the
 * credit ran out, the rim stops where it stopped, because that is what happened.
 */
const R = 78;
const NOTCHES = 60;

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const human = (s: number) =>
  s >= 3600
    ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
    : s >= 60
      ? `${Math.floor(s / 60)}m ${s % 60}s`
      : `${s}s`;

export function MeterDial({
  tick,
  settled,
  usdPerHbar,
  asset,
}: {
  tick: Tick | null;
  /** The final total for a lease that has already been returned and stopped ticking. */
  settled: { seconds: number; tinybar: number; machines: number } | null;
  usdPerHbar: number | null;
  /** Whichever of the two the person chose on the bar. The bill is quoted in that. */
  asset: "usdc" | "hbar";
}) {
  const done = !tick?.seconds && settled ? settled : null;
  const seconds = done ? done.seconds : (tick?.seconds ?? 0);
  const lit = seconds % NOTCHES === 0 && seconds > 0 ? NOTCHES : seconds % NOTCHES;
  const minutes = Math.floor(seconds / NOTCHES);
  const paused = tick?.state === "paused";
  const hbarSpent = (done ? done.tinybar : (tick?.spentTinybar ?? 0)) / 1e8;
  const usd = usdPerHbar ? hbarSpent * usdPerHbar : null;
  /* The meter counts in tinybar because that is what a lane costs a second, but quoting HBAR at
     someone who chose to pay in USDC makes them do arithmetic to check their own bill. Both
     numbers are here; the one they picked is the one in front. */
  const inUsdc = asset === "usdc";

  return (
    <div className="flex h-full flex-col items-center justify-between px-5 pt-4 pb-4">
      <div className="relative">
        <svg viewBox="0 0 200 200" className="h-[168px] w-[168px]" role="img"
             aria-label={`${seconds} seconds charged`}>
          {Array.from({ length: NOTCHES }, (_, i) => {
            const on = i < lit;
            const a = (i * 6 - 90) * (Math.PI / 180);
            const inner = on ? R - 9 : R - 5;
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * inner}
                y1={100 + Math.sin(a) * inner}
                x2={100 + Math.cos(a) * R}
                y2={100 + Math.sin(a) * R}
                stroke={on ? "var(--kl-amber)" : "oklch(1 0 0 / 0.1)"}
                strokeWidth={on ? 2.4 : 1.2}
                strokeLinecap="round"
                opacity={on ? (paused ? 0.4 : i === lit - 1 ? 1 : 0.78) : 1}
              />
            );
          })}
          {/* the minute marks sit inside the second ring: four quarters, so a glance reads position */}
          {[0, 15, 30, 45].map((i) => {
            const a = (i * 6 - 90) * (Math.PI / 180);
            return (
              <circle key={i} cx={100 + Math.cos(a) * (R - 15)} cy={100 + Math.sin(a) * (R - 15)}
                      r="1.1" fill="oklch(1 0 0 / 0.16)" />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="kl-num text-[30px] leading-none font-medium text-white tabular-nums">
            {mmss(seconds)}
          </span>
          <span className="kl-num mt-1.5 text-[9.5px] tracking-[0.16em] text-white/30 uppercase">
            {done
              ? done.machines > 1 ? `across ${done.machines} machines` : "charged in total"
              : minutes > 0 ? `${minutes} min charged` : "charged"}
          </span>
        </div>
      </div>

      <dl className="mt-3 grid w-full grid-cols-2 gap-x-4 border-t border-white/[0.07] pt-3">
        <div>
          <dt className="kl-num text-[9.5px] tracking-[0.14em] text-white/25 uppercase">cost so far</dt>
          <dd className="kl-num mt-1 text-[13px] text-white/80 tabular-nums">
            {inUsdc && usd != null ? (
              <>
                {usd.toFixed(4)} <span className="text-white/35">USDC</span>
                <span className="ml-1.5 text-white/25">{hbarSpent.toFixed(4)} ℏ</span>
              </>
            ) : (
              <>
                {hbarSpent.toFixed(4)} <span className="text-white/35">HBAR</span>
                {usd != null ? <span className="ml-1.5 text-white/25">${usd.toFixed(4)}</span> : null}
              </>
            )}
          </dd>
        </div>
        <div>
          <dt className="kl-num text-[9.5px] tracking-[0.14em] text-white/25 uppercase">credit left</dt>
          <dd className="kl-num mt-1 text-[13px] text-white/80 tabular-nums">
            {done ? "returned" : tick ? human(tick.secondsRemaining) : "—"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 w-full text-[11px] leading-[1.5] text-white/25">
        {paused ? (
          <span className="text-[var(--kl-amber)]/80">
            Out of credit. The machine is paused, not lost — the agent can top up and carry on.
          </span>
        ) : done ? (
          <>
            {done.machines > 1 ? "Every machine is back" : "The machine is back"} and the meter has
            stopped. Every one of these {done.seconds} seconds is a line in the receipt.
          </>
        ) : tick?.chainHead ? (
          <>
            One notch is one charged second and one line in the receipt.{" "}
            <span className="kl-num text-white/30">{tick.chainHead.slice(0, 12)}…</span>
          </>
        ) : (
          "No machine yet. The dial starts the second one comes up, and a notch is added for every second it is charged."
        )}
      </p>
    </div>
  );
}
