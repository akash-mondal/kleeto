# Three browser tiers, and where each vendor actually belongs

The plan on the table: keep Solari as the regular browser, add Browserbase, and put browser-use
at the top as the maximum-stealth option with residential proxies and automatic CAPTCHA, so an
agent that gets blocked can escalate. The instinct behind it is right and the measured numbers
support most of it. One part does not survive contact with the pricing, and it is worth fixing
before any of this is built.

## Is max-stealth costlier? Yes, and by more than it looks

Measured 2026-09-10. A ten-minute session moving 50 MB, which is about what one of my
five-site test runs actually moved (37.7 MB average, measured):

| Tier | Cost | vs cheapest | Rate | What it clears |
|---|---|---|---|---|
| browser-use, direct egress | **$0.0131** | 1.0x | $0.02/hr + $0.20/GB | Cloudflare, PerimeterX, openai.com, indeed |
| Solari fast pool | **$0.0167** | 1.3x | $0.10/hr flat | sannysoft only; 403 on the rest |
| browser-use, residential | **$0.2475** | **18.9x** | $0.02/hr + $5/GB | the above plus geo-targeting and auto CAPTCHA |
| Browserbase Startup | $0.5049 | 38.5x | $0.10/hr + $10/GB | basic stealth + auto CAPTCHA, $99/mo |
| Browserbase Developer | $0.6059 | **46.3x** | $0.12/hr + $12/GB | basic stealth + auto CAPTCHA, $20/mo |

So yes: turning on maximum stealth costs roughly **19 times** a normal session. But the reason
is worth being precise about, because it changes what to do. It is not the browser. Browser time
is a rounding error at every tier. It is **bandwidth**: at $5/GB, one measured test browser moved
63 MB and was billed $0.31 in proxy against $0.0003 of browser time. A thousand to one.

## The part of the plan I'd change

**Browserbase is not the middle tier. It is the most expensive tier, at every plan level.**

Its proxy bandwidth is $12/GB on Developer and $10/GB on Startup, against browser-use's $5/GB
for the same residential service. For the identical job it costs 2.4x what the "maximum" option
costs. It also needs a $20/month subscription before automatic CAPTCHA is available at all
(the free tier has no CAPTCHA solving, no stealth, and a 15-minute session cap), and its
strongest anti-bot tier, Verified, is gated behind custom-priced Scale.

browser-use, by contrast, includes stealth and automatic CAPTCHA **on the free tier**, which is
the tier the current key is on.

That does not make Browserbase worthless. Its genuine argument is **redundancy**: a second
vendor so that one provider's bad afternoon does not take the lane down, and its session replay
and observability are good. But that is an availability argument, not a capability or price one,
and it should be bought deliberately rather than slotted in as "the middle option".

## The tier that surprised me

`proxyCountryCode: null` puts browser-use on an AWS datacenter IP, the same class of address
Solari egresses from, and it **still cleared Cloudflare**. Same network position, opposite
result: the advantage is the forked Chromium, not the address.

That produces a tier that is both cheaper than the current Solari lane and considerably more
capable. It is the one genuinely free lunch in the table, and it argues for browser-use being
the *default* rather than the escalation.

## What I'd build

Three tiers, escalating, with the vendor chosen per tier on merit:

| Lane | Vendor | Upstream | Sells as | For |
|---|---|---|---|---|
| `browser-fast` | Solari fast pool | $0.10/hr flat | flat per-second | undefended sites; no bandwidth tail risk |
| `browser-stealth` | browser-use, `proxyCountryCode: null` | $0.02/hr + $0.20/GB | flat per-second, bandwidth absorbed | Cloudflare, PerimeterX, most of the real web |
| `browser-max` | browser-use, residential + `solveCaptchas` | $0.02/hr + $5/GB | per-second **plus a bandwidth ceiling** | CAPTCHA walls, geo-targeting, the last mile |

Escalation is the agent's to make: a 403 or a challenge page on `browser-fast` is the signal to
retry one tier up. That is a gateway behaviour, not a model behaviour, so it belongs in the
lease logic rather than in a prompt.

Keeping Solari at the bottom is defensible even though browser-use direct is cheaper, for two
reasons that are not about price: it is one vendor for all three of Kleeto's families, and its
flat rate carries **no bandwidth tail risk at all**, which matters more than it sounds like for
a product that sells seconds.

## The unsolved problem, which is a product problem

Kleeto quotes a price per second in the 402 and the agent signs for it. A supplier that bills
per gigabyte cannot be covered by a per-second quote: a lease that streams 500 MB on
`browser-max` costs $2.44 upstream while billing about two cents of elapsed time. Three ways out:

1. **Bandwidth ceiling per lease.** The 402 quotes seconds as usual and the lane carries a hard
   cap, say 100 MB, after which the lease stops. Keeps the story ("you pay for seconds") intact
   and bounds the loss. Simplest, and my pick for the bounty build.
2. **A second meter in the 402.** Quote seconds *and* per-MB, and put both on the receipt. Most
   honest, and it makes the receipt richer, but it complicates the one-line pitch that the whole
   landing page is built on.
3. **Absorb it in the per-second price.** Price `browser-max` at, say, $1.50/hr assuming a
   5 MB/min budget and eat the tail. Simple to explain, unbounded downside on a heavy lease.

Whichever is chosen has to be decided before `browser-max` is priced, because it determines what
`creditTinybar` even means for that lane.

## What is still unmeasured

Browserbase has not been tested; there is no key for it, and everything above about it comes
from its published pricing and docs. Its stealth reputation is strong and it may well clear
sites that browser-use does not, including g2.com, which blocked both vendors I did test. If it
is going in as the redundancy tier, it deserves the same gauntlet run first:
`node scripts/browser-pool-compare.mjs` with a Browserbase branch added.
