# Thirty handoffs for the launch video

Three situations, ten pitches each. Every one drives more than one application or tab, ends in
a file you can hold up on your phone, buys nothing, and needs none of your logins on camera:
the Slack ping or DM is forwarded as text and the agent works from that. Lanes are Kleeto's
three (browser, machine, desktop). Stars mark the ones I'd shoot.

Grounding: the week's field reports show the same shape over and over. A photo of a Hot Wheels
car went into a kid's racing game. Zillow photos became a 3D house and a promo video. A floor
plan became a furnished walkthrough. A schematic became a routed PCB with Gerbers. A reference
photo was rebuilt in Canva element by element. Picture or message in, real software driven,
artifact out.

---

## A · Work: a Slack ping while you're out

**A1 ⭐ The deck.** Slack: "Client moved the review to 4, deck needs the Q3 numbers."
You: "Q3 numbers are in the shared folder. Update the client deck, keep the template, export
a PDF, and tell me which slides changed."
Chain: Calc opens the CSV and builds the chart, Impress opens the deck and takes the chart and
the new figures on the right slides, export to PDF. Artifact: `deck.pdf` plus a one-line change
list. Desktop lane. Plays because everyone has had this ping, and template-faithful decks are
one of Astra's named strengths.

**A2 ⭐ The broken checkout.** Slack: "Customer says checkout 500s on staging. Can you look?"
You: "Walk the signup and checkout on staging in a real browser, screenshot every step, find
where it breaks, pull the log for that request, and write it up."
Chain: browser lane drives the flow and records it, machine lane greps the server log for the
request id, desktop lane writes the bug report in Writer with the screenshots placed. Artifact:
`bug-report.pdf` and a replay link. All three lanes. Plays because the failure appears on screen
in real time.

**A3 The contract redlines.** Slack: "Legal sent v3 of the vendor contract, need a clean copy
and a list of what changed."
You: "Compare v3 against v2 in Writer, accept the price and date changes, reject anything
touching liability, and give me a clean PDF and a change log."
Chain: Writer's Compare Documents, accept and reject per rule, export clean PDF, second
document listing every change. Artifact: `contract-clean.pdf`, `changes.pdf`. Desktop lane.
Plays because document compare is a GUI-only ritual every office knows.

**A4 The alert.** Slack, from a bot: "Error rate on api-prod above 5% for 10 min."
You: "Open the Grafana dashboard, find which endpoint is failing and since when, hit it
yourself from a machine, and write an incident note with the panels."
Chain: browser tab on Grafana, second tab on the status page, machine lane curls the endpoint,
desktop lane writes the note with annotated panel screenshots. Artifact: `incident.pdf`.
Plays because Grafana already looks like a movie.

**A5 ⭐ The competitor.** Slack: "Competitor just published new pricing. Comparison by EOD?"
You: "Pull their pricing page, their docs on limits, and ours, put it in one table, mark where
they undercut us, and give me a one-page PDF."
Chain: four browser tabs, Calc table with the undercuts highlighted, export. Artifact:
`pricing-comparison.pdf`. Browser plus desktop. Plays because the tabs multiply on screen.

**A6 The price lists.** Slack: "Supplier sent the new price PDFs. Margin sheet needs updating."
You: "Three PDFs in the shared folder. Pull our SKUs out of each, update the margin sheet, flag
anything that dropped under 20%, and export it."
Chain: Evince open on each PDF, Calc updating the sheet, conditional highlight, export.
Artifact: `margins.pdf`. Desktop lane. Plays as the no-API beat: nobody scrapes a supplier PDF.

**A7 The board rev.** Slack: "Fab deadline is Friday and the USB-C connector has to move to
the bottom edge."
You: "Open the board in KiCad, move the USB-C connector to the bottom edge, re-route what
breaks, run DRC until it's clean, and export the Gerbers."
Chain: KiCad, DRC loop, Gerber and drill export, machine lane zips them onto a link. Artifact:
`gerbers.zip` and the DRC report. Desktop plus machine. Highest wow of the set and highest risk:
the field's PCB runs took hours. Rehearse or drop.

**A8 The images.** Slack: "Marketing needs the 30 product shots on white at 1200px by
tomorrow."
You: "Batch the 30 product shots to 1200 on white, fix by hand any where the cutout goes
wrong, and put them on a link."
Chain: machine lane batches them, desktop lane opens the ugly ones in GIMP and fixes them,
gThumb contact sheet, zip on a preview link. Artifact: the link, opened on your phone.
Plays because the contact sheet fills in as it works.

