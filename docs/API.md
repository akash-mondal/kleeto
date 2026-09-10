# The Kleeto API

Every endpoint below is on the gateway. Nothing in a response names or links a supplier: the
machines come from elsewhere, and that is Kleeto's problem rather than the buyer's.

Base URL in production is `https://api.kleeto.fun`. Network is `hedera:testnet`, facilitator is
Blocky402, and the fee payer is read from its `/supported` at boot rather than hardcoded.

## What is sold, and how it is paid for

Two payment shapes, and the difference is the product.

**Metered (the real one).** An agent opens a session, tops it up over x402, and the balance is
spent **one second at a time** by a meter that hash-chains every tick. When the balance runs
low the gateway says so and the agent tops up again. The agent genuinely pays as it uses.

**Prepaid (the simple one).** One `exact` payment buys a fixed block of seconds. Fine for a
one-shot job, but it is prepayment, not metering.

Both assets are always offered. Every 402 carries two `accepts` entries, USDC and HBAR, worth
the same at the ledger's own rate, so an agent pays in whatever it holds.

## The x402-gated endpoints

| Method | Path | 402? | What it sells |
|---|---|---|---|
| `POST` | `/v1/sessions/:id/topup` | **yes** | credit on a session, spent per second by the meter |
| `POST` | `/v1/leases` | **yes**, unless `sessionId` is funded | a machine: browser, Linux box or desktop |

## The full surface

### Catalogue

```
GET /v1/lanes
```
Eight lanes with live per-second prices, quoted against the ledger's own HBAR rate.

```json
{ "network": "hedera:testnet", "usdPerHbar": 0.076951, "assets": ["USDC", "HBAR"],
  "lanes": [ { "lane": "desktop-2", "kind": "desktop", "vcpu": 2, "memGiB": 4,
               "creditTinybar": 53209, "usdPerHour": 0.147, "stealth": false } ] }
```

| Lane | Kind | $/hr | Notes |
|---|---|---|---|
| `machine-1` … `machine-8` | machine | $0.063 – $0.502 | headless Linux, 1 to 8 vCPU |
| `desktop-2`, `desktop-4` | desktop | $0.147, $0.273 | full XFCE, mouse and keyboard, live view |
| `browser-fast` | browser | $0.110 | real Chrome over CDP, flat rate |
| `browser-max` | browser | $1.633 | stealth, residential egress, automatic CAPTCHA, 250 MB ceiling |

### Sessions, the metered path

```
POST /v1/sessions                  → { sessionId, topUpUrl, assets }
POST /v1/sessions/:id/topup        → 402, then settle, then balance
GET  /v1/sessions/:id              → balance, burn rate, seconds remaining, top-up history
```

`GET /v1/sessions/:id` is what a dashboard reads:

```json
{ "balanceTinybar": 49773660, "balanceUsd": 0.038303,
  "spentTinybar": 226340, "spentUsd": 0.000174,
  "burnTinybarPerSec": 22634, "secondsRemaining": 2199,
  "topUps": [ { "tinybar": 50000000, "transaction": "0.0.x@…", "asset": "HBAR" } ],
  "leases": [ { "id": "ls_…", "lane": "machine-1", "state": "open" } ] }
```

### Leases

```
POST /v1/leases        { lane, seconds, sessionId? }
GET  /v1/leases/:id
POST /v1/leases/:id/stop
```

A lease response carries a `liveUrl` on Kleeto's own origin and a `receiptUrl`. It never
carries an upstream endpoint.

### The meter, live

```
GET /v1/leases/:id/meter        → text/event-stream
```

Server-sent events, one per second. This is the endpoint a UI subscribes to in order to show
the meter running and the agent paying.

