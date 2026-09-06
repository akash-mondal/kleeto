import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { MockBar, MockChrome } from "./feature-card";

export function MockFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-[4px] border border-white/10 bg-[var(--sol-bg,#000)]", className)}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span
      className={cn(
        "font-mono text-[8px] tracking-[0.16em] uppercase",
        tone === "accent" ? "text-sol-accent" : "text-sol-muted",
      )}
    >
      {children}
    </span>
  );
}

/** Log / telemetry stream mock: a tagged line, a message and a timestamp. */
export function StreamMock({
  label,
  badge,
  rows,
  className,
}: {
  label: string;
  badge: string;
  rows: readonly { tag: string; text: string; meta: string }[];
  className?: string;
}) {
  return (
    <MockFrame className={className}>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
        <Badge tone="muted">{label}</Badge>
        <Badge>{badge}</Badge>
      </div>
      <div className="flex flex-col divide-y divide-white/[0.06]">
        {rows.map((row) => (
          <div key={row.text} className="flex items-center gap-3 px-3 py-2">
            <Badge>{row.tag}</Badge>
            <span className="flex-1 truncate font-mono text-[9px] text-[#bbc7c6]">{row.text}</span>
            <span className="font-mono text-[8px] text-sol-muted">{row.meta}</span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

/** Metric readout mock: a headline figure and a small key/value grid. */
export function MetricMock({
  label,
  headline,
  unit,
  metrics,
  footer,
  className,
}: {
  label: string;
  headline: string;
  unit: string;
  metrics: readonly { label: string; value: string }[];
  footer?: string;
  className?: string;
}) {
  return (
    <MockFrame className={className}>
      <div className="border-b border-white/10 bg-white/[0.02] px-3 py-2">
        <Badge tone="muted">{label}</Badge>
      </div>
      <div className="flex items-end gap-1 px-3 pt-4">
        <span className="text-[34px] leading-none text-sol-accent">{headline}</span>
        <span className="pb-1 font-mono text-[9px] tracking-[0.16em] text-sol-muted uppercase">{unit}</span>
      </div>
      <div className="mt-4 flex flex-col gap-2 px-3 pb-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between">
            <Badge tone="muted">{metric.label}</Badge>
            <span className="font-mono text-[9px] text-[#bbc7c6]">{metric.value}</span>
          </div>
        ))}
      </div>
      {footer ? (
        <div className="border-t border-white/10 px-3 py-2">
          <Badge tone="muted">{footer}</Badge>
        </div>
      ) : null}
    </MockFrame>
  );
}

/** Grid-of-tiles mock, used for sessions, SDK connections and file lists. */
export function TileMock({
  label,
  badge,
  tiles,
  columns = 2,
  footer,
  className,
}: {
  label: string;
  badge?: string;
  tiles: readonly string[];
  columns?: 2 | 4;
  footer?: string;
  className?: string;
}) {
  return (
    <MockFrame className={className}>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-3 py-2">
        <Badge tone="muted">{label}</Badge>
        {badge ? <Badge>{badge}</Badge> : null}
      </div>
      <div className={cn("grid gap-2 p-3", columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
        {tiles.map((tile) => (
          <span
            key={tile}
            className="rounded-[2px] border border-white/10 bg-white/[0.03] px-2 py-2 text-center font-mono text-[8px] tracking-[0.12em] text-[#bbc7c6] uppercase"
          >
            {tile}
          </span>
        ))}
      </div>
      {footer ? (
        <div className="border-t border-white/10 px-3 py-2 text-center">
          <Badge>{footer}</Badge>
        </div>
      ) : null}
    </MockFrame>
  );
}

/** Browser-window mock with a URL bar and sketched page content. */
export function WindowMock({
  url,
  badge,
  className,
  children,
}: {
  url: string;
  badge?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <MockFrame className={className}>
      <MockChrome label={url} right={badge ? <Badge>{badge}</Badge> : null} />
      {children ?? (
        <div className="flex flex-col gap-3 p-4">
          <MockBar className="w-1/3" />
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2 rounded-[2px] border border-white/10 p-2">
                <MockBar className="w-3/4" />
                <MockBar className="w-1/2" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 rounded-[2px] border border-white/10 p-3">
            <MockBar className="w-5/6" />
            <MockBar className="w-2/3" />
            <MockBar className="w-1/2" />
          </div>
        </div>
      )}
    </MockFrame>
  );
}
