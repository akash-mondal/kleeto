# Thirty handoffs for the launch video, in real apps

Three situations, ten each. Every one moves work between applications people actually use, on
a rented desktop or browser that is already signed in. The first cut of this list used only
what ships preinstalled; that constraint is gone now that a lease can boot a custom image and a
browser can open with a saved profile, so the list is rebuilt around the apps themselves.

**What makes this possible now**

- **Signed-in browsers.** Solari keeps saved profiles (cookies plus localStorage) that a session
  starts with, so the agent lands already logged into Slack, Notion, HubSpot, Gmail, WhatsApp
  Web and the rest. A connected password manager signs the agent in with no human involved;
  without one, the agent hands a link to a person who logs in once while it waits, and never
  sees the credentials. On this account: nothing connected yet, no profiles saved. Setup is at
  console.getsolari.com/settings/connections, then one login per site.
- **Custom desktop images.** A template is built from the workstation base with anything apt
  can install, or a machine is snapshotted after installing by hand. Slack desktop, VS Code,
  Zoom, DBeaver, Spotify, Telegram, Obsidian, DaVinci Resolve, Kdenlive, KiCad and FreeCAD all
  run on Linux. The template route with a full toolset is being verified now.

**Rules that stay.** The agent adds to cart and drafts orders but never pays for anything.
Reservations and free bookings are fine. Use dedicated demo workspaces for the work apps (a
Slack workspace, a HubSpot portal, a Notion team, a Shopify dev store, Stripe test mode) so a
session cookie on a rented machine is never a real company's. Personal apps are yours by
nature; scope one profile per site and revoke after the shoot. Sites with heavy bot defence
(Ticketmaster, Instagram, LinkedIn at volume) need the stealth pool, which is currently empty;
everything below works on the normal pool.

Stars mark what I'd shoot.

---

## A · Work: a Slack ping

**A1 ⭐ The churn.** Slack: "Northwind just cancelled. Do we know why?"
You: "Find out why Northwind churned. Pull the deal history, their support tickets, any failed
payments and their usage curve, write it up in Notion, and put the summary in the thread."
Chain: HubSpot (deal timeline), Zendesk (tickets), Stripe (payments), Mixpanel (usage), Notion
(post-mortem page with screenshots), Slack (reply in thread). Six apps. Plays because each tab
adds a piece of the answer and the thread reply lands while you're still walking.

**A2 ⭐ The design review.** Slack: "Review moved to 3. Can the new screens get into the deck?"
You: "Export the four onboarding frames from Figma, drop them into the review deck on the
screens section, keep the template, and reply with the link."
Chain: Figma (export frames), Google Slides (insert, match layout), Google Drive (link), Slack.
Plays because a design appears in a deck without anyone touching either.

**A3 The prod bug.** Slack: "Uploads failing for some users since this morning."
You: "Find the error in Sentry, trace it to the commit, open a Linear ticket with the stack
trace and the commit link, and reply in the thread with what you found."
Chain: Sentry (error, first seen), GitHub (blame, PR), Linear (ticket with links), Slack.
Plays because the culprit commit appears on screen.

**A4 The overdue invoice.** Slack: "#4471 is 30 days overdue."
You: "Pull invoice 4471, draft the reminder from our template with the amount and the link,
log it on the deal, and leave the email for me to send."
Chain: Stripe (invoice and hosted link), Gmail (draft from template), HubSpot (note on the
deal), Slack. Stops at the draft. Plays because you approve it from your phone in one tap.

**A5 ⭐ The landing page.** Slack: "New pricing page is on staging, ok to publish?"
You: "QA the pricing page on staging at phone, tablet and desktop widths, run Lighthouse,
click every button, screenshot anything broken, and put the report in Notion."
Chain: Webflow preview, Chrome DevTools device modes, Lighthouse, Notion QA report with
screenshots, Slack. Plays because the page gets squeezed through three sizes on screen.

**A6 The standup numbers.** Slack: "Standup in 20, who has this week's numbers?"
You: "Pull this week's signups, activation and revenue, append them to the metrics sheet,
refresh the chart in the standup deck, and post the three numbers in #standup."
Chain: Metabase or Mixpanel, Google Sheets (append row), Google Slides (chart refresh), Slack.
Plays because the chart moves.

