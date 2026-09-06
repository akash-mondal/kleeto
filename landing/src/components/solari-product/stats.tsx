import { cn } from "@/lib/utils";

import { CountUp } from "./count-up";

export type StatItem = {
  value: string;
  label: string;
  detail: string;
};

/**
 * The benchmark stat row — big amber figures with a white caption and a grey
 * detail line, split by hairline dividers. The figures count up from zero the
 * first time they scroll into view (see `CountUp`).
 */
export function StatRow({ items, className }: { items: readonly StatItem[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 md:divide-x",
        items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.value} className="flex flex-col items-center gap-2 px-6 py-8 text-center">
          <p className="text-[32px] leading-none font-normal text-sol-accent md:text-[36px]">
            <CountUp value={item.value} />
          </p>
          <p className="text-[15px] leading-[1.35] text-white md:text-[16px]">{item.label}</p>
          <p className="max-w-[220px] text-[12px] leading-[1.5] text-sol-muted">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}
