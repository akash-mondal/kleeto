import { HERO_CUBES_LEFT, HERO_CUBES_RIGHT, IsoCubes } from "./iso-cubes";
import { BoxedWord } from "./runloop-primitives";

export function RunloopHero() {
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-16 md:px-6 md:pt-24 md:pb-32">
      {/* Desktop: cube clusters flank the headline. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-2 -left-24 hidden w-[300px] lg:block lg:w-[340px] xl:-left-12"
      >
        <IsoCubes cubes={HERO_CUBES_LEFT} uid="rl-hero-l" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -right-24 hidden w-[330px] lg:block lg:w-[400px] xl:-right-10"
      >
        <IsoCubes cubes={HERO_CUBES_RIGHT} uid="rl-hero-r" />
      </div>

      <div className="relative mx-auto flex max-w-[720px] flex-col items-center text-center">
        <h1 className="w-full text-[38px] leading-[1.16] font-medium tracking-[-0.025em] text-run-fg md:text-[56px] md:leading-[1.1]">
          Your AI Agent <BoxedWord>Accelerator</BoxedWord>
        </h1>
        <p className="mt-6 w-full max-w-[46ch] text-[14px] leading-[1.6] text-run-muted md:mt-7 md:max-w-[520px] md:text-[15px]">
          Launch AI agents on secure code sandboxes, refine with evaluations,
          and ship on AI infrastructure built for enterprise scale
        </p>

        {/* Mobile / tablet: the same clusters stack under the copy. */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-8 flex w-full items-start justify-between gap-4 lg:hidden"
        >
          <IsoCubes cubes={HERO_CUBES_LEFT} uid="rl-hero-ml" className="w-[38%]" />
          <IsoCubes cubes={HERO_CUBES_RIGHT} uid="rl-hero-mr" className="w-[40%]" />
        </div>

        <a
          href="#"
          className="mt-10 inline-flex w-full max-w-[300px] items-center justify-center rounded-[390px] bg-run-card-deep px-8 py-3.5 text-[13px] leading-none font-medium text-white transition-opacity hover:opacity-90"
        >
          Get Started for Free
        </a>
        <p className="mt-4 text-[13px] text-run-muted">
          Receive $50 in credits to accelerate your AI software engineering
        </p>
      </div>
    </section>
  );
}