**A9 The new hire.** Slack: "Priya starts Monday, can we have her environment ready?"
You: "Build a desktop with our toolchain, open every app once and screenshot it working,
then snapshot it so we can boot copies."
Chain: machine lane installs, desktop lane opens each app and verifies, snapshot taken.
Artifact: a snapshot id and a sheet of screenshots. Plays because it shows Kleeto's snapshot
and fork, and the payoff is "boot ten of these tomorrow."

**A10 The reconciliation.** Slack: "Finance: yesterday's payouts CSV doesn't match the
invoices sheet."
You: "Match the payouts CSV against the invoices sheet line by line, list every mismatch with
the difference, and write a two-line summary at the top."
Chain: Calc with both files, lookup and diff, Writer summary, export. Artifact:
`reconciliation.pdf`. Desktop lane. Least visual of the ten, most relatable to a finance viewer.

---

## B · Personal: a DM from someone

**B1 ⭐ The apartment.** DM from a friend: a listing link and "this one?"
You: "Open the listing, rebuild the floor plan in Blender, put our sofa and the desk in the
living room at real size, and render it from the door."
Chain: browser tab on the listing and photos, Blender rebuild and furnishing, render. Artifact:
`living-room.png`. Browser plus desktop, the creative snapshot. Plays because it is the viral
Zillow-to-3D demo, done for a real decision you'd actually make.

**B2 ⭐ The dinner.** DM from your partner: "6 for Saturday, one vegetarian, keep it under 80."
You: "Plan Saturday dinner for six, one vegetarian, under eighty. Pick the recipes, price the
list at the store's site, and make me a shopping list and a menu card."
Chain: recipe tabs, the grocer's site for prices, Calc list with running total, Inkscape menu
card, PDF. Artifact: `list.pdf`, `menu.pdf`. Browser plus desktop. Plays in a supermarket.

**B3 The road trip.** DM: "still up for the coast drive? 4 days"
You: "Plan four days down the coast. Route it, pick a stop each night under two hours' drive
apart, and give me an itinerary with drive times and a map for each day."
Chain: OpenStreetMap routing, Wikipedia for the stops, Calc itinerary, Writer with map
screenshots, PDF. Artifact: `itinerary.pdf`. Browser plus desktop. Plays because the map
screenshots stack up on the page.

**B4 The lease.** DM from the landlord: "renewal attached, sign by the 15th"
You: "Compare the renewal against last year's lease, list every clause that changed with the
old and new wording side by side, and flag anything about rent, deposit or notice."
Chain: Evince on both, Writer compare, side-by-side table, PDF. Artifact: `lease-changes.pdf`.
Desktop lane. Plays as the moment the agent catches the clause you'd have missed.

**B5 ⭐ The listing.** DM from a friend: "selling my bike, can you help me list it?"
You: "Take the six photos, fix the exposure and crop them square, write a listing with the
specs from the manufacturer's page, and draft it on Craigslist up to the post button."
Chain: GIMP on the photos, browser tab on the manufacturer's spec page, Writer for the copy,
browser drafting the listing and stopping before submit. Artifact: the draft on screen and
the edited photos. Desktop plus browser. Plays because it stops one click short, on purpose.

**B6 The invite.** DM: "Sam's 30th, 20 people, can you make something?"
You: "Design a party invite for Sam's 30th, put the bar's address on it with a map, and give
me a PNG for the group chat and a PDF to print."
Chain: browser tab on the map, Inkscape design, exports at two sizes. Artifact: `invite.png`,
`invite.pdf`. Plays because you watch a design appear.

**B7 The phone stand.** DM from a friend: "want a phone stand for my desk, phone is
147 by 71, can you print one?"
You: "Model a phone stand for a phone 147 by 71 with a 15 degree lean, export the STL, check
the mesh is printable, and put it on a link with a viewer."
Chain: Blender or FreeCAD model, STL export, machine lane checks the mesh and serves a viewer
on a preview link. Artifact: `stand.stl` and the link, spun on your phone. Desktop plus
machine. Plays because a physical object appears from a text message.

**B8 The hike photos.** DM from your brother: "send the hike photos but make them look good"
You: "Fix the exposure on the forty hike photos, straighten the horizons, make a contact
sheet, and put the lot on a link."
Chain: machine lane batches, GIMP fixes the bad ones, gThumb contact sheet, link. Artifact:
the contact sheet and the link. Plays as the before-and-after grid.

**B9 The flight.** DM from a sibling: "flight's at 6am, drive or train?"
You: "For a 6am flight from ours, compare driving with parking against the first train:
door to gate time and cost. One line answer and the working."
Chain: train timetable site, map routing, airport parking page, Calc comparison, PDF.
Artifact: the answer as a message, the working attached. Browser plus desktop. Plays because
the answer arrives while you're mid-sentence about something else.

