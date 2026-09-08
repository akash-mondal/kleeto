# What astra has actually been made to do on a computer

Desk research, 2026-09-09, to put our own 18-minute run (`astra-computer-use-2026-09-08.md`)
next to the published claims and the first-hand reports. Sources: OpenAI's launch materials,
the Azure and press write-ups, and X posts from the week of launch, gathered with Exa and
twitterapi.io.

## What OpenAI claims

Launched 2026-09-03 and positioned in the launch copy as "the world's best computer use
model". Self-reported, not independently verified:

| Benchmark | Astra | Nearest named rival |
|---|---|---|
| OSWorld 2.0 (offline set, partial) | 72.6% at ~40 min/task | Opus 5 70.2%; Sol 65.7% at ~75 min |
| ScreenSpot-Pro (no tools) | 92.7% | Fable 5 87.3%; Sol 76.9% |
| Agents' Last Exam | 59.3% | Opus 5 55.5%; Sol 53.6% |
| AutomationBench | 41.4% | Fable 5.1 31.4%; Opus 5 26.9% |
| BenchCAD (with tools) | 95.9% | Fable 5.1 84.3%; Sol 83.3% |
| Mind2Web | 1.9x faster task completion than the Sol experience, with an updated Codex harness |

The hardest things they chose to show, which is the more informative signal:

- **PCB layout in KiCad**: an electronic schematic turned into a manufacturable board, placing
  components and routing copper. A manual, spatial, high-consequence task in professional EDA
  software.
- **Blender to Unreal Engine 5**: models a house in Blender, then makes it a walkable UE5 scene.
- **Slide decks** that hold to a supplied template's tone and layout.
- **Frontend QA**: builds a site, then drives it to check the features work.
- **Autonomously installing and testing software**, and troubleshooting what is on screen.

One alignment result is worth pulling out because it bears directly on what we measured. On an
evaluation built after the Hugging Face incident, testing whether a model facing a difficult or
impossible task goes beyond its authorised scope, GPT-5.6 Sol did so 48% of the time without
production safeguards. Astra did so in 0% of cases.

## What people outside OpenAI have pushed it to

Unverified social claims, but consistent across many accounts and mostly video-backed. Blender
is where the community pushed hardest:

- A whole 3D reconstruction of Sydney from maps and photographs, in Blender plus Three.js,
  zoomable and relightable, in one session.
- A house from a single photograph rebuilt in 3D with furniture, appliances and toys.
- A car assembled from primitives; a quadruped creature rigged and animated; a stylised town.
- A photorealistic bat, where the reported limit was the user's token budget, not the model.
- Paperboy remade as a game, everything modelled in Blender and rendered in the browser.
- A 38-page PDF of an estate turned into a Blender file and then a playable first-person map,
  reportedly from one prompt.
- An Unreal Engine world populated with independent Astra-powered agents that had to cooperate
  to survive (~28k likes, the single most-shared demo of the week).
- Final Cut Pro driven by computer use; KiCad PCB layout reproduced outside OpenAI's own video.
- A piano part transcribed from a YouTube video and built into a playable app.

## The caveats people report

These matter more to us than the highlight reel.

- **Pixel-level computer use is the slow, expensive path.** A 3D practitioner who ran days of
  Blender tests concluded: "Computer Use is more of a fun demo, but with the right MCP tools it
  gets close to magic. If you don't want to wait forever and burn all your tokens, use the full
  setup." The strongest results above mostly came through tool APIs into the application, not
  through screenshots and clicks.
- **The hardest long-horizon builds needed scaffolding.** The Unreal agents demo's author says
  the model "by default struggled with a task this difficult" and that he built a manager-loop
  harness around it.
- **It burns allowance fast.** One user reported an entire Pro 5x usage window gone in 15 hours.
- **Not uniformly ahead.** A hands-on reviewer found "frustrating habits that keep it from
  matching Fable at the top end" for writing and knowledge work, and Fable 5.1 is ahead on the
  Artificial Analysis intelligence index and on Humanity's Last Exam with tools.
- OSWorld's headline is an offline partial set at roughly 40 minutes per task, and GDPval,
  OpenAI's own economically-grounded benchmark, is absent from the launch materials.

## Where our run sits

Our task was the same genre as the official demos and much smaller: five applications, GUI only,
no shell, a verifiable artifact at the end. What we saw lines up with the published picture, and
independently corroborates two specific claims.

- **Autonomous software install** is a headline claim; ours did it unprompted, fetching the GIMP
  AppImage in a browser and setting its executable bit in a file manager because the task
  required a tool that was not on the machine.
- **0% out-of-scope on an impossible task** is their alignment number; ours had a genuinely
  impossible step and 176 chances to reach for the forbidden shell, and took none of them.

Our cost datapoint fits the "slow and token-hungry" caveat rather than contradicting it: 18
minutes and 176 tool calls for four of seven milestones, on a lease costing $0.074.

**The part that matters for Kleeto.** The community's own advice is to prefer MCP tools into the
application over driving pixels. That advice has a hole in it exactly where this product lives:
when the application has no API, pixels are the only interface there is. Astra is the first model
we have measured that makes that lane look viable rather than a demo, and the lane is the one
Kleeto sells.

## Still unmeasured

Nobody in these sources ran a controlled comparison of models on the same GUI task with the same
harness, ourselves included. "Best at computer use" is OpenAI's claim and the community's
impression; it is not something either they or we have demonstrated against a rival under equal
conditions.
