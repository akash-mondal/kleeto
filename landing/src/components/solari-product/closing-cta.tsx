import { SolariButton, SolariButtonSecondary } from "./buttons";

/**
 * Repeated hero at the foot of every product page. The live site sits this on a
 * photographic planet horizon; here the horizon is drawn with layered gradients.
 */
export function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-black">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_118%,#f5b301_0%,#b6741a_22%,#4a3312_42%,#150e07_62%,#050505_80%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[radial-gradient(90%_60%_at_50%_100%,rgba(245,179,1,0.35)_0%,rgba(9,9,9,0)_70%)] blur-2xl"
      />
      <div className="mx-auto flex max-w-[1200px] flex-col items-center px-6 py-24 text-center md:py-[150px]">
        <h2 className="text-[34px] leading-[1.08] font-normal tracking-[-0.03em] text-white md:text-[44px]">
          The Fastest Agent
          <span className="block text-sol-accent">Infrastructure</span>
        </h2>
        <p className="mt-4 text-[14px] text-[#e7e7e2]">Get started today on Solari</p>
        <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <SolariButton href="#start" className="w-full sm:w-[204px]">
            Start for Free
          </SolariButton>
          <SolariButtonSecondary href="#contact" className="w-full sm:w-[204px]">
            Contact Sales
          </SolariButtonSecondary>
        </div>
      </div>
    </section>
  );
}
