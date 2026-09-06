import Image from "next/image";

import { cn } from "@/lib/utils";

export type ProductShotAsset = {
  src: string;
  width: number;
  height: number;
};

/**
 * The real artwork downloaded from getsolari.com (see docs/research/ASSETS.md).
 * Intrinsic dimensions are recorded here so `next/image` can reserve space and
 * emit a correct srcset — nothing is ever shipped at its full source size.
 */
export const SOLARI_SHOTS = {
  /** Planet horizon behind the closing CTA. Shared with the home page. */
  planet: {
    src: "/images/solari/PESnCfk76fJOkT46TF4E0W0lbJs-0bc6a2.png",
    width: 1445,
    height: 1088,
  },
  /** Browsers → Headless: one worker fanning out into three offscreen renders. */
  headlessFanout: {
    src: "/images/solari/ZDzu6f4yGnjEAIpP1SBbPmFaQ-983e79.png",
    width: 1187,
    height: 710,
  },
  /** Browsers → Headful: a live window with traffic lights and a cursor target. */
  headfulWindow: {
    src: "/images/solari/r9cAhdZKHg6xFhJetY5uXE4KQU-0e7cfb.png",
    width: 1194,
    height: 710,
  },
  /** Sandboxes → Lightning-Fast Infrastructure: the amber "90ms" lockup. */
  sandboxLatency: {
    src: "/images/solari/L8J0oytfm0inTILcMGlvsjxpkKI-09ec31.png",
    width: 1182,
    height: 705,
  },
  /** Sandboxes → Isolated Runtime Protection: a padlocked microVM cube. */
  sandboxIsolation: {
    src: "/images/solari/BKp2j4u9IlXU9GRUKKjlntLWrg-338edc.png",
    width: 1182,
    height: 705,
  },
  /** Sandboxes → Massive Parallel Execution: three cascading forked windows. */
  sandboxParallel: {
    src: "/images/solari/zsujmZsvi8DiUGPgLvC5r65nhI-e26cfa.png",
    width: 1182,
    height: 705,
  },
  /** Desktops → ERP & CRM Automation: a driven desktop with dock and taskbar. */
  desktopSession: {
    src: "/images/solari/Vnl0YLGQkkxY5plE6ASS7RPJSI-1d9dc5.png",
    width: 3225,
    height: 1957,
  },
  /** Desktops → Cross-App Workflows: one source app feeding three targets. */
  desktopFanout: {
    src: "/images/solari/uOWu99jAv9ljzLJERgW63VoGN2c-5b5881.png",
    width: 1187,
    height: 710,
  },
  /** Desktops → Custom Environments: an image cloned out to six machines. */
  desktopClone: {
    src: "/images/solari/b6Yguh4FGNhWsVJtw3PA3Rrlq4-23ccab.png",
    width: 1182,
    height: 705,
  },
} as const satisfies Record<string, ProductShotAsset>;

/** The four app marks sitting in the dock of the Desktops hero illustration. */
export const SOLARI_APP_ICONS = [
  { name: "Google Chrome", src: "/images/solari/chrome-original-a1c178.svg" },
  { name: "Slack", src: "/images/solari/slack-original-222a01.svg" },
  { name: "Salesforce", src: "/images/solari/salesforce-original-811c4c.svg" },
  { name: "Visual Studio Code", src: "/images/solari/vscode-original-aba887.svg" },
] as const;

/**
 * A real captured screenshot or diagram, sized responsively. `sizes` is always
 * required so the browser downloads a variant that fits the slot rather than
 * the multi-thousand-pixel source.
 */
export function ProductShot({
  asset,
  alt,
  sizes,
  className,
  imageClassName,
}: {
  asset: ProductShotAsset;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <Image
        src={asset.src}
        alt={alt}
        width={asset.width}
        height={asset.height}
        sizes={sizes}
        className={cn("h-auto w-full", imageClassName)}
      />
    </div>
  );
}

/** macOS-style dock of real brand marks, used in the Desktops hero. */
export function AppDock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-2.5",
        className,
      )}
    >
      {SOLARI_APP_ICONS.map((icon) => (
        <Image
          key={icon.name}
          src={icon.src}
          alt={icon.name}
          width={28}
          height={28}
          className="size-6 md:size-7"
        />
      ))}
    </div>
  );
}
