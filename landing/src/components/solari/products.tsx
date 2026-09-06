import Image from "next/image";

import { Container, Eyebrow, OutlineButton, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

/** The Solari planet mark that terminates the converging lines under the grid. */
const MARK = "/images/solari/XF0ZRq7F38Y816sayxAlMauV9oo-368ea7.png";

type Shot = { src: string; width: number; height: number };

type Product = {
  title: string;
  shot: Shot;
  description: string;
  cta: string;
  href: string;
  spec: string;
};

const PRODUCTS: readonly Product[] = [
  {
    title: "Cloud Browsers",
    shot: {
      src: "/images/solari/oBWhb7u7ji1jZgi87UzkOoXbU-ccbeff.png",
      width: 3220,
      height: 1952,
    },
    description: "For agents that need to browse, authenticate, scrape, and interact with the web.",
    cta: "Explore Browsers",
    href: "/browsers",
    spec: "8ms to spin up",
  },
  {
    title: "AI Sandboxes",
    shot: {
      src: "/images/solari/nRb52prtWCX7XCOgtQnC7dCg6o-81301c.png",
      width: 3220,
      height: 1952,
    },
    description:
      "For agents that need isolated compute to run code, execute tools, and process workloads.",
    cta: "Explore Sandboxes",
    href: "/sandboxes",
    spec: "90ms to spin up",
  },
  {
    title: "Computer Desktops",
    shot: {
      src: "/images/solari/nB1ZnpjqzXT0VkNx5UDqxMFGNv0-9fa43f.png",
      width: 3220,
      height: 1950,
    },
    description:
      "For agents that need to control applications, navigate full operating systems, and complete complex computer workflows.",
    cta: "Explore Desktops",
    href: "/desktops",
    spec: "0.78ms to resume",
  },
];

export function Products() {
  return (
    <section id="product" className="bg-sol-bg py-20 md:py-[120px]">
      <Container>
        <Reveal variant="heading">
          <Eyebrow>Products</Eyebrow>
          <SectionHeading
            className="mt-5"
            lead="One platform."
            highlight="Everything AI agents need to execute"
          />
        </Reveal>
        <Reveal variant="body" delay={70}>
          <p className="mt-4 text-[15px] leading-[1.55] text-white md:text-[16px]">
            Give every agent the environment it needs without stitching together separate
            infrastructure.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 border border-white/10 md:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <Reveal
              key={p.title}
              as="article"
              variant="media"
              delay={i * 80}
              className={`flex flex-col gap-6 p-6 ${
                i > 0 ? "border-t border-white/10 md:border-t-0 md:border-l" : ""
              }`}
            >
              <h3 className="text-[16px] font-medium text-white">{p.title}</h3>
              <Image
                src={p.shot.src}
                alt={`${p.title} interface`}
                width={p.shot.width}
                height={p.shot.height}
                sizes="(min-width: 1024px) 340px, (min-width: 768px) 30vw, 90vw"
                className="w-full rounded-[3px] border border-white/10 bg-[#0b0d12]"
              />
              <p className="text-[13px] leading-[1.45] text-sol-muted">{p.description}</p>
              <div className="mt-auto flex flex-col items-start gap-4">
                <OutlineButton href={p.href}>{p.cta}</OutlineButton>
                <p className="text-[13px] text-white">{p.spec}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* converging lines into the mark, as on the original */}
        <div aria-hidden className="relative mx-auto mt-0 h-[150px] w-full max-w-[780px]">
          <div className="absolute inset-x-[14%] top-0 h-[62px] border-r border-l border-white/10" />
          <div className="absolute inset-x-[14%] top-[62px] border-t border-white/10" />
          <div className="absolute top-[62px] left-1/2 h-[52px] border-l border-white/10" />
          <span className="absolute top-[114px] left-1/2 flex size-9 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-[#17171d]">
            <Image src={MARK} alt="" width={2000} height={2000} sizes="24px" className="size-6" />
          </span>
        </div>

        <Reveal variant="body">
          <p className="mx-auto mt-10 max-w-[900px] text-center text-[16px] leading-[1.55] text-white md:text-[17px]">
            Every Solari environment is built for speed and reliability. Browsers launch in
            milliseconds. Sandboxes and Desktops run on isolated compute and restore from memory
            snapshots in under a second. Choose the environment that fits your workload.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