**B10 The episode.** DM: "can you turn my podcast episode into a post?"
You: "Watch the episode, pull the six best moments with a screenshot for each, and write it
up as a post with the screenshots placed."
Chain: browser on the video, screenshots, Writer article, PDF. Artifact: `post.pdf`. This is
the voice-to-article pattern from the field, on a rented desktop.

---

## C · On the spot: you take a photo and ask

**C1 ⭐ The sofa in the store.** Photo of a sofa at the furniture shop.
You: "Does this fit in the living room? Find its dimensions, put it in the apartment model at
size, and render it where ours is now."
Chain: browser tab for the product's dimensions, Blender places it in the model from B1,
render. Artifact: `sofa.png`, on your phone in the aisle. Browser plus desktop. Plays because
it answers the exact question you're standing there asking, and pays off B1.

**C2 ⭐ The napkin logo.** Photo of a logo sketch on a napkin.
You: "Vectorise this, clean up the curves, give me it in black and in our amber, and mock it
on a T-shirt and a business card."
Chain: GIMP cleanup, Inkscape trace and redraw, GIMP mockups, exports. Artifact: `logo.svg`,
`mockups.png`. Desktop lane. Plays because a napkin becomes a brand in a minute.

**C3 The whiteboard.** Photo of a flowchart on a whiteboard after a meeting.
You: "Redraw this as a clean diagram, same boxes and arrows, and give me an SVG and a PDF."
Chain: gThumb to read it, Dia or Inkscape to draw it, exports. Artifact: `flow.svg`. Desktop
lane. Plays because the whiteboard and the clean diagram sit side by side.

**C4 ⭐ The used bike.** Photo of a bike with a price tag at a shop.
You: "Is this a fair price? Find the model, check what it's listing for on Craigslist and the
manufacturer's site, and give me a range and a yes or no."
Chain: three browser tabs, Calc range, answer. Artifact: the answer and a small table.
Browser plus desktop. Plays because you get the answer before the shopkeeper comes back.

**C5 The shelf.** Photo of a product on a shelf with its price.
You: "Am I better off buying this here or online? Check three sites including shipping and
tell me, with the working."
Chain: three tabs, Calc comparison, answer. Artifact: the table. Browser plus desktop. Plays
in the "shopping" beat without buying a thing.

**C6 The receipt.** Photo of a lunch receipt.
You: "Add this to the month's expenses, split it into food and drink, and rebuild the chart."
Chain: machine lane OCRs it, Calc appends and recategorises, chart, PDF. Artifact:
`expenses.pdf`. Plays because the chart updates while you're still at the table.

**C7 The floor plan.** Photo of a floor plan on a wall in a show flat, or a sketch.
You: "Build this in 3D, furnish it plainly, and render it from the front door."
Chain: Blender build and furnish, render. Artifact: `plan.png`. Desktop, creative snapshot.
This is the floor-plan-to-walkthrough demo from the field, on a rented machine. Big wow,
longest rehearsal.

**C8 The breadboard.** Photo of a circuit on a breadboard.
You: "Draw the schematic for this in KiCad, find the part numbers, and give me a BOM with
prices from the distributor's site."
Chain: KiCad schematic, distributor tabs for parts, Calc BOM, PDF. Artifact: `schematic.pdf`,
`bom.pdf`. Desktop plus browser. Hardware wow, high risk.

**C9 The old photo.** Photo of a damaged print in a frame at a relative's house.
You: "Restore this, fix the tear and the fading, and give me a clean version and one
colourised."
Chain: machine lane upscales, GIMP heals the tear and corrects, colour pass, exports.
Artifact: `restored.png`, `colour.png`. Plays because it is the one beat with feeling in it.

**C10 The broken part.** Photo of a broken part on your bike or a bag.
You: "What part is this, where do I get it, and how do I fit it? Find the part number on the
maker's site, a shop that has it, and make me a one-page how-to with the diagram."
Chain: maker's site, a shop's site, Writer how-to with the exploded diagram placed, PDF.
Artifact: `fix.pdf`. Browser plus desktop. Plays because it's the thing you'd actually ask
standing there with a broken bag.

---

## If I were choosing the three

A2 the broken checkout (all three lanes, failure visible live), B1 the apartment (the viral
demo done for a real decision), C1 the sofa in the store (answers the question you're
standing there asking, and pays off B1). Alternates: A1, B5, C2.
