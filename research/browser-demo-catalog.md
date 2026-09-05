# Browser-agent demo catalog (Aug 2026)
Swept: X (441 tweets, 15 queries), GitHub (browser-use, stagehand, steel-cookbook, agent-browser, kernel templates, hyperbrowser examples), docs (browser-use.com/showcase 84 runs, browserbase templates/use-cases, kernel, tinyfish, anchor). URL form for X: https://x.com/<user>/status/<id>.

## Shopping / booking
1. Buy a Coconut, or a Car — public agent buys anything users convince it to; live cart/checkout on real stores ($100k giveaway). Browser Use. x.com/browser_use/status/2074892266859327995 (372L/105kV)
2. Gum-coupon hunt — terminal agent spends $7.21 trying coupon codes at a live checkout. Browser Use Terminal. x.com/browser_use/status/2064427610189566247 (289L/54kV)
3. "Watch your browser buy your groceries" — CLI drives your own Chrome through a grocery cart. x.com/browser_use/status/2060096100820979886 (258L/28kV)
4. NYC pizza to a "clanker" — finds nearby shop, reads menu, generates virtual card, orders. Indie. x.com/jimchang/status/2036072977268383835 (110L/39kV)
5. Pick adjacent cinema seats — Fandango seat map, 2 seats together for 7pm, stops before checkout. browser-use.com/showcase/pick-adjacent-cinema-seats
6. Find a bookable flight — Google Flights nonstop SFO-LAX, compare live. browser-use.com/showcase/find-bookable-flight
7. Compare a multi-city flight — multi-leg itinerary. browser-use.com/showcase
8. Finish a Home Depot pickup cart. showcase
9. Add groceries to cart (DoorDash). showcase
10. Build the cheapest cart (Instacart, lowest unit price). showcase + examples/use-cases/buy_groceries.py
11. Hold a live restaurant table (OpenTable). showcase/category/travel
12. Hotels 5 minutes away — Booking.com + map walking-time check per hotel. showcase
13. Find a private pool — Vrbo, verify per listing. showcase
14. Migros grocery checkout with TWINT incl. delivery window. examples/use-cases/shopping.py
15. Dinner spot equidistant from friends — Maps travel times → OpenTable → email. Stagehand/Browserbase blog "what-can-i-use-browserbase-for"
16. Stardrift travel planner — books trips, checks which flights have Starlink. Kernel. x.com/usekernel/status/2054248297716760774
17. Kernel reorders office groceries weekly via managed auth. x.com/usekernel/status/2033529968542802348

## Research / discovery
18. "Should I ape $HYPE?" — scrapes Hyperliquid leaderboard, opens every top trader, aggregates (10-min run). x.com/Axel_bitblaze69/status/2045988847784525908 (119L/24kV)
19. World Cup Fantasy copilot vs 15-yr fan — split-screen race, 14 tabs. TinyFish. x.com/Tiny_Fish/status/2064039305673310240
20. HyperPlex — scheduled research agent spawns parallel browsers, cited report. Hyperbrowser. x.com/hyperbrowser/status/2031091913760383274
21. HyperSwarm — 20 agents on 20 sites, watched live. x.com/hyperbrowser/status/2041252097019277652
22. HyperLearn `/learn stripe-payments` — reads live docs, builds skill tree. x.com/hyperbrowser/status/2019126793119338649 (2031L/789kV)
23. Plan an EV road trip — Maps + charger sites. showcase
24. Find FDA-cleared AI devices — fda.gov database form. showcase/category/research
25. Track clinical-trial results — BioPharma Catalyst calendar → table. showcase
26. Find kids' swim classes — opens each provider site for schedule/price. showcase
27. Quietest gym time — reads Google Maps popular-times bar chart visually. showcase
28. Answer from a company filing — Companies House PDF, quote exact line. showcase
29. Deep-research subagents — orchestrator dispatches parallel Steel sessions. github.com/steel-dev/steel-cookbook examples/deep-research-ts
30. Competitor-update skill — Claude Code opens live competitor sites. TinyFish. x.com/CodeByPoonam/status/2042674034043949083 (352L/53kV)

