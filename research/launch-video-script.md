# Kleeto launch video: an afternoon out

**The idea in one line.** You spend the afternoon out. Your agent spends it working, on computers
it rents by the second and pays for itself. You paid for your afternoon; it paid for its own.

**Why this frame.** Every agent demo on the internet is "look what it did." This one is "look
what it *paid for*." The receipt at the end is the product. A running tally on screen, your
spend against its spend, carries the whole video without a single line of pitch.

**Shape.** Cold open, four handoffs, one chained finale, the receipt. About 100 to 110 seconds.
Each handoff: you speak one line to your phone; cut to the machine coming up (real 402, real
payment, real boot); time-lapsed work with the agent pointer; the artifact on your phone.

**Rules kept.** Every screen is a real lease. Nothing is a mockup. The agent never buys anything;
it researches before you buy. Every task ends in an artifact that can be checked. The finale is
the browser to machine to desktop chain.

**Recording the handoffs.** One breath each. State the job, the constraint, and where the result
goes. No "please", no "can you". Talk to it the way you'd talk to someone good.

---

## 0 · Cold open · outside a coffee shop, phone at arm's length

> I'm taking the afternoon off. My agent isn't. It's going to rent computers by the second and
> pay for them itself, and I'll read its receipts when I get home.

On screen under you, small: `you $0.00 · agent $0.00`. Every beat updates it.

## 1 · The bike · outside a bike shop, or at the coffee shop table

*Solari category: Web Scraping, Browser Agents. Site with no API. Lane: browser-fast, $0.11/hr.*

> Find me a used road bike. Craigslist, under six hundred, within fifteen miles, photos only.
> Best eight, with price, frame size and the link, and tell me which ones look overpriced.

Agent, on screen, one line at a time:
`402 · browser-fast · $0.11/hr · paying in USDC`
`200 · up in 1.2 s`

Screen: Chrome on Craigslist, filters set, listings opened one by one, the eight collected.
Artifact: the answer as a message on your phone, eight bikes with links, two flagged. You read it
at the table and say nothing; a glance is enough.

Tally after: `you $4.50 · agent $0.01`

## 2 · The apartment · walking past buildings, or inside a furniture store

*Solari category: Computer Use, Bring Your Own Environment. Lane: desktop-4 (the creative
snapshot with Blender preinstalled), $0.274/hr.*

> Open the apartment file in Blender. Move the sofa to the window wall, put the camera at the
> front door looking in, render it at 1080, and save it to the shared folder.

Agent: `402 · desktop-4 · $0.274/hr` → `200 · up in 1.3 s`

Screen: Blender, the sofa selected and slid across, the camera placed, the render bar, the
image. The agent pointer with its tag on every move. Time-lapsed to about ten seconds.
Artifact: `render.png`, opened on your phone while you're still in the store.

Tally after: `you $4.50 · agent $0.07`

## 3 · The price lists · grocery aisle, comparing two things on a shelf

*Solari category: Document Workflows. Lane: desktop-2, $0.148/hr.*

> Those three supplier price lists I saved are PDFs. Pull my items out of each one, side by
> side in a sheet, cheapest supplier highlighted, and export a PDF I can read on my phone.

Agent: `402 · desktop-2 · $0.148/hr` → `200 · up in 1.3 s`

Screen: the PDFs open in Evince, LibreOffice Calc filling column by column, the highlight, the
export dialog. This is the beat that says "no API": nobody scrapes a PDF from a supplier.
Artifact: `compare.pdf` on your phone, in the aisle.

Tally after: `you $31.20 · agent $0.10`

## 4 · The build · lunch, phone flat on the table

*Solari category: Long-Running Automation, End-to-End Testing. Lane: machine-2, $0.126/hr.*

> Run the tests on the shop repo. If they pass, build it and put it on a link I can open
> from here.

Agent: `402 · machine-2 · $0.126/hr` → `200 · up in 0.8 s`

Screen: the terminal, tests streaming, the build, a preview URL printed on the last line.
Artifact: the link. You tap it at the lunch table and the site loads. This is the one beat
where the artifact is opened live on camera; hold the lease until the shot is done.

Tally after: `you $47.80 · agent $0.11`

## 5 · Finale · park bench, late light · the chain

*Solari categories: Browser Agents, Document Workflows, chained browser → machine → desktop.
Lanes: browser-fast, machine-2, desktop-2.*

> Take the eight bikes from this morning. Grab each listing's photo, put them on a one-page
> poster with the prices, and give me the PDF.

Agent: three 402s in a row, each paid, each up in about a second. Show all three.

Screen: browser pulling the photos, the machine hashing and resizing them, Inkscape laying
out the page, the export. The chain is the point, so let each machine appear and disappear.
Artifact: `poster.pdf`. You look at it on the bench. First and last beats are the same bike.

Tally after: `you $47.80 · agent $0.15`

## 6 · The receipt · home, laptop or phone

Open the receipts. Read the real numbers, whatever they are on the day; do not round up.

> [Six] machines today. [Fifty-one] minutes between them. It paid [fifteen] cents, from its
> own account, in USDC on Hedera. Every one of those seconds is on a public ledger, and you
> don't need me to check it.
>
> I spent forty-eight dollars on lunch and a bike I didn't buy.

Card: **Your agent's own live desktop. Paid by the second.** · kleeto.fun

---

## Production notes

**Shoot the agent side first.** Rehearse each task on a real lease until it completes cleanly,
record the screen with the pointer overlay, keep the artifacts. Then film your pre-roll to match
what actually happened. The other way round, you're waiting on a bench for eighteen minutes.

**The agent.** gpt-6-astra through the Solari MCP tools is proven on exactly this kind of GUI
chain (Chrome, Calc, chart wizard, PDF export, file manager, an unplanned software install) and
was honest when a step was impossible. Token cost is irrelevant at this scale.

**Timings from what we've measured.** Four milestones took astra 18 minutes; every task above is
sized under that. Task 3 is the slowest: keep the list to eight items, not twenty. Task 2 needs
the creative snapshot. Task 4 needs a repo with a real test suite and a static build; preview
URLs are verified working.

**The tally.** The agent's figures come from the receipts, never typed in. Your figures are
whatever you actually spent. If lunch was thirty-one dollars, say thirty-one.

**The handoff UI.** There isn't one, and the video does not need one. You speak; the next thing
on screen is the real 402 in the real terminal. No phone app, no chat bubble, nothing to fake.

**What to cut if it runs long.** Task 3. Keep the finale; it's the only beat that shows all
three lanes and closes the loop on the bike.
