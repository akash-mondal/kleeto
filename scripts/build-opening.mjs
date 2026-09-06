/**
 * The opening sequence, rebuilt.
 *
 * What was wrong the first time: the nodes and the wire were positioned by eye, so the
 * line never met the boxes; everything moved with plain fades; the type was flat.
 *
 * What this does instead, following the技 in heygen-com/hyperframes-launches:
 *  - Geometry is measured at t=0 and the connector path is drawn between the *actual*
 *    centres of the nodes, so a line can never miss its box.
 *  - The connector draws itself with stroke-dashoffset rather than appearing.
 *  - Travelling packets carry real directional motion blur — an SVG feGaussianBlur with
 *    an x-only stdDeviation animated up at speed and back to zero on arrival.
 *  - Cards land with a dimensional pop (transformPerspective + rotationY) and a shimmer
 *    sweep, and rows cascade rather than fading together.
 *  - Scenes hand over with a scale push, not a cut.
 */
import { writeFileSync } from "node:fs";

const S = {
  job:   [0.0,  5.4],
  ask:   [5.4,  9.8],
  quote: [9.8,  14.2],
  pay:   [14.2, 19.8],
  up:    [19.8, 23.2],
};
const END = S.up[1];

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1280, height=720" />
    <title>Kleeto — how a lease starts</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Azeret+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1280px; height: 720px; overflow: hidden; background: #141110; }
      body { font-family: Archivo, system-ui, sans-serif; -webkit-font-smoothing: antialiased; color: #F4EEE4; }
      #root { position: relative; width: 1280px; height: 720px; overflow: hidden; background: #141110; }
      .clip { position: absolute; inset: 0; }
      .mono { font-family: "Azeret Mono", monospace; }

      /* A cool ambient wash so the ground is not a flat rectangle. */
      /* the arc plate sits under everything; the scrim keeps type legible over it */
      #plate { position: absolute; inset: 0; width: 1280px; height: 720px; object-fit: cover; }
      .scrim { position: absolute; inset: 0; pointer-events: none;
        background:
          radial-gradient(72% 58% at 50% 42%, oklch(0.14 0.01 85 / 0.35), oklch(0.14 0.01 85 / 0.86) 78%),
          linear-gradient(180deg, oklch(0.14 0.01 85 / 0.72), oklch(0.14 0.01 85 / 0.42) 45%, oklch(0.14 0.01 85 / 0.86)); }
      .grain { position: absolute; inset: 0; opacity: 0.05; pointer-events: none; mix-blend-mode: overlay;
        background-image: radial-gradient(oklch(1 0 0 / 0.7) 0.5px, transparent 0.6px);
        background-size: 3px 3px; }

      /* ---------------- scene 1 : the job ---------------- */
      .stage { display: grid; place-items: center; }
      .col { width: 900px; }
      .agents { display: flex; align-items: center; justify-content: center; gap: 46px; margin-bottom: 46px; }
      .agent { display: flex; flex-direction: column; align-items: center; gap: 12px; opacity: 0.34; }
      .agent .disc {
        width: 62px; height: 62px; border-radius: 18px; display: grid; place-items: center;
        background: oklch(0.19 0.012 85); border: 1px solid oklch(0.86 0.012 85 / 0.12);
      }
      .agent img { width: 34px; height: 34px; object-fit: contain; }
      .agent span { font-family: "Azeret Mono", monospace; font-size: 11px; letter-spacing: 0.1em; color: oklch(0.56 0.014 85); }

      .glass {
        position: relative; border-radius: 22px; padding: 30px 34px; overflow: hidden;
        border: 1px solid oklch(0.8 0.165 85 / 0.3);
        background: linear-gradient(122deg, oklch(0.24 0.014 85 / 0.92), oklch(0.19 0.01 85 / 0.92));
        box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.06), 0 36px 80px oklch(0.1 0.01 85 / 0.55);
      }
      .glass .who { font-family: "Azeret Mono", monospace; font-size: 11px; letter-spacing: 0.26em;
        text-transform: uppercase; color: oklch(0.8 0.165 85); margin-bottom: 14px; }
      .glass .text { font-size: 34px; line-height: 1.28; font-weight: 600;
        font-variation-settings: "wdth" 108; letter-spacing: -0.015em; }
      .shine { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 22px; }
      .shine i { position: absolute; top: -30%; bottom: -30%; left: 0; width: 210px; display: block;
        background: linear-gradient(104deg, transparent, oklch(1 0 0 / 0.11), transparent);
        transform: translateX(-360px); }
      .caret { display: inline-block; width: 3px; height: 0.86em; background: oklch(0.8 0.165 85);
        margin-left: 8px; transform: translateY(0.08em); }

      /* ---------------- the rail ---------------- */
      .rail { position: absolute; inset: 0; }
      .railsvg { position: absolute; inset: 0; width: 1280px; height: 720px; overflow: visible; }
      .node { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 15px; }
      .node .box {
        width: 128px; height: 128px; border-radius: 26px; display: grid; place-items: center; position: relative;
        background: linear-gradient(140deg, oklch(0.23 0.013 85), oklch(0.175 0.01 85));
        border: 1px solid oklch(0.86 0.012 85 / 0.14);
        box-shadow: 0 26px 60px oklch(0.1 0.01 85 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.05);
      }
      .node .box img { width: 56px; height: 56px; object-fit: contain; }
      .node .halo { position: absolute; inset: -2px; border-radius: 28px; opacity: 0;
        box-shadow: 0 0 0 1px oklch(0.8 0.165 85 / 0.6), 0 0 34px oklch(0.8 0.165 85 / 0.45); }
      .node .name { font-family: "Azeret Mono", monospace; font-size: 12px; letter-spacing: 0.16em;
        text-transform: uppercase; color: oklch(0.88 0.01 85); }
      .node .sub { font-family: "Azeret Mono", monospace; font-size: 11px; color: oklch(0.56 0.014 85); }
      .kmark { width: 30px; height: 30px; border-radius: 8px; background: oklch(0.8 0.165 85);
        box-shadow: 0 0 26px oklch(0.8 0.165 85 / 0.55); }
      .wordmark { font-family: "Azeret Mono", monospace; font-weight: 600; font-size: 21px;
        letter-spacing: 0.06em; color: oklch(0.92 0.01 85); }

      .packet { position: absolute; display: flex; align-items: center; gap: 9px; padding: 8px 14px;
        border-radius: 999px; font-family: "Azeret Mono", monospace; font-size: 13px; white-space: nowrap;
        background: oklch(0.2 0.012 85); border: 1px solid oklch(0.8 0.165 85 / 0.45);
        box-shadow: 0 0 30px oklch(0.8 0.165 85 / 0.22); color: oklch(0.94 0.008 85); }
      .packet img { width: 19px; height: 19px; }
      .dot { width: 9px; height: 9px; border-radius: 50%; background: oklch(0.8 0.165 85);
        box-shadow: 0 0 16px oklch(0.8 0.165 85 / 0.9); }

      /* ---------------- the 402 card ---------------- */
      .card {
        position: absolute; left: 320px; top: 186px; width: 640px; border-radius: 20px; padding: 28px 32px;
        background: linear-gradient(140deg, oklch(0.235 0.014 85), oklch(0.18 0.01 85));
        border: 1px solid oklch(0.8 0.165 85 / 0.36);
        box-shadow: 0 40px 90px oklch(0.1 0.01 85 / 0.55), inset 0 1px 0 oklch(1 0 0 / 0.06);
      }
      .card .head { display: flex; align-items: center; gap: 14px; padding-bottom: 18px;
        border-bottom: 1px solid oklch(0.86 0.012 85 / 0.1); }
      .card .code { font-family: "Azeret Mono", monospace; font-size: 15px; letter-spacing: 0.04em;
        color: oklch(0.8 0.165 85); }
      .row { display: flex; justify-content: space-between; align-items: baseline; padding: 11px 0;
        font-family: "Azeret Mono", monospace; font-size: 15px; color: oklch(0.72 0.012 85); }
      .row .v { color: oklch(0.94 0.008 85); }
      .row .v em { font-style: normal; color: oklch(0.8 0.165 85); }
      .underline { position: absolute; left: 32px; right: 32px; bottom: 20px; height: 2px;
        background: linear-gradient(90deg, oklch(0.8 0.165 85), oklch(0.8 0.165 85 / 0)); transform-origin: 0 50%; }

      /* ---------------- the machine ---------------- */
      .big { text-align: center; font-size: 52px; line-height: 1.1; font-weight: 700;
        font-variation-settings: "wdth" 112; letter-spacing: -0.025em; }
      .big em { font-style: normal; color: oklch(0.8 0.165 85); }
      .sub { margin-top: 22px; text-align: center; font-family: "Azeret Mono", monospace;
        font-size: 14px; letter-spacing: 0.05em; color: oklch(0.62 0.014 85); }
      .win { position: absolute; left: 50%; top: 52%; width: 660px; height: 372px; margin-left: -330px;
        margin-top: -186px; border-radius: 16px; overflow: hidden; opacity: 0;
        background: oklch(0.16 0.01 85); border: 1px solid oklch(0.8 0.165 85 / 0.4);
        box-shadow: 0 40px 90px oklch(0.1 0.01 85 / 0.6); }
      .win .bar { height: 30px; display: flex; align-items: center; gap: 7px; padding: 0 12px;
        background: oklch(0.13 0.008 85); border-bottom: 1px solid oklch(0.86 0.012 85 / 0.1); }
      .win .bar i { width: 8px; height: 8px; border-radius: 50%; background: oklch(0.4 0.01 85); display: block; }
      .win .bar span { font-family: "Azeret Mono", monospace; font-size: 10px; color: oklch(0.6 0.014 85); margin-left: 8px; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${END}" data-width="1280" data-height="720">
      <video id="plate" src="assets/plate.mp4" data-start="0" data-duration="${END}" data-track-index="0" muted playsinline></video>
      <!-- one filter set, shared by every travelling packet -->
      <svg width="0" height="0" style="position:absolute" aria-hidden="true">
        <defs>
          <filter id="mb1" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur id="mb1b" in="SourceGraphic" stdDeviation="0 0" />
          </filter>
          <filter id="mb2" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur id="mb2b" in="SourceGraphic" stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>

      <!-- 1 · the job -->
      <section id="s1" class="clip stage" data-start="${S.job[0]}" data-duration="${S.job[1] - S.job[0]}">
        <div class="scrim"></div><div class="grain"></div>
        <div class="col">
          <div class="agents">
            <div class="agent" id="ag1"><span class="disc"><img src="assets/brand/claude.svg" alt="Claude Code" /></span><span>Claude Code</span></div>
            <div class="agent" id="ag2"><span class="disc"><img src="assets/brand/openai.svg" alt="Codex" /></span><span>Codex</span></div>
            <div class="agent" id="ag3"><span class="disc"><img src="assets/brand/nous.png" alt="Hermes" /></span><span>Hermes</span></div>
            <div class="agent" id="ag4"><span class="disc"><img src="assets/brand/openclaw.svg" alt="OpenClaw" /></span><span>OpenClaw</span></div>
          </div>
          <div class="glass" id="gcard">
            <div class="who">Prompt</div>
            <div class="text"><span id="ptext"></span><span class="caret" id="pcaret"></span></div>
            <div class="shine"><i id="shine1"></i></div>
          </div>
        </div>
      </section>

      <!-- 2 · asking for a machine -->
      <section id="s2" class="clip" data-start="${S.ask[0]}" data-duration="${S.ask[1] - S.ask[0]}">
        <div class="scrim"></div><div class="grain"></div>
        <div class="rail" id="rail2">
          <svg class="railsvg"><path id="wire2" fill="none" stroke="oklch(0.86 0.012 85 / 0.18)" stroke-width="1.5" /></svg>
          <div class="node" id="n2a" style="left: 170px; top: 268px;">
            <div class="box"><img src="assets/brand/claude.svg" alt="the agent" /><span class="halo"></span></div>
            <div class="name">the agent</div><div class="sub">holds its own funds</div>
          </div>
          <div class="node" id="n2b" style="left: 850px; top: 268px;">
            <div class="box"><img src="assets/brand/kleeto.svg" alt="Kleeto" style="width:62px;height:62px" /><span class="halo" id="halo2b"></span></div>
            <div class="name">Kleeto</div><div class="sub">one endpoint</div>
          </div>
          <div class="packet" id="pk2" style="filter: url(#mb1);"><span class="dot"></span>GET /lease?lane=desktop-4</div>
        </div>
      </section>

      <!-- 3 · the price -->
      <section id="s3" class="clip" data-start="${S.quote[0]}" data-duration="${S.quote[1] - S.quote[0]}">
        <div class="scrim"></div><div class="grain"></div>
        <div class="card" id="card402">
          <div class="head">
            <img src="assets/brand/x402.svg" alt="x402" style="height: 25px" />
            <span class="code">402 Payment Required</span>
          </div>
          <div class="row"><span>lane</span><span class="v">desktop-4 &middot; 4 vCPU / 8 GB</span></div>
          <div class="row"><span>rate</span><span class="v"><em>98,000</em> tinybar / second</span></div>
          <div class="row"><span>network</span><span class="v">hedera:testnet</span></div>
          <div class="row"><span>asset</span><span class="v">USDC</span></div>
          <span class="underline" id="ul402"></span>
        </div>
      </section>

      <!-- 4 · paying for it -->
      <section id="s4" class="clip" data-start="${S.pay[0]}" data-duration="${S.pay[1] - S.pay[0]}">
        <div class="scrim"></div><div class="grain"></div>
        <div class="rail" id="rail4">
          <svg class="railsvg"><path id="wire4" fill="none" stroke="oklch(0.86 0.012 85 / 0.18)" stroke-width="1.5" /></svg>
          <div class="node" id="n4a" style="left: 96px; top: 268px;">
            <div class="box"><img src="assets/brand/claude.svg" alt="the agent" /><span class="halo" id="halo4a"></span></div>
            <div class="name">the agent</div><div class="sub">signs once</div>
          </div>
          <div class="node" id="n4b" style="left: 576px; top: 268px;">
            <div class="box"><span class="wordmark">B402</span><span class="halo" id="halo4b"></span></div>
            <div class="name">Blocky402</div><div class="sub">facilitator</div>
          </div>
          <div class="node" id="n4c" style="left: 1056px; top: 268px;">
            <div class="box"><img src="assets/brand/hedera.svg" alt="Hedera" /><span class="halo" id="halo4c"></span></div>
            <div class="name">Hedera</div><div class="sub">final in seconds</div>
          </div>
          <div class="packet" id="pk4" style="filter: url(#mb2);"><img src="assets/brand/usdc.svg" alt="USDC" />USDC</div>
        </div>
      </section>

      <!-- 5 · the machine -->
      <section id="s5" class="clip stage" data-start="${S.up[0]}" data-duration="${S.up[1] - S.up[0]}">
        <div class="scrim"></div><div class="grain"></div>
        <div class="win" id="win5">
          <div class="bar"><i></i><i></i><i></i><span>desktop-4 · 1280×720</span></div>
        </div>
        <div class="col" id="txt5">
          <div class="big">Up in <em>1.3 seconds</em>.<br />Billed by the second.</div>
          <div class="sub">the meter starts with the machine &middot; it stops when the agent pauses</div>
        </div>
      </section>
    </div>

    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });

      /* Geometry is measured, never guessed: the wire is drawn between the real centres
         of the boxes, and packets travel along exactly that line. */
      const LIFT = 104;   // packets ride above the rail, clear of every box and label
      function centre(nodeId) {
        const box = document.querySelector("#" + nodeId + " .box");
        const r = box.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
      }
      function wire(pathId, fromId, toId, inset) {
        const a = centre(fromId), b = centre(toId);
        const pad = inset ?? a.r.width / 2 + 16;
        document.getElementById(pathId)
          .setAttribute("d", "M " + (a.x + pad) + " " + a.y + " L " + (b.x - pad) + " " + b.y);
        return { a, b };
      }
      /** Park a packet on the wire at the source node, ready to fly. */
      function park(packetId, fromId) {
        const a = centre(fromId);
        const p = document.getElementById(packetId);
        const pr = p.getBoundingClientRect();
        gsap.set(p, { x: a.x + a.r.width / 2 + 22, y: a.y - pr.height / 2 - LIFT });
        return a;
      }

      /* ---------- 1 · the job ---------- */
      const PROMPT = "Render the scene, chart the results and publish them.";
      const ptext = document.getElementById("ptext");
      tl.set("#gcard", { transformPerspective: 1200, transformOrigin: "50% 60%" }, 0);
      tl.fromTo("#gcard", { autoAlpha: 0, y: 26, scale: 0.965, rotationX: 6 },
        { autoAlpha: 1, y: 0, scale: 1, rotationX: 0, duration: 0.7, ease: "expo.out" }, 0.25);
      tl.fromTo(".agents .agent", { autoAlpha: 0, y: 14 },
        { autoAlpha: 0.34, y: 0, duration: 0.42, stagger: 0.08, ease: "power3.out" }, 0.1);
      tl.to({ i: 0 }, { i: PROMPT.length, duration: 2.0, ease: "power2.out",
        onUpdate() { ptext.textContent = PROMPT.slice(0, Math.round(this.targets()[0].i)); } }, 0.75);
      // the agent that took the job lifts out of the row
      tl.to("#ag1", { autoAlpha: 1, scale: 1.06, duration: 0.5, ease: "power3.out" }, 3.0);
      tl.to("#ag1 .disc", { borderColor: "oklch(0.8 0.165 85 / 0.55)",
        boxShadow: "0 0 30px oklch(0.8 0.165 85 / 0.35)", duration: 0.5 }, 3.0);
      tl.fromTo("#shine1", { x: -360 }, { x: 1000, duration: 1.1, ease: "power2.inOut" }, 3.05);
      tl.to("#pcaret", { autoAlpha: 0, duration: 0.001, repeat: 7, yoyo: true, repeatDelay: 0.28 }, 2.8);
      tl.to("#s1 .col", { scale: 1.05, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, ${S.job[1]} - 0.5);
      tl.set("#s1 .col", { autoAlpha: 0 }, ${S.job[1]});
      tl.set("#s1", { autoAlpha: 0 }, ${S.job[1]});

      /* ---------- 2 · asking ---------- */
      tl.set("#rail2", { autoAlpha: 1 }, ${S.ask[0]});
      tl.fromTo("#s2 .node", { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.14, ease: "expo.out" }, ${S.ask[0]});
      // draw the wire between the measured centres
      tl.set("#wire2", { attr: { d: () => { wire("wire2", "n2a", "n2b"); return document.getElementById("wire2").getAttribute("d"); } } }, ${S.ask[0]} + 0.05);
      tl.fromTo("#wire2", { strokeDasharray: 700, strokeDashoffset: 700 },
        { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" }, ${S.ask[0]} + 0.35);
      // the request flies, blurring with speed
      tl.set("#pk2", { autoAlpha: 0, x: () => park("pk2", "n2a").x + 86, y: () => centre("n2a").y - 17 - LIFT }, ${S.ask[0]} + 0.8);
      tl.to("#pk2", { autoAlpha: 1, duration: 0.25 }, ${S.ask[0]} + 1.0);
      tl.to("#pk2", { x: () => centre("n2b").x - 168, duration: 1.15, ease: "power2.inOut" }, ${S.ask[0]} + 1.2);
      tl.fromTo("#mb1b", { attr: { stdDeviation: "0 0" } }, { attr: { stdDeviation: "16 0" }, duration: 0.4, ease: "power2.in" }, ${S.ask[0]} + 1.2);
      tl.to("#mb1b", { attr: { stdDeviation: "0 0" }, duration: 0.45, ease: "power2.out" }, ${S.ask[0]} + 1.9);
      tl.to("#pk2", { autoAlpha: 0, duration: 0.25 }, ${S.ask[0]} + 2.42);
      tl.fromTo("#halo2b", { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" }, ${S.ask[0]} + 2.35);
      tl.to("#halo2b", { autoAlpha: 0.45, duration: 0.5 }, ${S.ask[0]} + 2.85);
      tl.to("#rail2", { scale: 1.04, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, ${S.ask[1]} - 0.45);
      tl.set("#rail2", { autoAlpha: 0 }, ${S.ask[1]});
      tl.set("#s2", { autoAlpha: 0 }, ${S.ask[1]});

      /* ---------- 3 · the price ---------- */
      tl.set("#card402", { transformPerspective: 1200, transformOrigin: "50% 70%" }, ${S.quote[0]});
      tl.fromTo("#card402", { autoAlpha: 0, y: 30, rotationX: 10, scale: 0.97 },
        { autoAlpha: 1, y: 0, rotationX: 0, scale: 1, duration: 0.72, ease: "expo.out" }, ${S.quote[0]});
      tl.fromTo("#card402 .head", { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power3.out" }, ${S.quote[0]} + 0.3);
      tl.fromTo("#card402 .row", { autoAlpha: 0, x: -14 },
        { autoAlpha: 1, x: 0, duration: 0.42, stagger: 0.13, ease: "power3.out" }, ${S.quote[0]} + 0.5);
      tl.fromTo("#ul402", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, ${S.quote[0]} + 0.9);
      tl.to("#card402", { scale: 1.03, duration: 0.8, ease: "expo.out" }, ${S.quote[0]} + 1.5);
      tl.to("#card402", { scale: 1, duration: 0.9, ease: "power2.inOut" }, ${S.quote[0]} + 2.3);
      tl.to("#s3 .card", { scale: 1.06, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, ${S.quote[1]} - 0.45);
      tl.set("#s3 .card", { autoAlpha: 0 }, ${S.quote[1]});
      tl.set("#s3", { autoAlpha: 0 }, ${S.quote[1]});

      /* ---------- 4 · paying ---------- */
      tl.fromTo("#s4 .node", { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.13, ease: "expo.out" }, ${S.pay[0]});
      tl.set("#wire4", { attr: { d: () => { wire("wire4", "n4a", "n4c"); return document.getElementById("wire4").getAttribute("d"); } } }, ${S.pay[0]} + 0.05);
      tl.fromTo("#wire4", { strokeDasharray: 1000, strokeDashoffset: 1000 },
        { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, ${S.pay[0]} + 0.3);
      tl.set("#pk4", { autoAlpha: 0, x: () => park("pk4", "n4a").x + 86, y: () => centre("n4a").y - 17 - LIFT }, ${S.pay[0]} + 0.9);
      tl.to("#pk4", { autoAlpha: 1, duration: 0.25 }, ${S.pay[0]} + 1.05);
      tl.fromTo("#halo4a", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, ${S.pay[0]} + 1.0);
      // agent -> facilitator
      tl.to("#pk4", { x: () => centre("n4b").x - 46, duration: 1.05, ease: "power2.inOut" }, ${S.pay[0]} + 1.3);
      tl.fromTo("#mb2b", { attr: { stdDeviation: "0 0" } }, { attr: { stdDeviation: "18 0" }, duration: 0.35, ease: "power2.in" }, ${S.pay[0]} + 1.3);
      tl.to("#mb2b", { attr: { stdDeviation: "0 0" }, duration: 0.4, ease: "power2.out" }, ${S.pay[0]} + 1.95);
      tl.to("#pk4", { y: () => centre("n4b").y - 17 - LIFT + 34, duration: 0.3, ease: "power2.in" }, ${S.pay[0]} + 2.25);
      tl.to("#pk4", { y: () => centre("n4b").y - 17 - LIFT, duration: 0.3, ease: "power2.out" }, ${S.pay[0]} + 2.55);
      tl.fromTo("#halo4b", { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" }, ${S.pay[0]} + 2.3);
      // facilitator -> ledger
      tl.to("#pk4", { x: () => centre("n4c").x - 46, duration: 1.05, ease: "power2.inOut" }, ${S.pay[0]} + 2.75);
      tl.to("#mb2b", { attr: { stdDeviation: "18 0" }, duration: 0.35, ease: "power2.in" }, ${S.pay[0]} + 2.75);
      tl.to("#mb2b", { attr: { stdDeviation: "0 0" }, duration: 0.4, ease: "power2.out" }, ${S.pay[0]} + 3.4);
      tl.fromTo("#halo4c", { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" }, ${S.pay[0]} + 3.75);
      tl.to("#pk4", { autoAlpha: 0, duration: 0.3 }, ${S.pay[0]} + 3.9);
      tl.to("#rail4", { scale: 1.05, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, ${S.pay[1]} - 0.5);
      tl.set("#rail4", { autoAlpha: 0 }, ${S.pay[1]});
      tl.set("#s4", { autoAlpha: 0 }, ${S.pay[1]});

      /* ---------- 5 · the machine ---------- */
      tl.fromTo("#win5", { autoAlpha: 0, scale: 0.72 },
        { autoAlpha: 1, scale: 1, duration: 0.75, ease: "expo.out" }, ${S.up[0]});
      tl.to("#win5", { autoAlpha: 0, scale: 1.12, duration: 0.55, ease: "power2.inOut" }, ${S.up[0]} + 0.95);
      tl.fromTo("#txt5 .big", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out" }, ${S.up[0]} + 1.15);
      tl.fromTo("#txt5 .sub", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, ${S.up[0]} + 1.5);
      tl.to("#s5 .col", { scale: 1.04, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, ${END} - 0.45);
      tl.set("#s5 .col", { autoAlpha: 0 }, ${END});

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync("videos/kleeto-hero-film/index.html", html);
console.log("opening rebuilt:", END, "s");
