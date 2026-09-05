# Five chained scenarios
Each one crosses at least three lanes, settles 4-8 separate x402 payments, and needs real
reasoning between phases. `[$]` marks an on-chain settlement.

The shape that repeats: **browser gathers what has no API -> machine reasons over it ->
desktop turns it into the thing a human actually receives.** No single service in the category
can do all three; that is the point.

---

## 1. Pricing teardown
*"We're launching next month. Work out what to charge."*

| # | Lane | Step |
|---|---|---|
| 1 | browser `[$]` | rent a browser; open 8 competitor pricing pages |
| 2 | browser | extract tiers, prices, limits, overage terms |
| 3 | browser | two pages render pricing only after a JS toggle -> screenshot + read visually |
| 4 | browser `[$]` | credits low mid-scrape, top up without losing the session |
| 5 | browser | save rrweb replay; release |
| 6 | machine `[$]` | rent machine, mount a volume |
| 7 | machine | **the hard part:** normalise incomparable units - per seat/month, per 1k calls, per GB, annual-only discounts, "contact us" tiers - into one comparable ladder |
| 8 | machine | compute effective $/unit at 3 usage volumes; find the gap in the ladder |
| 9 | machine | matplotlib price-ladder chart -> PNG |
| 10 | machine | write findings to the volume; release |
| 11 | desktop `[$]` | rent desktop, mount the same volume |
| 12 | desktop | LibreOffice Calc: build the model with a scenario tab |
| 13 | desktop | Impress: deck with the chart and the recommendation |
| 14 | desktop `[$]` | top up; export both to PDF |
| 15 | — | hash every artifact, settle, one receipt |

**Delivers:** `.ods` model, `.pdf` deck, chart PNG, and the scrape replay as the source of truth.
**Why it needs us:** the prices exist only as rendered pages; the model must be a real
spreadsheet a human can edit; and the receipt proves the numbers in the deck came from those
exact pages on that exact day.

---

## 2. The application that closes the loop
*"Find the grant we qualify for, and apply."*

| # | Lane | Step |
|---|---|---|
| 1 | browser `[$]` | search funding portals; shortlist open calls |
| 2 | browser | download each call's criteria PDF |
| 3 | machine `[$]` | parse the PDFs; extract hard eligibility rules |
| 4 | machine | **reasoning:** score us against each rule, flag the two we fail and the one that is ambiguous |
| 5 | machine | pick the single best-fit call; draft the narrative sections |
| 6 | desktop `[$]` | LibreOffice Writer: assemble the application to the required template |
| 7 | desktop | Calc: build the mandated budget table |
| 8 | desktop `[$]` | export to PDF at the required page limit; verify in Evince |
| 9 | browser `[$]` | **rent a second browser**, open the portal, fill the form, attach the PDFs |
| 10 | browser | stop at submit; screenshot the filled form for approval |

**Delivers:** a completed application, attachments, and a screenshot of the form pre-submit.
**Why it needs us:** it starts and ends in a browser with a full compute-and-authoring phase in
between — a browser company cannot do the middle, a sandbox company cannot do the ends.
**Archetype:** "regulated, verifiable outcome" — the research found nobody has done this.

---

## 3. Evidence chain
*"Diligence this supplier before we sign."*

| # | Lane | Step |
|---|---|---|
| 1 | browser `[$]` | company registry: filings, officers, incorporation date |
| 2 | browser | screenshot **every** source page as it is read |
| 3 | browser | sanctions/press search; capture results |
| 4 | browser `[$]` | top up; release with replay saved |
| 5 | machine `[$]` | cross-reference: do the officers appear elsewhere? do the filing dates line up with the claims on their site? |
| 6 | machine | **reasoning:** produce risk flags with a confidence and a *source pointer* for each |
| 7 | machine | hash every screenshot; build the evidence index |
| 8 | desktop `[$]` | Writer: memo with each claim footnoted to a source hash |
| 9 | desktop | export PDF; Evince check |
| 10 | — | merkle root over all evidence into one receipt |

**Delivers:** a memo where every assertion links to a hashed screenshot, and a receipt proving
the whole evidence set existed at that timestamp.
**Why it needs us:** this is the one workflow where the artifact-anchored receipt is not a nice
extra — it is the deliverable. A diligence memo whose sources cannot be proven is worthless.

---

## 4. Reconciliation
*"The vendor portal says one thing. Our ledger says another. Find the gap."*

| # | Lane | Step |
|---|---|---|
| 1 | browser `[$]` | log into a vendor portal that has no API |
| 2 | browser | page through statements, download the CSVs |
| 3 | browser `[$]` | top up mid-pagination; release |
| 4 | machine `[$]` | mount volume with our ledger export |
| 5 | machine | **reasoning:** join on fuzzy keys - dates shift by settlement lag, references are formatted differently, some lines are split across two rows |
| 6 | machine | isolate the true discrepancies from the artefacts of formatting |
| 7 | machine | chart the drift over time |
| 8 | desktop `[$]` | Calc: exception workbook, one tab per discrepancy class |
| 9 | desktop `[$]` | Writer: one-page summary; export PDF |
| 10 | machine | serve the workbook on a **preview URL** for the finance team |

**Delivers:** an exception workbook, a summary PDF, and a live link.
**Why it needs us:** the data is trapped behind a login, the join is genuinely hard, and the
output has to be a spreadsheet a finance person will open — three different machines.

---

## 5. Build, verify, hand over
*"Ship the integration and give me something I can pass to the client."*

| # | Lane | Step |
|---|---|---|
| 1 | browser `[$]` | read the third-party API docs; capture the auth flow and rate limits |
| 2 | machine `[$]` | build the integration; run it against the sandbox API |
| 3 | machine | **reasoning:** the docs are wrong about pagination - detect it from live responses and adapt |
| 4 | machine | start the dev server; get a **preview URL** |
| 5 | browser `[$]` | **rent a second browser**; visit our own preview URL as a user |
| 6 | browser | click through, read console + network, find the failure |
| 7 | machine `[$]` | fix; redeploy |
| 8 | browser | re-verify; save the passing run as an rrweb replay |
| 9 | desktop `[$]` | Writer: handover doc with screenshots and the runbook |
| 10 | desktop | export PDF; Evince check |

**Delivers:** working code, a live preview URL, a QA replay, and a handover PDF.
**Why it needs us:** the machine that writes the code and the browser that tests it are
*different rented computers*, and the QA replay is independent evidence the build worked.

---

## What these have in common
- **4-8 settlements each**, including mid-session top-ups that do not lose state.
- **Three lane families per run**, chosen for what each is actually good at.
- **A hard reasoning step in the middle** that is not scraping and not formatting: normalising
  incomparable units, scoring against ambiguous rules, fuzzy-joining dirty ledgers, detecting
  that documentation is lying.
- **A human-shaped deliverable** at the end - a spreadsheet, a deck, a memo, a filled form -
  not a JSON blob.
- **Volumes carry state between lanes**, so the machine phase does not re-download what the
  browser phase already fetched.
- **One receipt covers the whole chain**, with a merkle root over every artifact.

## Filming note
These are 3-8 minute runs. For clips, cut the **transition moments**: the browser dying and the
machine coming up two seconds later, the same volume appearing in a different computer, the
meter ticking through five separate payments. The chain is the story, not any single app.
