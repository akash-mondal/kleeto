# Two browser lanes, and what the second one costs

The plan: Solari stays the everyday browser, and browser-use is added as the maximum-stealth
escalation with the stealth layer and automatic CAPTCHA all switched on. When an agent gets
turned away on Solari, it retries one tier up. Two vendors, two lanes.

## Is the maximum option costlier? Yes, about fifteen times

Measured 2026-09-10, and now priced in `src/lanes.mjs` against the live ledger rate:

| Lane | Vendor | Upstream | Kleeto price | 10-min lease | Ceiling |
|---|---|---|---|---|---|
| `browser-fast` | Solari fast pool | $0.10/hr flat | **$0.110/hr** | $0.018 | none, flat rate |
| `browser-max` | browser-use, everything on | $0.02/hr + $5/GB | **$1.633/hr** | $0.272 | 250 MB |

The escalation costs **14.8x** the everyday lane. Worth being precise about why, because it
changes what to do: it is not the browser. Browser time is a rounding error at both tiers, and
browser-use is actually the *cheaper* machine ($0.02/hr against $0.10). The entire difference is
**bandwidth**. At $5/GB, one measured test browser moved 63 MB and was billed $0.31 in proxy
against $0.0003 of browser time. A thousand to one.

## What each lane is for

**`browser-fast`, Solari.** A flat upstream rate with no bandwidth meter behind it, so a long
lease can never cost more than its seconds. That property is worth more than it sounds like for
a product that sells seconds. It is blocked by Cloudflare, PerimeterX, openai.com and indeed.

**`browser-max`, browser-use.** Hardened Chromium fork, fingerprint randomisation, residential
egress across 195+ countries, automatic CAPTCHA solving, all on by default and all available on
the free tier the current key sits on. Measured: clears Cloudflare, PerimeterX, openai.com,
indeed, walmart.com and zillow.com. g2.com still blocked it.

The escalation is the gateway's job, not the model's: a 403 or a challenge page on `browser-fast`
is the signal to re-lease one tier up. That belongs in the lease logic rather than in a prompt.

## The bandwidth ceiling, and why it is there

Kleeto quotes a price per second in the 402 and the agent signs for it. A supplier that bills
per gigabyte cannot be covered by a per-second quote: a lease streaming 500 MB on `browser-max`
would cost $2.44 upstream while billing about two cents of elapsed time.

So `browser-max` carries a hard cap. The quote assumes a 5 MB/min budget, which is what a
five-site run actually moved (37.7 MB measured), and the lease stops at **250 MB**, roughly
fifty minutes at that rate. That bounds the worst case at $1.22 of upstream bandwidth against a
lease that would have billed $1.36, and it keeps the promise the whole product rests on: the
agent signs for a price it can be held to.

The alternative, a second per-megabyte meter in the 402, is more honest and would make the
receipt richer, but it complicates the one-line pitch the landing page is built on. Worth
revisiting after the bounty, not before.

## An unexpected third option, not taken

Setting `proxyCountryCode: null` puts browser-use on an AWS datacenter IP, the same class of
address Solari egresses from, and it **still cleared Cloudflare**. Same network position,
opposite result: the advantage is the forked Chromium, not the address. That mode costs
$0.02/hr + $0.20/GB, which is cheaper than `browser-fast` and more capable.

It is not in the lane table because two lanes are easier to explain than three and because
`browser-fast`'s flat rate carries no bandwidth risk at all. But it is the obvious middle rung
if the escalation from fast to max ever proves too steep a jump, and it costs nothing to add.

## Reproducing

```sh
export BROWSER_USE_API_KEY=...   # never committed
node scripts/browser-pool-compare.mjs all     # the gauntlet, both vendors
node scripts/bu-proxy-knob.mjs                # datacenter vs residential egress and billing
```
