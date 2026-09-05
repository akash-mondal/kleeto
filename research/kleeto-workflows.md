# Ten workflows for Kleeto
Every capability referenced here was verified live on 2026-09-04. Lanes: machine-{1,2,4,8},
desktop-{2,4}, browser-fast. Flags: [P] needs the paid upstream plan, [C] needs >1 concurrent
machine (Starter), otherwise runs on the free tier today.

---

## 1. The build-and-check loop
**machine-2 -> browser-fast** (cross-lane) [C]
Agent is given a feature request. It rents a machine, writes the app, starts a dev server, and
gets a **public preview URL**. It then rents a *separate browser lane* and visits its own
preview URL as a user would — clicks through, reads console and network logs, finds the 500 on
submit, returns to the machine lane, fixes it, and re-checks. Ends with an rrweb replay of the
QA pass and a receipt whose artifact hashes cover the built app.
**Proves:** preview URLs, cross-lane orchestration, one workflow paying two different services.
**Hard to fake:** the QA browser is a different rented machine from the one that wrote the code.

## 2. The office job nobody can API
**desktop-2, human watching** (free tier)
A folder of scanned PDFs and a template. The agent opens Chrome, reads a source, opens
LibreOffice Writer, types a memo, saves it, exports a PDF, and opens it in Evince to confirm it
rendered. A human watches the whole thing over the read-only VNC proxy and **takes the mouse**
when a dialog traps the agent, then hands control back.
**Proves:** multi-app desktop, live view, human-in-the-loop takeover, mp4 recording.
**Hard to fake:** four native GUI apps, on video, on a machine that did not exist a minute ago.

## 3. The dataset that outlives the machine
**machine-4 + volume** (free tier)
Lease one: agent mounts a fresh volume, pulls a large dataset into `/data`, builds an index,
releases the machine. Lease two, an hour later: a *different* machine mounts the same volume and
starts querying in seconds. The meter shows the second lease costing a fraction of the first
because the download never happens twice.
**Proves:** volumes outliving leases; the cost saving is visible in tinybars, not asserted.

## 4. Warm state as a product
**machine-2 + snapshot** (free tier)
Agent A pays to install a heavy toolchain, snapshots the machine, and lists the snapshot in the
catalogue with a price. Agent B rents *from that snapshot* and skips the setup entirely, paying
A a cut on every launch via the settlement split.
**Proves:** snapshot/fork, and an agent selling to another agent.
**Honest framing:** forking carries *state*, not speed — restore measured at 15–69s versus
~1s for a fresh boot. Sell it as "skip the install", never as "instant fan-out".

## 5. The budget that actually binds
**browser-fast + machine-1, $0.50 ceiling** (free tier)
The agent is given a hard budget and a research question. It reads the lane catalogue, picks
the cheapest lane that can do each step, tops up mid-session when credits run low, and when the
budget is exhausted the meter **pauses the session rather than overdrawing**. The final receipt
reconciles every tinybar against seconds held.
**Proves:** metering, top-up without losing state, pause-at-zero, price-aware lane selection.
**Owns the whitespace:** nobody in the sandbox category writes about the runaway agent.

## 6. One agent hires another
**A2A, two wallets, two lanes** [C]
Agent A needs a rendered chart and cannot make one. It discovers Agent B's service in the
catalogue, pays B over x402, and B rents a machine lane, produces the chart, and returns it with
a signed receipt. **A verifies B's receipt from the mirror node before accepting the work** —
checking the artifact hash matches the file it actually received.
**Proves:** agent-to-agent settlement, HCS-14/ERC-8004 identity on the receipt, receipts as a
trust primitive rather than a billing artifact. Directly hits the bounty's A2A extra point.

## 7. The overnight job that sleeps
**machine-4, pause + scheduled top-up** (free tier)
A long build runs, then blocks waiting on something slow. The agent **pauses the lease** — RAM
and disk preserved, meter stopped, upstream slot released — and a **Hedera Scheduled
Transaction** tops the credit pool up before expiry so the machine wakes and continues. Morning:
finished work, and a bill that charges nothing for the hours it slept.
**Proves:** pause economics and Scheduled Transactions (bounty extra point) in one story.

## 8. The app with no API
**desktop-4, GIMP/Inkscape via a custom lane** (free tier, template build required)
A batch of images needs the same non-trivial edit. There is no API and no CLI flag for it. The
agent opens the GUI app, performs the edit on one image while a human watches, saves that as a
reusable routine, then applies it across the batch.
**Proves:** computer-use on sealed software; custom template lanes.
**Note:** needs a `desktop-creative` template built ahead of time (multi-minute apt install).

## 9. Provenance across three lanes — *the showcase*
**browser-fast -> machine-2 -> desktop-2** (cross-lane) [C]
A browser lane gathers source data and its replay is recorded. A machine lane processes it into
a dataset and a chart. A desktop lane assembles a formatted report and exports a PDF. **Each
step's artifact hash is chained into the next**, and one receipt covers the whole workflow: a
merkle root over every file produced, on HCS, with the replay id and final screenshot hash.
A stranger can take the receipt and verify — from the free mirror node, holding no credentials —
that *this exact PDF* came out of *that exact paid workflow*.
**Proves:** the entire differentiator. Three services, one payment trail, verifiable output.
**Nobody else has this:** the sandbox category proves nothing about output; the payments
category proves nothing about the work.

## 10. Catch the seller cheating
**any lane, adversarial** (free tier)
Run the same job twice: once honestly, once with the seller over-reporting the seconds held. An
auditor with **no account, no API key and no relationship to either party** recomputes both
bills from the mirror node and shows exactly which one does not reconcile — because the burn
checkpoints are hash-chained and the settlement anchor costs the seller real HBAR to write.
**Proves:** why this is on Hedera at all. Turns "trust us" into "check it yourself".
**Judge-facing:** this is the one that answers "why not just use Stripe".

---

## Ranking for the 5-minute video
1. **#9 provenance across three lanes** — shows every lane, ends on verifiable output.
2. **#2 the office job** — most visually legible; the human takeover is the moment people remember.
3. **#5 the budget that binds** — the meter is the product; cheapest to film.
4. **#6 one agent hires another** — best extra-points story.
5. **#10 catch the cheat** — best closing argument.

## Cheapest-to-build order
#5 -> #2 -> #3 -> #1 -> #9 -> #7 -> #10 -> #4 -> #6 -> #8
