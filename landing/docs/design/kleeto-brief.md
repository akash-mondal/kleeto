# Kleeto landing — design brief
Route: `/kleeto` (promoted to `/` once approved). Produced by /shape from the session's own
discovery: the bounty brief, the Solari live tests, the positioning teardown
(`research/kleeto-positioning.md`), the measured token/motion docs (`docs/research/*`) and
`.impeccable.md`. Nothing here is invented; every number is one we measured or priced.

## 1. Feature summary
One marketing page that explains, in under a minute, that an AI agent can rent a real
computer (browser, headless Linux machine, or full desktop) by the second, pay for it from its
own wallet over x402 on Hedera, and hand back a receipt anyone can recompute. Read by Hedera
judges on a laptop while comparing submissions, by agent developers deciding whether to wire
it in, and by operators who run agents 24/7 and want to watch them work.

## 2. Primary user action
Understand the one sentence — *the meter and the payment are the same event* — and click
**Read the docs** or **Start free**. Secondary: copy the "recompute this bill" command.

## 3. Design direction
Structure from Runloop, showcases from Solari, meaning from Kleeto (`.impeccable.md`).
- **Ground**: warm paper, not white. Every neutral tinted toward the amber hue.
- **Dark showcase cards** on the light ground carry all the loops. Cards are warm near-black,
  never #000. The aurora, carousel, terminal, cursor, charts live inside them.
- **Accent**: amber. Used for the boxed word, the active carousel underline, the winner bar,
  the aurora, the live dot, the meter digits. Nowhere else. It must stay rare.
- **Type**: display **Archivo** (variable; width axis 62–125). Hero and section H2s set at
  `wdth 112–118`, medium weight, tight tracking. Body Archivo at `wdth 100`, 400. Numerals,
  receipts, eyebrows and the meter in **Azeret Mono** with `font-variant-numeric: tabular-nums`.
  Brand words: plain / measured / provable → the physical object is a utility meter face and
  the thermal receipt that comes out of it. Reflex picks (Inter, IBM Plex Mono, Space Grotesk)
  were listed and rejected.
- **Voice**: Fly-register. Short sentences. Prices in USD and in human units. No "on-chain",
  "gas", "facilitator", "permissionless", "settlement" above the fold (see the avoid table in
  the positioning doc).

### Tokens (OKLCH, defined once in `src/components/kleeto/kleeto.css`)
| token | value | use |
|---|---|---|
| `--kl-ground` | `oklch(0.975 0.006 85)` | page background |
| `--kl-section` | `oklch(0.945 0.009 85)` | alternating section band |
| `--kl-fg` | `oklch(0.21 0.012 85)` | text on light |
| `--kl-muted` | `oklch(0.50 0.014 85)` | secondary text on light |
| `--kl-line` | `oklch(0.86 0.012 85)` | hairlines on light |
| `--kl-amber` | `oklch(0.80 0.165 85)` | accent on dark, boxed word stroke, live dot |
| `--kl-amber-deep` | `oklch(0.60 0.135 75)` | accent *text* on light (contrast-safe) |
| `--kl-card` | `oklch(0.19 0.010 85)` | dark card |
| `--kl-card-deep` | `oklch(0.14 0.010 85)` | deepest card / CTA band |
| `--kl-on-card` | `oklch(0.96 0.006 85)` | text on dark |
| `--kl-on-card-muted` | `oklch(0.70 0.012 85)` | secondary on dark |
Spacing: 4pt scale. Radii: 8 / 16 / 24 / 40, pills 390px (Runloop's), 4px inside dark mock frames (Solari's).

