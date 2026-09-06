import { BoxedWord } from "./runloop-primitives";

export function RunloopCtaBand() {
  return (
    <section className="px-4 py-8 md:px-6 md:py-12">
      <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-[linear-gradient(120deg,var(--rl-band-a)_0%,var(--rl-band-b)_55%,var(--rl-band-c)_100%)] px-6 py-16 [--rl-band-a:#0b1618] [--rl-band-b:#091315] [--rl-band-c:#141b1c] md:rounded-[40px] md:py-24">
        {/* Faint diamond lattice, bottom-right, matching the original band art. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-24 size-[420px] rotate-45 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]"
        />
        <div className="relative flex flex-col items-center text-center">
          <h2 className="w-full text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-white md:text-[40px]">
            Get Started for <BoxedWord tone="dark">Free</BoxedWord>
          </h2>
          <p className="mt-4 w-full max-w-[52ch] text-[13px] leading-[1.6] text-white/70 md:text-[14px]">
            Receive $50 in credits to accelerate your AI software engineering
            process
          </p>
          <a
            href="#"
            className="mt-8 inline-flex items-center justify-center rounded-[390px] bg-white px-7 py-3 text-[13px] leading-none font-medium text-run-fg transition-opacity hover:opacity-90"
          >
            Get Started for Free
          </a>
        </div>
      </div>
    </section>
  );
}