**A7 The shortlist.** Slack: "42 applicants for the backend role. Anyone good?"
You: "Score the 42 applicants in Airtable against the job spec. Check GitHub for anyone who
listed one. Top eight in a view with a line each on why, and post the view link."
Chain: Airtable, GitHub (profiles, recent repos), Airtable scoring view, Slack. Plays because
the ranked view fills in.

**A8 The demo environment.** Slack: "Prospect wants to try it this afternoon."
You: "Spin up a demo tenant for Acme on staging, seed it with sample data, create a 30-day
coupon in Stripe test mode, and draft the welcome email with the link and code."
Chain: Vercel or the admin panel (tenant), the app itself (seed data through the UI), Stripe
(coupon), Gmail (draft). Plays because a working product appears for someone who doesn't
exist yet.

**A9 The release notes.** Slack: "Can someone write up what shipped this week?"
You: "Take this week's merged PRs, watch the ten minutes of Thursday's demo recording that
covers them, and write the release notes in Notion with a screenshot per feature. Post to
#announcements."
Chain: GitHub (merged PRs), Zoom cloud recording (transcript and frames), Notion, Slack.
Plays because a screenshot lands next to every bullet.

**A10 The battlecard.** Slack: "Competitor launched. Sales is asking."
You: "Build a battlecard for the launch: their pricing page, the Product Hunt thread, their
G2 reviews from the last month, our positioning doc. One Notion page, post it to #sales."
Chain: competitor site, Product Hunt, G2, Notion (existing doc and new page), Slack. Plays
because five sources collapse into one page.

---

## B · Personal: a DM from someone

**B1 ⭐ The trip.** WhatsApp from a friend: "Lisbon in October? 4 nights."
You: "Plan Lisbon, four nights around the second weekend of October. Flights from here,
three Airbnbs under 150 a night near Alfama, hold the dates in my calendar, start a Splitwise
group, and put the options in a Notion page. Reply to Marco with the link."
Chain: Skyscanner, Airbnb, Google Maps, Google Calendar, Splitwise, Notion, WhatsApp Web.
Seven apps. Plays because the reply lands in the chat he sent it from.

**B2 The dinner.** WhatsApp from your partner: "Kims on Saturday?"
You: "Book a table for four on Saturday at eight somewhere Korean within twenty minutes,
rated over four and a half. Put it in both our calendars and send the Kims the address."
Chain: Google Maps, OpenTable (reservation), Google Calendar (two invites), WhatsApp. Plays
because a reservation is a real-world outcome with no money moving.

**B3 ⭐ The wedding photos.** WhatsApp from your mum: "can you send me the wedding photos of
us"
You: "Find the wedding photos with Mum and Dad in Google Photos, put them in a shared album,
and send her the link."
Chain: Google Photos (album, face filter), shared link, WhatsApp. Three apps, one of the most
relatable asks alive. Plays because the album fills with the right faces.

**B4 The camera.** DM from a friend: "you never use that camera, sell it"
You: "Price my camera body against the last month of sold listings on eBay, write the
listing with the specs from the manufacturer's page, make the cover photo in Canva, and draft
it on eBay up to the publish button."
Chain: eBay sold listings, manufacturer site, Canva, eBay draft. Stops before publish, on
purpose. Plays because the listing photo appears in Canva.

**B5 The gift.** DM from your brother: "dad's 60th, ideas? budget 150 split"
You: "Shortlist five gifts for Dad under 150 from his Amazon wishlist and Etsy, put them in
a Notion page with photos and prices, and send Rahul a WhatsApp poll."
Chain: Amazon (wishlist, reviews), Etsy, Notion, WhatsApp (poll). Plays because the poll
appears in the chat.

**B6 The concert.** DM: "they're playing Friday, in?"
You: "Check whether Friday's show still has tickets and what they cost, check my calendar
for a clash, estimate the Uber home after, and reply with a yes or no and the numbers."
Chain: the venue's site or Eventbrite, Google Calendar, Uber estimate, WhatsApp. Plays because
the answer is one line and the working is four apps.

**B7 The reel.** DM from a friend: an Instagram reel of a recipe and "make this"
You: "Pull the recipe out of this reel, scale it for six, add the ingredients to an Instacart
cart, and put the recipe in my Notion cookbook."
Chain: Instagram (reel, captions), Notion, Instacart (cart, no checkout). Plays because a
video becomes a shopping cart.

