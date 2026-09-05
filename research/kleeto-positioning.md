# Kleeto — positioning and copy system
Built from two teardowns: the agent-infra/sandbox category (27 sites) and the
x402/agent-payments category + Hedera's own brand voice.

## The unclaimed sentence

The sandbox category talks endlessly about **where work runs** — isolation, microVM, cold
start, fork, persistence — and never about **who pays**. It assumes an account and a card on
file. The payments category talks endlessly about **who pays** — no API key, per-request,
receipts, spend caps — and treats the resource as a black box behind a URL.

> **A rented computer is the one product where the meter and the payment are the same event.**

Nobody writes that. It is Kleeto's whole thesis and it is only true because of per-second
compute meeting per-request payment.

## Positioning statement
Kleeto rents an agent a real computer — a browser, a Linux desktop, or a bare machine — and
bills it by the second out of the agent's own wallet. Every second burned is a line in a
public ledger, and every file that comes out is hashed into the receipt. No account, no API
key, no card.

## Headline candidates

**A. Payment-forward (recommended — owns the whitespace)**
> # A computer your agent can pay for itself.
> A browser, a Linux desktop, or a bare machine. Up in about a second, billed by the second,
> settled from the agent's own wallet. No account, no API key, no card on file.

**B. Imperative, category-native** (rides the dominant "give your agent a…" formula)
> # Give your agent a computer. Let it pay for the seconds it uses.

**C. Proof-forward**
> # Rent a computer by the second. Prove what it did.
> Every second is on a public ledger. Every file that leaves is hashed into the receipt.

**D. Blunt** (Fly-register)
> # Your agent needs a computer. It should not need your credit card.

CTA pair, per category convention: **`Start free`** + **`Read the docs`**. Never "Book a demo".

## The 402 explainer, in our voice
Ranked-best variants in the wild are HTTP-literal and verb-driven (Apify, Stripe). Ours:

> Your agent asks for a machine. Kleeto answers `402 Payment Required` with a price. The agent
> signs, asks again, and the machine is up — usually inside a second. It pays for the seconds
> it actually uses and gets the rest back.

## Vocabulary

**Use** (attested, plain, developer-safe): rent, by the second, meter, credits, top up,
refund, receipt, ledger, isolated, spin up, fork, snapshot, pause, live view, take over,
tear down, blast radius, runaway, no account / no API key / no card on file, finality in
seconds, fees start at $0.0001.

**Avoid** (crypto-native words that lose a developer audience) → substitute:
| Avoid | Say |
|---|---|
| on-chain, settlement, settle | "on a public ledger", "gets a receipt" |
| gas, gas fees | don't mention it — the agent pays none |
| wallet (unqualified) | "the agent's own wallet", "fund your agent once" |
| crypto, micropayments | "USDC or HBAR", "pay per second", "sub-cent" |
| facilitator, permissionless, non-custodial | docs words — never in hero copy |
| aBFT, hashgraph, DLT, tokenomics | "finality in seconds", "predictable fees" |
Price everything in **USD**, as Hedera itself does. HBAR is the rail, not the pitch.

## Hedera proof points to echo (their words, so judges hear their own language)
- "finality in seconds" / "sub-second finality" — *not* "fast blockchain"
- "Fees are set in USD starting at $0.0001 … so your costs stay predictable"
- HCS: "Scalable, real-time audit logs with consensus timestamps … $0.0001 per message"
- HTS for "micro-payments and token-based economies for agents"
- "removes the need to write or audit smart contracts" — we have **no smart contract**, which
  is Hedera's own stated advantage, not a limitation to apologise for
- Hedera's x402 differentiator, verbatim: "the facilitator pays the gas fees and submits
  transactions" → for us that becomes **"your agent holds exactly what it means to spend"**

## Whitespace we should deliberately occupy
1. **The runaway agent.** Everyone sells boot speed; nobody writes about what happens when the
   agent loops, hangs or leaks. We have spend caps, max-duration, pause-at-zero. Own it.
2. **Cost in human units.** The category publishes `$0.0000045/GiB/s`, which no one can parse.
   We publish "ten minutes on a desktop: 2.5 cents."
3. **The human watching.** Only two sites in 27 write to an operator rather than a builder. We
   have VNC live view, mid-task takeover, session replay and mp4. Own it.
4. **Proof of what was produced**, not just proof of billing. Nobody in either category has it.

## Section order (landing + README), per category convention
1. one-line tagline in italics, badge row
2. bold one-paragraph "Kleeto runs X inside Y" + `npm i`
3. 5-line code sample — the most consistent element in the entire category
4. stat triplet (lanes · seconds-to-boot · price of a 10-minute desktop)
5. problem H2 ("Compute is billed by the second. Payments are billed by the request.")
6. 3–5 feature cards
7. use-case grid keyed to agent archetypes
8. how the meter works + the ledger
9. pricing in USD per hour AND per 10 minutes
10. security/limits, then repeat CTA

## Note on the name
"Kleeto" is coined and carries no meaning on its own, so the tagline has to do 100% of the
work in the first three seconds. Every H1 candidate above therefore names the product
category ("a computer") in the first four words rather than leading with the brand.
