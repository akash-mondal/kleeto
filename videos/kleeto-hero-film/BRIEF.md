---
workflow: general-video
flow: automation
storyboard: no
---

# Kleeto hero film

## Deliverable
A 60-second silent loop, 1280×720, mp4 + webm, autoplaying under the hero on the Kleeto
landing page.

## Source material
Real screen recordings from live leases, cut into `assets/s1…s10`:
- `agent-runs/film/raw.mp4` — 188 s continuous take on one `desktop-4` lease (beats in
  `beats.json`).
- `agent-runs/film/preview.mp4` — the re-shot public-preview beat.
- `agent-runs/lane-clips/desktop.mp4` — Blender in the GUI. The film take lost that beat
  behind a fullscreen terminal, so it is cut from the earlier shoot of the same lane.
Nothing is a mockup: the sites are live, the render is real Blender, the hashes are real.

## Story
One agent, one lease, one job that needs all three kinds of machine: research it in a
browser, compute it on the machine, make something on the desktop, publish it back through
the browser, hand over the receipt.

## Look
Ground `#171310`, amber `oklch(0.8 0.165 85)`, text `oklch(0.96 0.006 85)`. Archivo for
display, Azeret Mono for labels. Footage sits in a rounded frame; a mono label names the
lane and the action. Hard cuts between shots, cross-fades only into and out of the cards.

## Constraints
Silent, loops cleanly, and every number on screen is one we measured.