**B8 The bill.** DM from your roommate: "electric bill?"
You: "Get this month's electricity bill from the utility portal, split it three ways in
Splitwise, and send Sam the breakdown."
Chain: utility portal (signed in), Splitwise, WhatsApp. Plays because a boring chore ends in
ten seconds.

**B9 The half marathon.** DM from a running friend: "you in for the half in March?"
You: "Pull my last three months from Strava, build a twelve-week plan to a half in March in
Google Sheets, put the long runs in my calendar, and send Priya the plan."
Chain: Strava, Google Sheets, Google Calendar, WhatsApp. Plays because your own data drives
the plan.

**B10 The move.** DM from your partner: "rent's going up 12%"
You: "Compare staying against the six two-beds on Zillow under our new rent within a
thirty-minute commute of both our offices, with commute times, in a sheet. Send her the top
three."
Chain: Zillow, Google Maps (two commutes each), Google Sheets, WhatsApp. Plays because the
sheet has a column for each of you.

---

## C · On the spot: a photo

**C1 ⭐ The business card.** Photo of a card at a conference.
You: "Add them to HubSpot, find them on LinkedIn, draft a follow-up for tomorrow morning,
and hold thirty minutes with them next week."
Chain: HubSpot (contact), LinkedIn (profile), Gmail (scheduled draft), Google Calendar (hold).
Plays because you're shaking the next hand while it works.

**C2 ⭐ The receipt.** Photo of the lunch receipt.
You: "Split this between the four of us, Anna's on the veggie, and request the money."
Chain: Splitwise (itemised split), WhatsApp (requests to each). Plays because everyone's phone
buzzes at the table.

**C3 The sofa.** Photo of a sofa in the store.
You: "Find this sofa on their site, check it fits the living room, compare the price online,
and put it in the flat's Notion page with the render."
Chain: retailer's site (model, dimensions, stock), Blender (room model, render), Google
Shopping, Notion. Plays because "does it fit" gets a picture, not a number.

**C4 The whiteboard.** Photo of the whiteboard after a meeting.
You: "Rebuild this on the team FigJam, write the action items into Linear assigned to whoever's
initials are on them, and post both links in #product."
Chain: FigJam, Linear, Slack. Plays because initials on a whiteboard become tickets with
owners.

**C5 The poster.** Photo of a gig poster on a wall.
You: "Are there tickets for this? Check my calendar, and if I'm free put a hold in and send the
group the link."
Chain: the venue's site, Google Calendar, WhatsApp group. Plays because a poster becomes a
plan.

**C6 The bookshop.** Photo of a book cover.
You: "Is this worth it? Goodreads rating, cheapest price online, and whether the library has
it on Libby."
Chain: Goodreads, Bookshop or Amazon, Libby. Plays because the answer is "the library has
it, free, Thursday."

**C7 The dashboard light.** Photo of a warning light on the car.
You: "What is this, how urgent, book the nearest garage that can look at it this week, and
put it in my calendar."
Chain: the manufacturer's manual online, Google Maps (garages), the garage's booking page,
Google Calendar. Plays because the calendar entry appears while you're still in the car.

**C8 The bike part.** Photo of a broken part on the bike.
You: "Identify this, find the exact part on the maker's site and one shop that has it in
stock, add it to the cart, and save the fitting video to my Notion."
Chain: manufacturer site, a bike shop (cart, no checkout), YouTube, Notion. Plays because a
broken thing gets a plan.

**C9 The colleague's screen.** Photo of an error on a colleague's laptop.
You: "Find this error in Sentry, see if it's already filed, if not open a GitHub issue with the
screenshot, and tell Jamie in Slack what it is."
Chain: Sentry, GitHub issues, Slack. Plays because it's the office version of the bike part.

**C10 The grocery list.** Photo of a handwritten list on the fridge.
You: "Build this as an Instacart cart from our usual store, swap anything out of stock for
the closest thing, and add the total to Splitwise."
Chain: Instacart (cart, no checkout), Splitwise. Plays because handwriting becomes a cart.

---

## What I'd shoot

A1 the churn (six apps, one answer), B1 the trip (seven apps, the reply lands in the chat it
came from), C1 the business card (four apps while you're still shaking hands). Alternates:
A5, B3, C2. Every one needs the profiles set up first; that is a one-time afternoon of
logging into demo workspaces, and then the whole list is open.