## 4. Layout strategy (section order and what each replaces)
| # | Runloop section replaced | Kleeto section | showcase carried over |
|---|---|---|---|
| 0 | pill nav | pill nav: KLEETO · Lanes · How it bills · Receipts · Docs · **Start free** | — |
| 1 | hero + iso cubes | **H1 "A computer your agent can <box>pay for itself</box>."** Lede from positioning A. CTA pair `Start free` / `Read the docs`. Iso cubes kept, retoned to warm greys with one amber face. Under the CTA: a **live meter HUD** — a dark strip reading `desktop-2 · RUNNING · 00:04:12 · $0.0104` that ticks in real time (seconds and dollars advance together — this *is* the thesis, animated). | CountUp, new MeterHud |
| 2 | Build (1 big + 4 small) | **Lanes.** Eyebrow LANES. H2 "Three kinds of computer. <box>One meter.</box>" Three AuroraCards: Browser · Machine · Desktop, each with the real product screenshot, a spec line (`2 vCPU · 4 GB · Xfce`), the price *per hour and per 10 minutes*, boot time. Below: a quiet hairline row listing the seven lane ids with their $/hr. | AuroraCard sweep, ProductShot |
| 3 | Scale (3 cards) | **How it bills.** Eyebrow METER. H2 "Pay by the second. <box>Get the rest back.</box>" Left: the 402 explainer in four numbered steps (ask → 402 with a price → sign and ask again → machine is up). Right: StatefulTerminal re-scripted to the lease lifecycle (`$ kleeto lease desktop-2` → `402 Payment Required · 53000 tinybar/s` → `signed · 0.0.7162784` → `up in 0.81s` → `$ kleeto pause` → `meter stopped · 0 credits/s`), state chips **RUNNING → PAUSED → SETTLED**. | StatefulTerminal (parameterised) |
| 4 | Benchmarking (glow card) | **Measured, not claimed.** Eyebrow MEASURED. H2 "Up in under a second. <box>Measured.</box>" One dark card, amber glow border: ColumnChart of boot times (machine 0.75s · desktop 1.3s · snapshot restore 15s+ shown honestly as the slow one) and a TrackChart of *cost of ten minutes* per lane (1.0¢ · 2.1¢ · 2.5¢ · 1.8¢). Caption states the method. | ColumnChart, TrackChart, CountUp |
| 5 | Features (8-grid) | **What the agent gets.** Eyebrow INCLUDED. H2 "Everything an agent needs. <box>Nothing it has to sign up for.</box>" FeatureCarousel, 8 cards: Live view (Humanizer cursor over a desktop) · Session replay (ReplayLoop) · Artifact hashing (new HashLoop: files → sha256 → merkle root) · Pause economics (TelemetryLoop rows: paused · 0/s · resumed) · Snapshot & fork (AuthLoop retitled: SNAP 01–04 → FORKED · STATE CARRIED) · Preview URLs (StealthLoop retitled: localhost:3000 → public https · 200) · Human takeover (GpuLoop retitled: agent → human → agent handoff line) · Budget ceiling (new CeilingLoop: bar fills to a cap and stops). | FeatureCarousel + all loops + HumanizerMock |
| 6 | CTA band | **"No account. No API key. <box>No card.</box>"** Fund the agent once; it pays for the seconds it uses. `Start free`. | — |
| 7 | Deploy to VPC | **The receipt.** Eyebrow RECEIPT. H2 "Every second on a public ledger. <box>Every file hashed.</box>" Left: a rendered receipt (Azeret Mono, thermal-printer feel: lane, seconds, credits, tinybar, USD, artifact merkle root, HCS topic + sequence, `kid: did:hedera:…`). Right: CodeTabs — `curl` / `node` / `python` — that fetch the topic messages from the public mirror node and recompute the total. Caption: "No credentials. The mirror node is public." | CodeTabs, new Receipt |
| 8 | FAQ | Kleeto Q&A (8 items): what is a lane · what does it cost · what if the agent loops · can I watch · what's in the receipt · which networks · do I need a wallet · what runs inside. | accordion |
| 9 | footer | Kleeto footer: lanes / docs / receipts / status; "Built on Hedera · x402". | — |

Rhythm: hero on ground; lanes on ground; meter on section band; measured on ground; carousel on
section band; CTA band dark; receipt on ground; FAQ on section band; footer on ground. Never
two dark blocks adjacent. Scroll reveals use the measured Solari curve (heading 28px, body
15.6px, card scale 0.84, 0.4s `cubic-bezier(0.22,1,0.36,1)`).

## 5. Key states
- **Meter HUD**: starts at a fixed seed (e.g. 00:04:12 / $0.0104) and advances at desktop-2's
  real rate ($0.1483/hr → $0.0000412/s) so the dollars are true. Pauses off-screen. Under
  reduced motion shows the seed frozen.
- **Loops**: all pause off-screen; reduced motion renders the settled frame.
- **Carousel**: keyboard/touch native via scroll-snap; autoplay yields 6s after interaction.
- **Copy button**: copied → check for 1.5s.
- **FAQ**: one open at a time, height via grid-template-rows.
- No empty/error states: static page.

## 6. Interaction model
Scroll is the interaction. Hover: card lift 2px + border brighten only. Nav links smooth-scroll
to section ids (`#lanes`, `#meter`, `#receipt`). External CTAs are `href="#"` placeholders for now.

## 7. Content requirements
Copy is in the table above; the builder may tighten but not lengthen. Prices come from
`src/lanes.mjs` (×1.10 margin): machine-1 $0.062/hr · machine-2 $0.126 · machine-4 $0.252 ·
machine-8 $0.501 · desktop-2 $0.148 · desktop-4 $0.274 · browser-fast $0.11. Boot: 0.75–1.3s.
Snapshot restore: 15–69s. Facilitator fee payer shown in terminal: `0.0.7162784` (testnet).

## 8. References to consult while building
`impeccable/reference/motion-design.md`, `typography.md`, `color-and-contrast.md`;
`docs/research/MOTION.md`, `INTERACTION_PATTERNS.md`.

## 9. Open questions (resolve during build)
- Whether IsoCubes read well retoned to warm grey; if not, drop them and let the meter HUD be
  the hero's only object.
- Whether snapshot restore belongs on the benchmark chart (honest but unflattering). Default: yes.
