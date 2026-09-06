import { SolariFooter, SolariNav } from "@/components/site/solari-chrome";
import {
  CodeTabs,
  CosmicHero,
  Faq,
  IntroBand,
  Performance,
  Products,
  UseCases,
} from "@/components/solari";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-sol-bg font-sans">
      <SolariNav />
      <main className="flex-1">
        <CosmicHero
          priority
          subcopy="Browsers, sandboxes, and desktops. Solari provides the full infrastructure layer for AI agents, all from one API."
          ctas={[
            { label: "Start for Free", href: "/signup" },
            { label: "View Docs", href: "/docs" },
          ]}
        />
        <IntroBand />
        <Products />
        <Performance />
        <CodeTabs />
        <UseCases />
        <Faq />
        <CosmicHero
          subcopy="Get started today on Solari"
          ctas={[
            { label: "Start for Free", href: "/signup" },
            { label: "Contact Sales", href: "/contact" },
          ]}
        />
      </main>
      <SolariFooter />
    </div>
  );
}
