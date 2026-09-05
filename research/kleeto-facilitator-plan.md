# Facilitator topology — probed live 2026-09-04

## What Blocky402 actually advertises

`GET https://api.testnet.blocky402.com/supported`
```
exact · eip155:80002
exact · solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1  feePayer 7B6Q2Mvc…
exact · hedera:testnet                            feePayer 0.0.7162784
signers.hedera:* = ["0.0.7162784"]
extensions: []
```

`GET https://api.blocky402.com/supported`
```
exact · hedera:mainnet                            feePayer 0.0.10571514
signers.hedera:* = ["0.0.10571514"]
extensions: []
```

Three facts that shape the build:
1. **`exact` is the only scheme on either network.** No `upto`, no metered scheme.
2. **`extensions: []`** — the `offer-and-receipt` extension is not advertised, so signed JWS receipts are our own layer. That is a differentiator, not a blocker.
3. Mainnet is a *different host* with a *different fee payer*. Never hardcode either; resolve from `/supported` at boot (the existing `resolveFeePayer()` already does this — it just needs the network passed in rather than a module constant).

## Topology: one facilitator endpoint, two schemes

```
        agent
          │  x402 client points at ONE facilitator URL
          ▼
  Kleeto facilitator
   ├── scheme "exact"  ──► proxies /verify + /settle to Blocky402
   │                        (testnet → api.testnet.blocky402.com
   │                         mainnet → api.blocky402.com)
   │                        Blocky402's fee payer co-signs and submits,
   │                        so settlement genuinely happens through them.
   └── scheme "upto"   ──► handled natively (HIP-336 allowance draw)
```

Why this shape:
- The **qualifying path stays `exact` through Blocky402**, verbatim per the bounty text. We are a pass-through for it; the on-chain settlement is theirs.
- The **`upto` path is additive**. If it doesn't land, delete the branch and nothing about the submission changes.
- One `/supported` document advertises both, so a standard `@x402/fetch` client negotiates whichever it can do.

## Network axis (testnet + mainnet, required)
Everything below must key off a single resolved network context rather than module constants:

| Thing | testnet | mainnet |
|---|---|---|
| CAIP-2 id | `hedera:testnet` | `hedera:mainnet` |
| facilitator | api.testnet.blocky402.com | api.blocky402.com |
| fee payer | resolve from `/supported` | resolve from `/supported` |
| mirror node | testnet.mirrornode.hedera.com | mainnet-public.mirrornode.hedera.com |
| SDK client | `Client.forTestnet()` | `Client.forMainnet()` |
| hashscan | hashscan.io/testnet/… | hashscan.io/mainnet/… |
| USDC (HTS) | 0.0.429274 | 0.0.456858 |
| HBAR asset | 0.0.0 | 0.0.0 |

Guardrail: **mainnet HBAR is real money.** The spend guards (budget ceiling, concurrency cap,
max-seconds-per-session) must be strictly tighter on mainnet, and lane provisioning on mainnet
should default to the cheapest lane unless explicitly overridden.
