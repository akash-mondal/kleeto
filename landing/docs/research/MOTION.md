# Motion spec — MEASURED from the live sites, not invented
Captured 2026-09-04 by loading each page in a real browser, reading computed styles at rest,
then scrolling everything into view and re-reading. Source files: `reference/motion-*.json`.

Neither site ships its animation in CSS: Solari is **Framer Motion**, Runloop is **Webflow IX2**.
Both are JS-driven, so the values below were measured off live DOM nodes.

## Solari (getsolari.com)
**Transition, verbatim from computed style — use exactly this:**
```
opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)
```
`cubic-bezier(0.22, 1, 0.36, 1)` is easeOutQuint — fast start, long gentle settle.

**Rest states observed (element → its final state is opacity 1 / transform none):**
| at rest | count | used for |
|---|---|---|
| `opacity 0, translateY(28px)` | headings | section headings |
| `opacity 0, translateY(15.6px)` | body/sub | paragraphs, sub-copy |
| `opacity 0, scale(0.84)` | many | cards, panels, media |
| `opacity 0, translate(-367px, -161px)` | few | parallax/drift elements |

29 nodes animate; 24 of them start hidden below the fold. After a full scroll, **555 elements**
end fully visible — i.e. reveal is applied broadly, not just to a handful of hero items.

## Runloop (runloop.ai)
**Rest state:** `opacity 0, translateY(32px)` → `opacity 1, translateY(0)`.
Applied to `.title-center-large` (section headings), `.block-regular` wrappers, and
Webflow-interaction nodes keyed by `data-w-id`. 24 start hidden below the fold; **355 elements**
end visible after a full scroll.
No CSS transition is declared — Webflow IX2 drives it in JS, so pick a duration in the same
family as Solari's (0.4–0.6s) with an ease-out curve.

**This is why our clone was missing content:** the Testing / Regression Testing / Fine Tuning row
sits at `opacity: 0` at rest and only appears on scroll, so it never showed in a static capture.

## How to implement (no new dependencies)
Framer Motion is **not installed and must not be added**. Use a small client component:
`IntersectionObserver` (threshold ~0.15, `rootMargin: "0px 0px -10% 0px"`), toggle a
`data-revealed` attribute, and drive the transition purely in CSS with the values above.
Stagger children by 60–90ms. Honour `prefers-reduced-motion: reduce` by rendering the final
state immediately with no transition.
