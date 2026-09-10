"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import brandOrbsSource from "@/shaders/brand-orbs/sources/brand-orbs-v2.html?raw";

/**
 * The orb above the prompt, wearing the mark of whichever model is selected.
 *
 * ThreeUI's own BrandOrbs ships a fixed list of brands and none of the three model vendors
 * here is on it. Rather than edit the registered source — its bytes are the thing that makes
 * it verifiable — this reuses its engine and adds the three marks by patching the extracted
 * script on the way into the frame, which is the same move BrandOrbs itself makes to add a
 * pause control. The drawing is not reimplemented: `drawMark` is the engine's own driver for
 * sampled logos, the one it uses for GitHub and X, so these dots are made by ThreeUI's code.
 *
 * The paths are each vendor's own artwork: Moonshot AI and MiniMax from Simple Icons (CC0),
 * Z.ai from LobeHub's icon set (MIT). White on the page's own black, like the OpenAI rosette.
 */
export type AgentMark = "openai" | "moonshot" | "minimax" | "zai";

const MARK_LABELS: Record<AgentMark, string> = {
  openai: "OpenAI",
  moonshot: "Moonshot AI",
  minimax: "MiniMax",
  zai: "Z.ai",
};

/** viewBox 24 on all three, which is what the engine's sampler assumes by default. */
const EXTRA_PATHS: Record<string, string> = {
  moonshot:
    "m1.053 16.91 9.538 2.55a21 20.981 0 0 0 .06 2.031l5.956 1.592a12 11.99 0 0 1-15.554-6.172m-1.02-5.79 11.352 3.035a21 20.981 0 0 0-.469 2.01l10.817 2.89a12 11.99 0 0 1-1.845 2.004L.658 15.918a12 11.99 0 0 1-.625-4.796m1.593-5.146L13.573 9.17a21 20.981 0 0 0-1.01 1.874l11.297 3.02a21 20.981 0 0 1-.67 2.362l-11.55-3.087L.125 10.26a12 11.99 0 0 1 1.499-4.285ZM6.067 1.58l11.285 3.016a21 20.981 0 0 0-1.688 1.719l7.824 2.091a21 20.981 0 0 1 .513 2.664L2.107 5.218a12 11.99 0 0 1 3.96-3.638M21.68 4.866 7.222 1.003A12 11.99 0 0 1 21.68 4.866",
  minimax:
    "M11.43 3.92a.86.86 0 1 0-1.718 0v14.236a1.999 1.999 0 0 1-3.997 0V9.022a.86.86 0 1 0-1.718 0v3.87a1.999 1.999 0 0 1-3.997 0V11.49a.57.57 0 0 1 1.139 0v1.404a.86.86 0 0 0 1.719 0V9.022a1.999 1.999 0 0 1 3.997 0v9.134a.86.86 0 0 0 1.719 0V3.92a1.998 1.998 0 1 1 3.996 0v11.788a.57.57 0 1 1-1.139 0zm10.572 3.105a2 2 0 0 0-1.999 1.997v7.63a.86.86 0 0 1-1.718 0V3.923a1.999 1.999 0 0 0-3.997 0v16.16a.86.86 0 0 1-1.719 0V18.08a.57.57 0 1 0-1.138 0v2a1.998 1.998 0 0 0 3.996 0V3.92a.86.86 0 0 1 1.719 0v12.73a1.999 1.999 0 0 0 3.996 0V9.023a.86.86 0 1 1 1.72 0v6.686a.57.57 0 0 0 1.138 0V9.022a2 2 0 0 0-1.998-1.997",
  zai: "M12.105 2L9.927 4.953H.653L2.83 2h9.276zM23.254 19.048L21.078 22h-9.242l2.174-2.952h9.244zM24 2L9.264 22H0L14.736 2H24z",
};

/**
 * MiniMax's mark is a comb of hairline strokes, so it is sampled on a finer lattice than the
 * other two; at the engine's usual density the thin lines fall between samples and break up.
 */
const EXTRA_MODES = `
    moonshot: { draw: mk({ key: "moonshot", n: 25, nMini: 12, motion: "diag", fit: .84, v: .62 }), accent: null, speed: 1, staticT: 1.1 },
    minimax:  { draw: mk({ key: "minimax", n: 52, nMini: 20, motion: "scan", speed: .34, fit: .82, v: .62 }), accent: null, speed: 1, staticT: 1.2 },
    zai:      { draw: mk({ key: "zai", n: 27, nMini: 12, motion: "diag", fit: .76, v: .62 }), accent: null, speed: 1, staticT: 1.1 },`;

function extractOrbEngine(source: string) {
  const scripts = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  return scripts.at(-1)?.[1] ?? "";
}

const DRIVER_ANCHOR = "/* one driver for every sampled mark; each brand is just a config */";
const MODE_ANCHOR = "openai: { draw: drawOpenAI, accent: null, speed: 1, staticT: .8 },";

/** Fail loudly at module load rather than render an empty frame if ThreeUI's source moves. */
function patchedEngine() {
  let engine = extractOrbEngine(brandOrbsSource);
  for (const anchor of [DRIVER_ANCHOR, MODE_ANCHOR]) {
    if (!engine.includes(anchor)) throw new Error(`brand-orbs engine changed: no anchor ${anchor}`);
  }
  engine = engine.replace(
    DRIVER_ANCHOR,
    `Object.assign(MARK_PATHS, ${JSON.stringify(EXTRA_PATHS)});\n  ${DRIVER_ANCHOR}`,
  );
  engine = engine.replace(MODE_ANCHOR, `${MODE_ANCHOR}${EXTRA_MODES}`);
  return engine
    .replace(
      'if (document.visibilityState !== "hidden")',
      'if (document.visibilityState !== "hidden" && !window.__BRAND_ORB_PAUSED)',
    )
    .replace(/<\/script/gi, "<\\/script");
}

const ORB_ENGINE = patchedEngine();

const CONTROL_SCRIPT = `<script>
(function () {
  var nativeNow = performance.now.bind(performance);
  var last = nativeNow(), virtual = last, paused = false;
  window.__BRAND_ORB_PAUSED = false;
  performance.now = function () {
    var real = nativeNow();
    if (!paused) virtual += real - last;
    last = real;
    return virtual;
  };
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'brand-orbs-controls') return;
    paused = Boolean((event.data.controls || {}).paused);
    window.__BRAND_ORB_PAUSED = paused;
  });
})();
</script>`;

function buildDocument(mark: AgentMark, px: number) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8">
<style>
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:transparent}
body{display:grid;place-items:center}
canvas{display:block;width:${px}px;height:${px}px}
</style>
${CONTROL_SCRIPT}
</head>
<body>
<canvas data-mode="${mark}" data-size="${px}" aria-hidden="true"></canvas>
<script>${ORB_ENGINE}</script>
</body>
</html>`;
}

export function AgentOrb({ mark = "openai", size = 56 }: { mark?: AgentMark; size?: number }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const safeMark = MARK_LABELS[mark] ? mark : "openai";
  const source = useMemo(() => buildDocument(safeMark, size), [safeMark, size]);
  const paused = !onScreen || !tabVisible;

  const post = useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "brand-orbs-controls", controls: { paused } },
      "*",
    );
  }, [paused]);

  useEffect(() => {
    const el = frame.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setOnScreen(e?.isIntersecting ?? true));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => { post(); }, [post, source]);

  return (
    <iframe
      ref={frame}
      title={`${MARK_LABELS[safeMark]} mark`}
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      onLoad={post}
      style={{ display: "block", width: "100%", height: "100%", border: 0, background: "transparent" }}
    />
  );
}
