import { Container } from "./kleeto-primitives";
import { KleetoLockup } from "./kleeto-logo";

/**
 * The footer sits as an inset dark card rather than a full-bleed band, so the warm ground
 * still frames it and the page ends on a deliberate edge instead of running off the screen.
 */
const COLUMNS: readonly { title: string; links: readonly { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Desktop", href: "#desktop" },
      { label: "Browser", href: "#browser" },
      { label: "Lanes", href: "#lanes" },
      { label: "Billing", href: "#meter" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", href: "#" },
      { label: "Receipts", href: "#receipt" },
      { label: "Verify a receipt", href: "#receipt" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "x402 on Hedera", href: "#x402" },
    ],
  },
];

const SOCIALS: readonly { label: string; href: string; path: string }[] = [
  {
    label: "GitHub",
    href: "#",
    path: "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z",
  },
  {
    label: "X",
    href: "#",
    path: "M17.53 3H20l-5.46 6.24L21 21h-5.06l-3.96-5.18L7.44 21H4.97l5.84-6.68L3.5 3h5.19l3.58 4.73L17.53 3Zm-.87 16.5h1.37L8.4 4.42H6.93L16.66 19.5Z",
  },
];

export function KleetoFooter() {
  return (
    <footer className="kl-section pb-6">
      <Container>
        <div className="overflow-hidden rounded-[28px] bg-[var(--kl-card-deep)] px-6 py-10 md:px-10 md:py-12">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
            <div className="max-w-[34ch]">
              <KleetoLockup className="text-kl-on-card" href="#top" />
              <p className="mt-5 text-[14px] leading-[1.6] text-kl-on-card-muted">
                A real computer your agent rents by the second and pays for itself, in USDC on
                Hedera.
              </p>
              <div className="mt-6 flex items-center gap-2.5">
                {SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-[10px] border border-white/10 text-kl-on-card-muted transition-colors hover:border-white/25 hover:text-kl-on-card"
                  >
                    <svg viewBox="0 0 24 24" className="size-[17px]" fill="currentColor" aria-hidden>
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-3 sm:gap-14">
              {COLUMNS.map((column) => (
                <div key={column.title}>
                  <p className="kl-num text-[11px] tracking-[0.16em] text-kl-on-card-muted uppercase">
                    {column.title}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-[14px] text-kl-on-card transition-colors hover:text-kl-amber"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-kl-on-card-muted md:flex-row md:items-center md:justify-between">
            <span>&copy; 2026 Kleeto</span>
            <span className="kl-num tracking-[0.02em]">
              x402 · USDC · hedera:testnet
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
