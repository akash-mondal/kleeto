import { Container, Eyebrow, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

export function IntroBand() {
  return (
    <section className="bg-sol-bg py-20 md:py-[120px]">
      <Container>
        <Reveal variant="heading">
          <Eyebrow>Introduction</Eyebrow>
          <SectionHeading
            className="mt-5 max-w-[900px]"
            lead="AI agents need"
            highlight="secure environments that scale"
          />
        </Reveal>
        <Reveal variant="body" delay={70}>
          <p className="mt-5 max-w-[840px] text-[15px] leading-[1.55] text-white md:text-[16px]">
            Every task needs an isolated place to browse the web, run code, or operate software. As
            demand grows, those environments must start fast, stay contained, and run in parallel.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
