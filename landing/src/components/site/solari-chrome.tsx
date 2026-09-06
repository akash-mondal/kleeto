import Link from "next/link";

const NAV = [
  { label: "ABOUT", href: "#about" },
  { label: "PRODUCT", href: "#product" },
  { label: "PRICING", href: "#pricing" },
  { label: "RESOURCES", href: "#resources" },
  { label: "DOCS", href: "#docs" },
];

export function SolariNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[var(--sol-bg)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-white">
          <span className="inline-block size-4 rotate-45 rounded-[2px] bg-[var(--sol-accent)]" />
          SOLARI
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-[11px] tracking-[0.14em] text-[var(--sol-muted)] transition-colors hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SolariFooter() {
  const cols = [
    { head: "Product", items: ["Browsers", "Sandboxes", "Desktops", "Pricing"] },
    { head: "Use Cases", items: ["Blog", "Docs", "Changelog"] },
    { head: "Contact", items: ["Careers", "Terms & Condition", "Privacy Policy"] },
  ];
  return (
    <footer className="border-t border-white/5 bg-[var(--sol-bg)] px-6 py-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-white">
            <span className="inline-block size-4 rotate-45 rounded-[2px] bg-[var(--sol-accent)]" />
            SOLARI
          </div>
          <p className="mt-3 text-xs text-[var(--sol-muted)]">The Fastest AI Infrastructure</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.head}>
              <p className="mb-3 text-[11px] tracking-[0.14em] text-white">{c.head}</p>
              <ul className="space-y-2">
                {c.items.map((i) => (
                  <li key={i} className="text-xs text-[var(--sol-muted)]">{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