| Event | When | Carries |
|---|---|---|
| `hello` | on connect | lane, rate, current state |
| `tick` | every second | `seq`, `tinybar`, `spentTinybar`, `balanceTinybar`, `secondsRemaining`, `chainHead` |
| `low` | balance buys under a minute | `secondsRemaining` — the cue to top up |
| `paid` | a top-up settled | `tinybar`, `asset`, `transaction`, `explorer` — the agent paying, on camera |
| `exhausted` | balance hit zero | lease pauses, machine keeps its state |
| `anchor` | every 60s | the chain head written to the public topic |

A tick, as it arrives:

```
event: tick
data: {"leaseId":"ls_BeNUpjMNDYNU","seq":9,"tinybar":22634,"spentTinybar":203706,
       "balanceTinybar":49796294,"secondsRemaining":2200,
       "chainHead":"6d619476d41fc2a954745530…"}
```

### The proof

```
GET /v1/leases/:id/proof
```

Every second, with its hash, and the rule for recomputing them:

```json
{ "seconds": 9, "totalTinybar": 203706,
  "genesis": "1322fb3677ba9738…", "chainHead": "6d619476d41fc2a9…",
  "selfCheck": { "ok": true, "seconds": 9, "totalTinybar": 203706 },
  "howToVerify": "sha256(prev|seq|leaseId|tinybar|at) for each tick, starting from genesis",
  "ticks": [ { "seq": 1, "tinybar": 22634, "at": "…", "hash": "ca7c84f9dd0d…" } ] }
```

The chain is why the bill is not a number Kleeto asserts. Edit any second and every hash after
it moves; a disputed invoice is settled by arithmetic rather than by argument. Measured: a
tampered tick is caught at the exact second it was changed.

### The live view

```
GET /live/:token
```

Kleeto's own viewer page, on Kleeto's origin, relaying frames over Kleeto's WebSocket. Measured
on a real lease: 4305 bytes, **zero external hostnames**, no supplier name anywhere in the page
or the API response. The supplier's endpoint is resolved server-side from the token and never
reaches a browser.

## Why metering is built this way

`exact` settles once. A settlement per second would be thousands of transactions an hour and
the ledger's finality is slower than the tick, so the honest options are prepay-a-block or
pay-into-a-balance-and-draw-down. The second is the only one that is actually metered, and the
hash chain is what stops "draw down against a balance" from meaning "trust our number".

The chain head goes to a public topic every sixty seconds rather than every second: one message
per second would cost $0.36 an hour in consensus fees against a machine that costs $0.063, and
anchoring the head of a chain proves everything under it anyway.

## Settled, on testnet

Both assets have been paid end to end by a real agent account through Blocky402, and the
transfers are on the public ledger.

| | USDC | HBAR |
|---|---|---|
| Transaction | [`0.0.7162784-1789034955-981424814`](https://hashscan.io/testnet/transaction/0.0.7162784-1789034955-981424814) | [`0.0.7162784-1789035068-807499091`](https://hashscan.io/testnet/transaction/0.0.7162784-1789035068-807499091) |
| Moved | 45,743 USDC units, agent → gateway | 60,000,000 tinybar, agent → gateway |
| Gas | 1,442,854 tinybar, paid by the facilitator | 262,336 tinybar, paid by the facilitator |
| Result | SUCCESS | SUCCESS |

The gas line is the point. In both cases the network fee came out of the facilitator's
account, not the agent's, which is what lets an agent hold only USDC and still transact.

Accounts on testnet: gateway `0.0.7284970`, checkpoints topic
[`0.0.10454763`](https://hashscan.io/testnet/topic/0.0.10454763).

### A note for client authors

The x402 client's spend controls price a payment in USD to enforce a cap, and they can only
price the network's *default* asset, which on Hedera is USDC. Left on, they silently filter
the HBAR half of the offer and the agent pays in USDC whatever it asked for. An agent that
means to pay in HBAR needs `setSpendControls(false)` or a cap it can apply to both assets.
Kleeto always offers both; the choice is the client's to make and the client's to lose.

## Not yet live

- HCS anchoring is wired to a hook and has a topic, but the writer is not built.
- Signed receipts (JWS, `did:hedera` kid) are not built.
