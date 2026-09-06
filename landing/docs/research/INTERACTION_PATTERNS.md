# Animation inventory — MEASURED, not guessed
Method: loaded each live product page, scrolled every section into view, captured 6 frames at
500ms intervals, then pixel-diffed consecutive frames to find what actually moves.
Raw frames: `reference/motion/{browsers,sandboxes,desktops}/`. Diff data: `reference/motion/diff-report.json`.

## What moves, ranked by how much of the viewport changes
| % viewport | page | section | region | what it is |
|---|---|---|---|---|
| **12.69%** | sandboxes | "Fast. Scalable. Stateful." | 1078×402 | **aurora glow sweeping behind the card row** |
| **12.03%** | desktops | "Built for the work agents actually do" | 1078×408 | same aurora sweep |
| 0.98% | browsers | "Fast cloud browsers" | 328×208 | **feature carousel** — card contents animate |
| 0.55% | browsers | "GPU acceleration" | 328×196 | carousel — line chart draws |
| 0.55% | sandboxes | "Everything your agent needs" | 440×310 | **terminal state machine** |
| 0.03% | browsers | stat row | small | **counting numbers** |
| 0.02% | browsers | "Moves like a human" | 184×36 | **cursor tracking across the mock** |

Sections showing 0% were captured mid-loop or animate only on hover/scrub — treat as
"verify manually", not "static".

---

## 1. Aurora sweep (the biggest miss — 12% of the viewport)
A large soft amber radial glow drifts **behind** a row of three dark cards, brightest as an arc
across the middle. It is continuous and looping, not scroll-triggered. Cards sit on top at
partial opacity so the glow reads through their backgrounds.

Implement: an absolutely-positioned blurred radial-gradient layer behind the card grid,
animated on a long loop (~12-20s) translating and scaling slightly, `will-change: transform`,
`pointer-events: none`. Cards get a semi-transparent background so the glow shows through.
Appears on **sandboxes** and **desktops**; the browsers page uses the carousel instead.

## 2. Feature carousel / coverflow (browsers, and the user's screenshots confirm)
Not a static grid — a horizontally scrolling **3D coverflow**:
- centre card is full-size, full-opacity, with an **amber underline bar** at its bottom edge
- flanking cards are scaled down, dimmed, and pushed back (perspective + translateZ/rotateY)
- a thin progress/scrub line runs beneath the whole row
- cards advance automatically and can be dragged/scrolled
Cards observed: Fast cloud browsers · GPU acceleration · Browser telemetry · Managed
authentication · Stealth mode · Live session replay · Workflows (integration).

## 3. In-card animations (each carousel card has its own loop)
| card | animation |
|---|---|
| Browser telemetry | log rows stream in one by one, `LIVE TELEMETRY` dot pulses, an amber progress bar fills |
| GPU acceleration | line chart **draws left-to-right**, `120 FPS` counts up, bars fill |
| Managed authentication | SESSION 01-04 tiles light in sequence, then `TOKEN REFRESHED · SESSION PRESERVED` |
| Stealth mode | a path animates from origin through `RESIDENTIAL ROUTE` to destination; `ROUTE BLOCKED · 403` then `CAPTCHA RESOLVED` |
| Live session replay | **scrubber head travels along a timeline** with keyframe dots; `RECORDED` dot pulses |
| Humanizer mock | **cursor moves along a curved path**, tab highlights amber, button highlights on arrival |

## 4. Terminal state machine (sandboxes "Everything your agent needs")
A terminal types lines progressively (`$ python train.py` → `Processing batch 42/100` →
`Checkpoint saved` → `$ sandbox.pause()` → `Filesystem preserved` → `Environment paused`), while
three tabs beneath cycle **RUNNING → PAUSED → RESUMING**, the active one underlined amber.

## 5. Counting stat numbers
`8ms`, `10×`, `4x`, `100%` count up from zero when scrolled into view, then hold.

## 6. Scroll reveal (already specified)
See `MOTION.md`: `opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)` with translateY(28px) for
headings, translateY(15.6px) for body, scale(0.84) for cards.

---

## Implementation constraints
- **No new dependencies.** No Framer Motion, no GSAP, no carousel library. CSS animations,
  `IntersectionObserver`, `requestAnimationFrame`, and native scroll-snap only.
- Every loop must **pause when off-screen** (IntersectionObserver) so we are not burning CPU
  animating things nobody is looking at.
- Honour `prefers-reduced-motion: reduce` — render the final/settled state, no loops.
- Carousel must stay usable with keyboard and touch; scroll-snap gives that for free.
