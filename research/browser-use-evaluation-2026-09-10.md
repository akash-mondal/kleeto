# browser-use as the browser lane, measured against Solari

Tested 2026-09-10 on the key provided. Every number below came from running the same code
against both vendors within the same hour, not from either vendor's marketing.

## The plan on that key

`GET /api/v2/billing/account` reports:

| | |
|---|---|
| Project | Default Project, `10dd5c38-874b-4df4-a8cd-11e73b839c45` |
| Tier | **free** (`isFreeTier: true`, no subscription) |
| Credits | **$14.44**, all top-up (never expire); $0 monthly |
| Concurrency | **10** sessions (free starts at 3; a first top-up raises it to 10) |
| Rate limit | 25 RPS general traffic per project |

So: free tier, but with purchased credits, which is the pay-as-you-go path. Nothing has to be
upgraded for stealth or CAPTCHA; both are on by default at this tier.

## Does it have stealth and CAPTCHA bypass

Yes to both, and neither is a plan upgrade.

- **Stealth** is a forked Chromium with fingerprint randomisation (canvas, WebGL, fonts,
  navigator), on by default with no configuration, plus ad and cookie-banner blocking.
- **CAPTCHA solving** is automatic by default on standalone cloud browsers; pass
  `"solveCaptchas": false` to opt out. The vendor is careful about the distinction, and it is
  worth repeating: the solver handles actual CAPTCHA challenges. Cloudflare and other bot walls
  are handled by the stealth layer and the proxies, not the solver.
- **Residential proxies** across 195+ countries, on by default.

## What it actually cleared

Same script, same minute, same five sites. `scripts/browser-pool-compare.mjs`.

| Site (defence) | Solari fast pool | browser-use |
|---|---|---|
| bot.sannysoft.com | pass | pass |
| nowsecure.nl (Cloudflare) | **403** | **pass** |
| openai.com (Cloudflare) | **403** | **pass** |
| indeed.com | **403** | **pass** |
| walmart.com (PerimeterX) | not run | **pass** |
| zillow.com | not run | **pass** |
| g2.com | 403 | 403 |

The fingerprints say why:

| | Solari fast | browser-use |
|---|---|---|
| User agent | `Chrome/151.0.7922.34` (full build string, a headless tell) | `Chrome/151.0.0.0` (rounded, as real Chrome reports) |
| `navigator.plugins` | **0** (a tell) | **5** |
| Languages | `en-US` | `en-US,en` |
| Egress | AWS `AS16509` datacenter | Comcast / AT&T residential by default |

**The decisive test.** Setting `proxyCountryCode: null` puts browser-use on an AWS datacenter
IP, the same class of address Solari egresses from, and it *still cleared Cloudflare*. Same
network position, opposite result. The advantage is in the browser build, not the IP.

## What it costs, which is the part that matters

Published: **$0.02/browser-hour**, versus Solari's $0.10 on the Starter plan. But browser hours
are not where the money goes. Measured from the four test browsers:

| Mode | Browser | Proxy | Total for ~10 min, 50 MB |
|---|---|---|---|
| Solari fast pool | $0.10/hr | none | **$0.0167** |
| browser-use, `proxyCountryCode: null` | $0.02/hr | $0.20/GB direct egress | **$0.013** |
| browser-use, residential (the default) | $0.02/hr | **$5/GB** | **$0.253** |

One test browser used 63 MB and was billed $0.31 in proxy against $0.0003 of browser time:
bandwidth is a thousand times the compute. A single test run of five sites cost $0.56 in total,
almost all of it proxy.

**This is a product problem, not just a bill.** Kleeto sells seconds. A supplier that bills
gigabytes cannot be covered by a per-second price: a lease that streams 500 MB costs $2.50
upstream while billing perhaps two cents of elapsed time. Any move to browser-use has to either
default to `proxyCountryCode: null` (where egress is $0.20/GB and the arithmetic survives) or
add a metered bandwidth line to the 402, which would be a real change to the product's story.

## What this means for the browser lane

The case for switching is strong on capability and, in datacenter mode, on price too:

- It does what `browser-stealth` was supposed to do, and that lane has never once had capacity
  on Solari since the Starter upgrade seven days ago (see `kleeto-solari-surface.md` §C).
- Datacenter mode is both cheaper than the current lane and clears Cloudflare, which the
  current lane does not.
- It speaks CDP and returns a `cdpUrl`, the same interface `browser-fast` already drives, so
  the adapter change is small.
- 10 concurrent sessions on this key against Solari's 20.

Against it:

- It is a second vendor for one lane, while machine and desktop stay on Solari. Two suppliers,
  two failure modes, two sets of credentials.
- Residential mode's per-GB billing does not fit a per-second product without a change to how
  leases are quoted.
- The measurement is one run of a handful of sites. g2.com blocked both vendors.

**Cheapest next step, if you want it:** keep Solari for machine and desktop, add browser-use as
the engine behind `browser-fast` with `proxyCountryCode: null`, and hold residential behind an
explicit opt-in that the 402 prices separately. That gets a lane that clears Cloudflare today
instead of waiting on a fleet that has never come back.

## Reproducing

```sh
export BROWSER_USE_API_KEY=...   # never committed
node scripts/browser-pool-compare.mjs all     # the gauntlet, both vendors
node scripts/bu-proxy-knob.mjs                # datacenter vs residential egress and billing
```
