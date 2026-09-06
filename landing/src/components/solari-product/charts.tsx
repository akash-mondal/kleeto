import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ChartBar = {
  label: string;
  /** Numeric value used for the bar length. */
  value: number;
  /** Rendered value caption, e.g. `199ms` or `8.2s`. */
  display: string;
};

function ChartFrame({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-[4px] border border-white/10 bg-[var(--sol-bg,#000)] px-5 py-6 md:px-8 md:py-8", className)}>
      <p className="font-mono text-[11px] tracking-[0.2em] text-sol-accent uppercase">{title}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

/** Browsers benchmark: column chart with a gridded y-axis, winner column in amber. */
export function ColumnChart({
  title,
  bars,
  axis,
  max,
}: {
  title: string;
  bars: readonly ChartBar[];
  axis: readonly string[];
  max: number;
}) {
  return (
    <ChartFrame title={title}>
      <div className="flex gap-3">
        <div className="flex h-[260px] flex-col justify-between py-0 text-right md:h-[300px]">
          {axis.map((tick) => (
            <span key={tick} className="text-[10px] leading-none text-sol-muted md:text-[11px]">
              {tick}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0 flex flex-col justify-between">
            {axis.map((tick) => (
              <div key={tick} className="h-px w-full bg-white/[0.07]" />
            ))}
          </div>
          <div className="relative flex h-[260px] items-end gap-3 md:h-[300px] md:gap-6">
            {bars.map((bar, index) => (
              <div key={bar.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <span className="mb-1.5 truncate text-center text-[9px] text-[#e7e7e2] md:text-[11px]">
                  {bar.display}
                </span>
                <div
                  className={cn(
                    "mx-auto w-full max-w-[72px]",
                    index === 0 ? "bg-sol-accent" : "bg-[#929292]",
                  )}
                  style={{ height: `${Math.max((bar.value / max) * 100, 0.9)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 md:gap-6">
            {bars.map((bar) => (
              <span
                key={bar.label}
                className="min-w-0 flex-1 text-center text-[9px] leading-[1.3] break-words text-[#e7e7e2] md:text-[12px]"
              >
                {bar.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}

/** Sandboxes benchmark: horizontal track chart, winner track in amber. */
export function TrackChart({ title, bars, max }: { title: string; bars: readonly ChartBar[]; max: number }) {
  return (
    <ChartFrame title={title}>
      <div className="flex flex-col gap-4">
        {bars.map((bar, index) => (
          <div key={bar.label} className="flex items-center gap-3 md:gap-5">
            <span className="w-[86px] shrink-0 text-right text-[11px] text-[#e7e7e2] md:w-[110px] md:text-[13px]">
              {bar.label}
            </span>
            <div className="h-[18px] flex-1 bg-white/[0.06]">
              <div
                className={cn("h-full", index === 0 ? "bg-sol-accent" : "bg-[#929292]")}
                style={{ width: `${(bar.value / max) * 100}%` }}
              />
            </div>
            <span
              className={cn(
                "w-[52px] shrink-0 font-mono text-[11px] md:text-[12px]",
                index === 0 ? "text-sol-accent" : "text-sol-muted",
              )}
            >
              {bar.display}
            </span>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