## Form-filling / data entry / accounts
31. Apply to a job with resume upload. browser-use README + apply_to_job.py
32. Parallel job applications — extract listings, fill forms, upload PDF, submit N. browserbase.com/templates/job-application
33. Exa + Browserbase job agent — discover careers pages → tailored answers. browserbase.com/templates/exa-browserbase
34. Passport appointment on USPS scheduler. showcase
35. Public-records request route on city site. showcase
36. GL insurance quote — multi-step form, extracts premiums. tinyfish.ai
37. Expense report every Friday — finance portal login, receipts from Gmail label, submit. Browserbase blog
38. "Log me into github.com, then explore" — human-in-loop hosted login, agent works signed-in. github.com/kernel/eve-connect-kernel
39. Profiles: sync local Chrome profile to cloud, agent acts logged-in. x.com/browser_use/status/2062702715676094677 (484L)
40. Giga support agent — logs in, completes support tasks end-to-end. x.com/eshamanideep/status/2014353271331434938 (828L/1.48MV)
41. Google Form submission via perform(). hyperbrowser.ai/docs/hyperagent/page-ai

## Scraping / lead-gen / monitoring
42. Export X followers to CSV (logged-in). browser-use README
43. Find 3 leads on LinkedIn / draft post, stop before posting. showcase/category/social
44. Orangeslice: any website → lead DB. Kernel. x.com/usekernel/status/2019407249018343715
45. n8n job tracker on any job board. TinyFish. x.com/arsh_goyal/status/2033905032383631760
46. Watch a vacation deal — daily Expedia check, notify. showcase
47. Check 20 products (Target) price + stock per store. showcase
48. Export portal results / discography to CSV (nsf.org, rateyourmusic). showcase
49. Box + Browserbase safety data — download PDF, save to Box, judge compliance. x.com/browserbase/status/2082873891693670634 (140kV)
50. SEC filings / Google Trends / receipts templates. browserbase.com/templates
51. Effective AI: 10M regulatory filings via stealth + managed auth. x.com/usekernel/status/2069459014967234951
52. DeepCrawler — discover hidden API endpoints in 60s. hyperbrowser-app-examples/deep-crawler-bot

## QA / testing
53. Claude Code QAs a login flow, full replay. x.com/browserbase/status/2029304669865165257
54. GLM builds site, Browser Use QA subagents find bugs + judge aesthetics. x.com/browser_use/status/2068405699340853541 (2182L/274kV)
55. QA every page in parallel / verify a shared video. showcase/category/testing
56. Stably e2e testing on Kernel. x.com/usekernel/status/2059636081633440187
57. agent-browser Electron skill — control Discord/Figma/Notion/VS Code. x.com/ctatedev/status/2028128730132922760 (4031L/743kV)
58. agent-browser chat CLI. x.com/ctatedev/status/2041176865092563122 (1239L/115kV)

## Fun / viral
59. GeoGuessr within 50 km. x.com/browser_use/status/2066688804862521809
60. Clear 100 Tetris lines in 17s (jstris). showcase/category/games
61. Chess from the live board (lichess). showcase
62. powerline.io real-time play. showcase
63. Doom 3 at 60fps in a cloud browser. Kernel. x.com/usekernel/status/2034618052109820040
64. webmcp-gen finds cheap flights via generated WebMCP + Stagehand. x.com/justinemach_/status/2068036529314996487
65. Game-mode: agent builds + plays web games. x.com/browser_use/status/2080016256972030296
66. iPhone-native browser agent. x.com/JC_builds/status/2052182069443494172

## Agent's top 10 (one-sentence "why a real browser" + visual punch)
1 cinema seats (#5) · 2 coupon hunt (#2) · 3 local pizza order (#4) · 4 live table widget (#11) · 5 job application + resume (#31/32) · 6 logged-in LinkedIn (#43) · 7 USPS passport (#34) · 8 gym popular-times chart (#27) · 9 hotels within 5-min walk (#12) · 10 GeoGuessr (#59)
