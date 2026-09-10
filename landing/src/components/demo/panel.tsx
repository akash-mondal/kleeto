import type { ReactNode } from "react";

/**
 * The three surfaces of the workspace.
 *
 * One container shape, used three times, so the eye reads them as one instrument rather than
 * three widgets: same ground, same hairline, same small caps label along the top. Everything
 * inside a panel is flat — rows and rules, no cards within cards.
 */
export function Panel({
  label,
  aside,
  children,
  className = "",
  bodyClassName = "",
}: {
  label: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[oklch(0.145_0.008_85/0.88)] backdrop-blur-xl ${className}`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5">
        <h2 className="kl-num text-[10px] tracking-[0.16em] text-white/35 uppercase">{label}</h2>
        {aside}
      </header>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
