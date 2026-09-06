import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The card shape used by every feature grid on the product pages: an eyebrow
 * or icon row, a title, a description, and an optional mock UI illustration.
 * `accentEdge` draws the amber bottom rule the live cards use.
 */
export function FeatureCard({
  eyebrow,
  icon: Icon,
  title,
  description,
  visual,
  visualPosition = "bottom",
  accentEdge = false,
  className,
}: {
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
  description: string;
  visual?: ReactNode;
  visualPosition?: "top" | "bottom";
  accentEdge?: boolean;
  className?: string;
}) {
  const header = (
    <div className="flex flex-col gap-2">
      {Icon ? (
        <span className="flex items-center gap-2 text-[13px] text-white">
          <Icon className="size-4 text-white" />
          {eyebrow}
        </span>
      ) : eyebrow ? (
        <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.18em] text-sol-accent uppercase">
          <span aria-hidden className="inline-block size-[4px] bg-sol-accent" />
          {eyebrow}
        </span>
      ) : null}
    </div>
  );

  const body = (
    <div className="flex flex-col gap-2">
      <h3 className="text-[15px] leading-[1.35] font-semibold text-white">{title}</h3>
      <p className="text-[13px] leading-[1.55] text-sol-muted">{description}</p>
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-[4px] border border-white/10 bg-sol-panel p-5",
        accentEdge && "border-b-2 border-b-sol-accent",
        className,
      )}
    >
      {visualPosition === "top" ? (
        <>
          {header}
          {visual}
          {body}
        </>
      ) : (
        <>
          {header}
          {body}
          {visual}
        </>
      )}
    </div>
  );
}

/** Thin chrome bar with the three traffic-light dots, used inside mock panels. */
export function MockChrome({ label, right }: { label?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-3 py-2">
      <span className="flex gap-1">
        <span className="size-[6px] rounded-full bg-[#ff5f57]" />
        <span className="size-[6px] rounded-full bg-[#febc2e]" />
        <span className="size-[6px] rounded-full bg-[#28c840]" />
      </span>
      {label ? (
        <span className="font-mono text-[9px] tracking-[0.1em] text-sol-muted">{label}</span>
      ) : null}
      {right ? <span className="ml-auto">{right}</span> : null}
    </div>
  );
}

/** Neutral placeholder bar used to sketch text inside mock UI. */
export function MockBar({ className }: { className?: string }) {
  return <span className={cn("block h-[5px] rounded-[2px] bg-white/15", className)} />;
}
