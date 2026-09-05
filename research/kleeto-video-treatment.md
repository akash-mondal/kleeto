# Kleeto — five demos
Rewritten after studying the GPT-6 Astra launch (3 Sep 2026) and the 20 highest-performing
agent-infra demos. The earlier office-document treatment is discarded.

## What the evidence says
**From Astra:** demos travel when the agent drives software the viewer *cannot use themselves*
(KiCad, Blender, Unreal) and produces a **falsifiable artifact** — an STL you can print, a routed
PCB, a 3,295-object scene. Wall-clock timers on screen. OpenAI time-lapsed only the KiCad clip
and left the mundane browser errands at real speed.

**From the infra category:** shareable = **20-40s, one task, one artifact, legible from a muted
thumbnail**, with the claim stated in the first line of the post. Forgettable = infrastructure
b-roll (pools, IPs, telemetry). Daytona, Steel, Runloop, Blaxel, Tensorlake and Bytebot all sit
in the low thousands of views for exactly this reason.

**The two unclaimed archetypes, both ours:**
1. *"Cost as the reveal — a demo whose entire punchline is the invoice is unclaimed."*
2. *The failure video* — nobody ships an honest "here is how it broke and what stopped it."
And the gap in Astra's own launch, per StartupHub: *"The video shows outcomes, not guardrails.
There is no latency, no failure rate, and no permission model."*

**Format rule:** each demo below is a standalone 25-45s clip that works alone on X, and the five
cut together into the 5-minute bounty video with the meter HUD running throughout.

---

## 1. The workstation it rents for four tenths of a cent
**Claim (first line of the post):** *"My agent needed Blender. It didn't have Blender, an
account, or a credit card. Total cost: $0.004."*

| Beat | On screen |
|---|---|
| Agent has a task and a $0.40 wallet | no API key, no account |
| `402` -> pays -> **desktop up, 0.9s** | stopwatch overlay, real time |
| Blender opens, models and renders | ceiling app; time-lapse this part only |
| Render appears | **the falsifiable artifact** |
| `.blend` + `.png` hashed into the receipt | `sha256 a3f1…` |
| Machine destroyed | HUD freezes: **$0.004** |

Ceiling app + falsifiable artifact + cost reveal in one clip. `kicad` (6.0.2) is the alternate
if we want to mirror Astra's own headline demo on rented hardware.

## 2. The runaway, stopped
**Claim:** *"Everyone shows you what their agent can do. Nobody shows you what happens when it
goes wrong."*
Split screen, same agent, same broken task — one that loops.

| Left: no ceiling | Right: on Kleeto |
|---|---|
| runs, and runs, and runs | runs |
| counter climbing | credits draining |
| still running | **credits hit 0 -> session PAUSES, does not overdraw** |
| you find out on the invoice | machine destroyed, state saved, exact spend shown |

Hits both unclaimed archetypes at once — the failure video *and* cost — and answers the exact
critique levelled at Astra's launch. Plays at real speed; this one must not be time-lapsed.

## 3. Inside the editor you already have open
**Claim:** *"Claude Code just rented itself a Linux desktop, mid-session, and paid for it."*
No new UI. The agent the viewer already runs gains a computer through the Kleeto MCP server:
asks for a lane, hits `402`, pays, works, tears it down — all inside the terminal they know.
Ends on the HashScan link in the transcript.

This archetype is wildly efficient for small teams: Hyperbrowser's `/docs fetch` clip for Claude
Code did **299k views** on a 26-second terminal capture. We already have this working with Cline
+ GLM-5.3-Flash and the Solari MCP.

## 4. One agent hires another, and checks its work
**Claim:** *"Agent A never trusted agent B. It checked the hash."*

| Beat | On screen |
|---|---|
| A needs a render it cannot produce | two wallets |
| A finds B in the catalogue, pays over x402 | HashScan link |
| B rents a lane, renders, returns the file | artifact lands in A's pane |
| **A hashes the received file vs B's receipt** | **MATCH** |

Money changing hands between two agents is the strongest autonomy signal in the category
(Uber Eats burger, the coconut-or-car giveaway, Devin buying the office coffee). Ours adds the
part none of them have: the buyer verifies before accepting.

## 5. Recompute the bill yourself
**Claim:** *"We ran the same job twice. One bill is honest. Anyone can tell which."*
TinyFish published every one of its 300 benchmark runs in a public spreadsheet and got **386k
views** for transparency alone. Same move, sharper.

| Beat | On screen |
|---|---|
| two bills, honest and inflated | side by side |
| a stranger — no account, no key, no relationship | fresh terminal |
| one command recomputes both from the mirror node | rows scrolling |
| honest reconciles | **OK** |
| inflated fails | **MISMATCH at checkpoint 4** |
| what the seller paid to publish that number | real HBAR, unrecoverable |

Answers "why not Stripe" as a demonstration rather than a claim.

---

## Cutting the 5-minute bounty video
`3` (cold open, 35s) -> `1` (60s) -> `4` (60s) -> `2` (60s) -> `5` (75s) -> close on the HUD
total for the whole video, four decimals.

## Discipline carried from the research
- Claim in the first line, every time. The video only has to confirm it.
- One artifact per clip, visible in a muted thumbnail.
- Time-lapse only the modelling in #1. Everything else real speed — especially the pause in #2
  and the MISMATCH in #5.
- Wall-clock timers on screen wherever a duration is the point.
- No infrastructure b-roll. No pool diagrams, no telemetry dashboards.

## Blocked on
- Starter upstream plan for #4 (needs >1 concurrent machine).
- A warm Blender snapshot for #1 so the clip doesn't open with an apt install.
