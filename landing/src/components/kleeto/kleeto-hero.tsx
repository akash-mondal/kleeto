import { HeroFilm } from "./hero-film";
import { InstallCommand } from "./install-command";
import { KLEETO_CUBES_LEFT, KLEETO_CUBES_RIGHT, KleetoCubes } from "./kleeto-cubes";
import { BoxedWord, Container, PillButton, Reveal } from "./kleeto-primitives";

/**
 * Product-forward hero. The headline names the machine, not the rail, and the
 * film sits inside the hero rather than in a section of its own, the first
 * thing on the page is an agent actually working.
 *
 * The cube clusters flank the headline and stop above the film, so they frame
 * the copy without competing with the moving image below them. They are
 * desktop-only: at narrow widths the film is the whole hero.
 */

export function KleetoHero() {
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-16 md:px-6 md:pt-20 md:pb-24">
      {/* Flanking cubes, desktop only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-20 -left-28 hidden w-[260px] lg:block lg:w-[300px] xl:-left-14"
      >
        <KleetoCubes cubes={KLEETO_CUBES_LEFT} uid="kl-hero-l" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-16 -right-28 hidden w-[280px] lg:block lg:w-[320px] xl:-right-14"
      >
        <KleetoCubes cubes={KLEETO_CUBES_RIGHT} uid="kl-hero-r" />
      </div>

      <div className="relative mx-auto flex max-w-[760px] flex-col items-center text-center">
        <Reveal className="w-full" delayMs={0}>
          <h1 className="kl-display w-full text-[40px] leading-[1.12] font-medium text-kl-fg md:text-[60px] md:leading-[1.06]">
            <span className="block">
              Your agent&rsquo;s own <BoxedWord>live desktop.</BoxedWord>
            </span>
            <span className="block">Paid by the second.</span>
          </h1>
        </Reveal>

        <Reveal className="w-full" delayMs={80} y={15.6}>
          <p className="mx-auto mt-6 w-full max-w-[52ch] text-[15px] leading-[1.6] text-kl-muted md:mt-7 md:text-[16px]">
            It answers a <strong className="font-medium text-kl-fg">402</strong>, gets a real{" "}
            <strong className="font-medium text-kl-fg">desktop</strong> to open applications on and a{" "}
            <strong className="font-medium text-kl-fg">browser</strong> that gets through the blockers, and pays in{" "}
            <strong className="font-medium text-kl-fg">HBAR or USDC on Hedera</strong> from its own account.
            No signup, no API key, no card.
          </p>
        </Reveal>

        <Reveal className="w-full" delayMs={160} y={15.6}>
          <div className="mt-9 flex flex-col items-center gap-5">
            <InstallCommand />
            <PillButton href="/demo" className="w-full max-w-[280px] sm:w-auto">
              Try the demo
            </PillButton>
          </div>
        </Reveal>
      </div>

      {/* The film, wider than the copy column, directly under the fold line. */}
      <Container className="relative mt-12 max-w-[1120px] md:mt-16">
        <Reveal delayMs={240}>
          <HeroFilm />
        </Reveal>

      </Container>
    </section>
  );
}
