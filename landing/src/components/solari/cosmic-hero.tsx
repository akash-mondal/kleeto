import Image from "next/image";

import { cn } from "@/lib/utils";

import { SolidButton } from "./primitives";
import { Reveal } from "./reveal";

type HeroCta = { label: string; href: string };

/** The planet-limb render the original ships as its hero and closing-band backdrop. */
const HERO_IMAGE = {
  src: "/images/solari/PESnCfk76fJOkT46TF4E0W0lbJs-0bc6a2.png",
  width: 1445,
  height: 1088,
} as const;

/**
 * Cosmic horizon hero. The photographic planet limb is the real asset; the
 * stacked gradients that remain only bed it into the near-black page — they
 * darken the strip under the nav and fade the bottom edge into `--sol-bg`.
 */
export function CosmicHero({
  subcopy,
  ctas,
  priority = false,
  className,
}: {
  subcopy: string;
  ctas: readonly [HeroCta, HeroCta];
  /** Set on the above-the-fold hero only. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-[#050505]", className)}>
      <Image
        src={HERO_IMAGE.src}
        alt=""
        width={HERO_IMAGE.width}
        height={HERO_IMAGE.height}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes="100vw"
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 size-full object-cover object-[50%_38%] select-none"
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* darken toward the nav, then fade the limb into the page background */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,rgba(5,5,5,0.55)_14%,rgba(5,5,5,0)_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_62%,rgba(5,5,5,0.55)_84%,var(--sol-bg)_100%)]" />
        {/* keeps the headline legible where it crosses the bright rim */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_46%,rgba(5,5,5,0.42)_0%,transparent_72%)]" />
      </div>

      <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-6 py-28 text-center md:py-40">
        <Reveal variant="heading">
          <h1 className="text-[40px] leading-[1.12] font-normal tracking-[-0.02em] text-white sm:text-[52px] md:text-[64px]">
            The Fastest Agent
            <br />
            <span className="text-sol-accent">Infrastructure</span>
          </h1>
        </Reveal>
        <Reveal variant="body" delay={70}>
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.5] text-[#dcdde0] md:text-[17px]">
            {subcopy}
          </p>
        </Reveal>
        <Reveal variant="body" delay={140} className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
          {ctas.map((cta) => (
            <SolidButton key={cta.label} href={cta.href}>
              {cta.label}
            </SolidButton>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
