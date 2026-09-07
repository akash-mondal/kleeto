import { BoxedWord, PillButton, Reveal } from "./kleeto-primitives";

export function KleetoCtaBand() {
  return (
    <section className="px-4 py-8 md:px-6 md:py-12">
      <Reveal>
        <div className="kl-card-deep relative mx-auto max-w-[1360px] overflow-hidden rounded-[40px] px-6 py-16 md:py-24">
          {/* Faint amber glow, bottom-right. ~8% at the core, gone by 70%. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -bottom-40 size-[640px] rounded-full bg-[radial-gradient(circle_at_center,oklch(0.8_0.165_85/0.08),transparent_70%)]"
          />
          <div className="relative flex flex-col items-center text-center">
            <h2 className="kl-display w-full text-[30px] leading-[1.12] font-medium text-kl-on-card md:text-[44px]">
              Fund it once. <BoxedWord tone="dark">It rents the rest</BoxedWord>.
            </h2>
            <p className="mt-5 w-full max-w-[52ch] text-[14px] leading-[1.6] text-kl-on-card-muted md:text-[15px]">
              Your agent holds its own HBAR or USDC on Hedera and answers each 402 itself. There is no Kleeto account, no API key and no card on file.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <PillButton href="#" tone="dark" className="w-full max-w-[280px] sm:w-auto">
                Rent a live desktop free
              </PillButton>
              <PillButton href="#" tone="dark" variant="ghost" className="w-full max-w-[280px] sm:w-auto">
                Watch one work
              </PillButton>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
