# Prior-round winners — engineering teardown
All four co-winning repos cloned and inspected 2026-09-04.
Source: https://hedera.com/blog/x402-bounty-on-hedera-winners-announced (31 Aug 2026)

## Scale
| repo | files | lines | last push | shape |
|---|---|---|---|---|
| Mystic | 148 | 165,239 | 2026-08-31 | vpn-server (hono) + client + spikes |
| xorv | 278 | 82,990 | 2026-08-06 | monorepo: services/broker, packages/{protocol,cli,mcp}, apps/{app,landing} |
| Tally | 104 | 21,014 | 2026-07-21 | monorepo: 3 npm packages + apps/web + `tally` bin |
| qisma | 59 | 16,674 | 2026-07-27 | packages/{protocol,facilitator,services,buyer,explorer} |

## VERIFIED build rule: pin the Hedera SDK exactly
`@x402/hedera@2.25.0` dependencies (from npm registry, checked live):
```
"@hiero-ledger/proto": "2.31.0",
"@hiero-ledger/sdk":   "2.85.0",     <-- EXACT, no caret
"@x402/core":          "~2.25.0"
```
Latest `@hiero-ledger/sdk` is 2.87.0. Installing `^2.86.x` at the top level resolves a SECOND
copy of the SDK nested under `@x402/hedera`, and every `instanceof` check across the boundary
(`PrivateKey`, `Client`, `Transaction`, `AccountId`) fails.

Independent confirmation — all three `@x402/*` users pinned it exactly, with no caret:
- Tally: `"@hiero-ledger/sdk": "2.85.0"` in all 5 package.json files
- xorv: `"@hiero-ledger/sdk": "2.85.0"` in broker, mcp, protocol, cli, apps/app
- Mystic: `^2.86.2` (the one caret in the set — a latent bug)

**Rule for Kleeto: `"@hiero-ledger/sdk": "2.85.0"` exact, everywhere, and import
`PrivateKey`/`Client` from `@x402/hedera` rather than the SDK directly where possible.**

## x402 version spread
| repo | @x402/core | @x402/hedera | notes |
|---|---|---|---|
| Tally | ^2.18.0 | ^2.18.0 | oldest |
| xorv | ~2.20.0 | ~2.20.0 | also @x402/fetch, @x402/hono |
| Mystic | ^2.20.0 | ^2.20.0 | @x402/hedera + core only |
| qisma | **none** | **none** | raw `@hashgraph/sdk ^2.51.0`, hand-rolled facilitator |
Current published: 2.25.0. Nobody is on it yet.

Notable: **qisma uses no `@x402/*` packages at all** — it implements `exact-multi` from scratch
on the legacy `@hashgraph/sdk`. That is how you ship a scheme the SDK does not support.

## Product shape to copy: xorv
xorv has the most complete product topology, and it maps 1:1 onto what Kleeto needs:
```
services/broker      hono server, @x402/hono middleware  -> our gateway
packages/protocol    shared types + payment plumbing      -> our lane/receipt schemas
packages/cli         `xorv` bin, @x402/fetch              -> our CLI
packages/mcp         `xorv-mcp` bin, MCP SDK ^1.12.0      -> our agent tool surface
apps/app             Next 16 + @hashgraph/hedera-wallet-connect -> browser buyers
apps/landing         Next 16                              -> marketing site
```
`@hashgraph/hedera-wallet-connect ^2.1.3` is how a *human* pays a 402 in a browser — worth
lifting for the "fund your agent" flow.

Mystic uses `@magic-ext/hedera ^2.8.0` for email login → custodial Hedera account. That is the
lowest-friction onboarding path in the set if we want humans to top up an agent without a wallet.

---

# Deep read: Tally + Qisma

## Tally — ~7.2k LoC TS + 179 lines Solidity, 1 squashed commit
Genuinely implemented end to end; no stubs on the payment path. CI runs build + `tsc --noEmit`
+ vitest. Tests are real behavioural tests (audit tests corrupt exactly one field per fraud
class; 18 SSRF/cap refusals). Ships a 367-line network spec at
`specs/schemes/upto/scheme_upto_hedera.md`.

### Production hardening we would otherwise have to discover ourselves
1. **HCS messages chunk at ~2KB.** `anchor.ts:106-157` `readTopic` paginates AND reassembles
   chunked messages by `chunk_info.initial_transaction_id`. Without this a >2KB receipt bundle
   is *silently truncated*. Our artifact-anchored receipts will be large. **Must copy.**
2. **Resolve the signer key from the mirror node, no key registry.** `did.ts:41-51` — a
   `did:hedera:<net>:<account>#key-1` kid is resolved via `/api/v1/accounts/<id>`. Our
   `receipt.mjs` already mints exactly this kid shape; this closes the verification loop for free.
3. **Settle re-runs full verification before submitting** (`facilitator/scheme.ts:233`).
4. **Read nonce/liveness from a consensus node, not the JSON-RPC relay**
   (`facilitator/scheme.ts:209-213`) — the relay simulates stale state.
5. **HIP-991 gotchas** (`topics.ts:42-68`): the fee schedule key **must be set at topic
   creation and cannot be added later**; submitters must cap exposure with
   `setCustomFeeLimits`; needs `setMaxTransactionFee(30 ℏ)` or you get a misleading
   `INSUFFICIENT_TX_FEE`.
6. **Facilitator advertises everything via `getExtra()`** (`facilitator/scheme.ts:66-80`) so the
   client hardcodes nothing. Same discipline as reading `extra.feePayer` from `/supported`.

### The receipt primitive to adopt
Four artifacts: a **signed unit price before the work** + a **meter reading after**. The
`reading` payload (`artifacts.ts:75-94`) carries exactly the fields that make a bill
recomputable: `unit, unitPrice, units, amount, maxAmount, offerHash, priceScheduleHash,
responseHash, transaction`. HCS settlement message (`artifacts.ts:96-107`):
```json
{"v":1,"type":"settlement","seller":"0.0.x","payer":"0.0.y",
 "offer":{"format":"jws","signature":"…"},"priceSchedule":{…},
 "receipt":{…},"reading":{…},"settlementTx":"0.0.z@…"}
```
Kleeto's version replaces `responseHash` with an **artifact array** (`{path, sha256, bytes}` +
`replayId` + `finalScreenshotSha256`). That is the same primitive extended to work products.

### Verifier CLI shape
`auditSettlementLogic(bundle, publicKey, capture)` is a **pure function** with two mirror
lookups bolted on in front (`audit.ts:156-298`). That split is what makes it unit-testable and
trustless. It asserts: terms hash matches, `amount == units × signedUnitPrice`, on-chain amount
matches the reading, ≤ ceiling, payee consistency, receipt↔tx linkage. Audit deliberately
**refuses to throw** on malformed-but-signed bundles and retries mirror lag 6× rather than
calling fraud.

## Qisma — 59 files, cleaner and smaller; claims match code
`exact-multi`: one `TransferTransaction`, memo `qisma:<nonce>`,
`setTransactionId(TransactionId.generate(feePayer))` so the facilitator is the network payer,
`freeze().sign(buyerKey)` → base64, **never submitted**; the facilitator adds only its fee-payer
signature and therefore cannot move a tinybar. `validate.ts:85-127` reconstructs the transfer
list and requires net zero, exactly one debit, credits matching outputs, fee payer never
debited. Documented in `docs/SPEC.md` (283 lines with a MUST list). 28 tests via `node --test`,
16 of them adversarial ("rejects a split that quietly reweights the outputs").
Best pattern: `services/src/shared/inclusion.ts` — a payee verifies its own payment purely from
the mirror node while **holding zero private keys**.

## Steal list (ranked)
1. Tally `upto/facilitator/scheme.ts` — `verifyAgainst(payload, req, settleAmount)`, settle
   re-verifies, typed error table (20 codes, never throws).
2. Tally `anchor.ts` chunk reassembly + `did.ts` mirror key resolution.
3. Tally `audit.ts` pure `auditSettlementLogic()` split from I/O → our verifier CLI.
4. Tally `artifacts.ts` four-artifact receipt (price signed before, reading signed after).
5. Qisma `validate.ts` — pure sync structural validator, network-free, fully testable.
6. Tally `constants.ts` network table with chainId bound into the signing domain.
7. Tally `x402-hedera-mcp/{index,guard}.ts` — MCP tool shape + hard spend cap + DNS-resolving
   SSRF guard.
8. Tally `topics.ts` HIP-991 setup.
9. Qisma `inclusion.ts` keyless payee verification.

## Avoid list
- **In-memory nonce/replay sets** (`qisma/settle.ts:22`) — dies on restart, breaks with >1 instance.
- **`z.literal("hedera:testnet")` + `Client.forTestnet()` in the protocol layer** (qisma) — makes
  mainnet impossible as written. Tally parametrises its packages but hardcodes testnet in its apps.
- **`JSON.stringify(a) !== JSON.stringify(b)`** for requirements equality — key-order fragile.
- **Best-effort HCS receipts with only `console.error`** — billing checkpoints need a durable retry queue.
- **README numbers that don't match the suite** (Tally claims "56 offline + 24 on-chain"; actual
  is 57 `it()` across 6 files, and the "on-chain tests" are one-shot `scripts/test-*.ts`).
- **Demo-fraud switches in the production path** (`ALLOW_CHEAT_SWITCH`, `--cheat-at`).

## The gap nobody filled
Neither repo has **integration tests against a live facilitator**, and neither actually
references an upstream x402 PR. A runnable script that performs a real 402 → sign → verify →
settle against Blocky402 testnet, with the resulting HashScan link in the README, is the
visible checkable version of this. No CI.

---

# Deep read: Xorv + Mystic

## Xorv — best-engineered repo of the four
pnpm monorepo, ~265 files, TS strict, 20 test files / ~340 `it()` blocks, **zero TODO/FIXME/HACK**
in `packages|services|apps`. `services/broker/test/integration.test.ts` boots a real HTTP server,
the real Hono app, the real `x402ResourceServer` and the real `@x402/fetch` client — only the
scheme signature and the HCS writer are stubbed, behind a `ChainLike` interface
(`chain.ts:37`). That seam is why the tests need no credentials. README is unusually honest: an
explicit "what is proven, and what isn't" table with HashScan tx ids.

### Bugs they already paid for (copy the fixes)
1. **Fresh SDK client per settlement** (`protocol/x402.ts:55-79`). Without it **only the first
   payment in a process succeeds.** Written up as a post-mortem comment in the source.
2. **Separate SDK clients for settlement vs HCS** (`chain.ts:53-67`), and **explicit
   `freezeWith(client)`** on `TopicMessageSubmitTransaction` (`hcs.ts:59-69`) because it races
   under concurrent execute.
3. **The x402 CORS block** (`app.ts:110-165`) — the single highest-value 50 lines in the set.
   Browser payments fail without `allowHeaders` containing `PAYMENT-SIGNATURE` *and*
   `Access-Control-Expose-Headers`, plus `exposeHeaders` containing `payment-required` /
   `PAYMENT-RESPONSE` **in both casings**. The failure surfaces as "Failed to parse payment
   requirements" and reads like a protocol bug. Copy verbatim.
4. **`registerPolicy` must never return an empty requirements list** (`cli/commands/run.ts:198`)
   — an empty list refuses a payment the server would have accepted.
5. **`hashscanTx` rewrites `0.0.1@2.3` → `0.0.1-2-3`** (`constants.ts:70-124`). Everyone gets
   this wrong once.

### Money math (direct fit for sub-cent metering)
`protocol/money.ts`: everything is integer **micro-USD**; `usdMicrosToUsdcUnits` scales via
`10 ** (DECIMALS - 6)` rather than assuming 6dp; `formatUsd` keeps 4 decimals so `$0.0010` never
renders `$0.00`; HBAR conversion **rounds up** so the seller never eats a fraction; HBAR/USD comes
from the ledger's own `/api/v1/network/exchangerate` behind a collapsing 60s cache.
Mystic's `pricing.ts:59` `hbarToTinybars()` complements it: rounds rather than truncates
(`0.1*1e8 === 10000000.000000002`) and **throws** on sub-tinybar precision instead of silently
rounding.

### HTS association done right
`protocol/hedera.ts:114` uses the Mirror Node, not `AccountBalanceQuery`, and computes
`canReceiveUsdc = associated || maxAutoAssociations === -1 || maxAutoAssociations > tokens.length`
— HIP-904 auto-association, which naive checks get wrong. `associateToken` swallows
`TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT` for idempotency. `parsePrivateKey` sniffs ECDSA-hex vs
DER-ED25519.

### HCS envelope + the size constraint
Versioned envelope `{v, kind, at, data}`. Xorv **rejects >1024B before the SDK silently chunks
it 3×**; Tally instead **reassembles chunks on read** by `chunk_info.initial_transaction_id`.
Both are responses to the same hazard.

**Design decision for Kleeto:** keep the HCS message small and constant-size by publishing a
**merkle root over the artifact list plus a count**, not the artifacts themselves. The full leaf
list lives in the JWS receipt, which has no size limit. A 5-artifact receipt inlined is ~900B —
under the cap but with no headroom; a root is ~64B regardless of how many files the agent made.
Implement chunk reassembly on read anyway (Tally's `anchor.ts`) as a belt-and-braces.

### Custody: the broker never holds funds
`RoutesConfig.accepts[].payTo` and `.price` are **resolver functions of the request context**
(`app.ts:441-455`), so the payee is the matched provider. Amounts are **frozen on the quote at
quote time and never recomputed at payment time** — recomputing breaks correctly-signed
payments, which applies directly to our credit-pool top-ups. Post-settlement hooks:
`x402Server.onAfterSettle` / `onVerifyFailure`.

### Marketplace model (`registry.ts`)
Deliberately in-memory: membership is liveness, durability lives on HCS. `Provider {id, label,
accountId, endpoint, capabilities[], status, activeJobs, lastHeartbeatAt, version, region,
stats}`; `Capability {id, adapter, displayName, model, priceUsdMicros, maxConcurrency}`. Status
is **derived from the clock on every read** — a cached status let a dead node be sold. Matcher
sorts cheapest-first, tie-breaks on `successScore` (new providers get **0.5**, not 0 or 1), then
emptiest. Reaper at 10 min.

### Browser payments
Wallet is HashPack/Blade/Kabila over **WalletConnect HIP-820**, explicitly **not Privy** —
Privy signs EVM RLP, and Hedera `exact` needs a native protobuf `TransferTransaction`
(`lib/hedera-wallet.ts:1-35`). The whole `ClientHederaSigner` interface is
`{accountId, createPartiallySignedTransferTransaction() → base64}`, which lets `@hashgraph/sdk`
and `@hiero-ledger/sdk` coexist without meeting. `@x402/*` is lazily imported to keep it out of
first paint. `decodeRefusal()` reads the real reason out of the base64 `payment-required` header.

### CLI auth model
Provider side: registers and receives a bearer token echoing a **self-generated `nodeId`**, so a
restart reclaims the same slot and stats. Buyer side: Hedera key held locally
(`--key` / env / `~/.xorv/config.json` at `0600`, dir `0700`).

## Mystic — thin; mostly a cautionary tale
Only `vpn-server/` (~1,800 lines TS, Hono) is on the Hedera path. The Rust
`protocol/boringtun/src/payment/` module is **legacy from a different chain** — `eip3009.rs`,
EVM `usdc_contract: [u8;20]`, Circle Gateway, and `server/.env.example` still carries
`AVM_ADDRESS` (Algorand) and `facilitator.goplausible.xyz`. The README does not disclose this.
3 test files / 48 assertions; nothing exercises the payment gate end to end.
Metering is coarse: buy N whole minutes up front (1–60), `expiresAt = now + minutes*60_000`, a
10s interval worker removes the WireGuard peer. **No usage is measured at all** — only time
bought. Two things it gets right and we should copy: **health-check the backend before issuing
the 402** (`index.ts:119-121`) so a down backend cannot charge for nothing, and a
`paidButUndelivered()` path that returns the tx id and logs for manual refund.

## Steal list — Xorv/Mystic (ranked)
1. `broker/src/app.ts:110-165` x402 CORS block — verbatim.
2. `protocol/x402.ts:46-157` `buildFacilitator` — self-hosted vs Blocky402 behind one
   `FacilitatorClient` flag; fresh client per settlement.
3. `protocol/money.ts` integer micro-USD + round-up + cached ledger rate (+ Mystic's
   `hbarToTinybars`).
4. `chain.ts` two-client split, `hcs.ts` explicit `freezeWith`, and the `ChainLike` seam for
   credential-free integration tests.
5. Route-level `payTo`/`price` resolvers + frozen quote (never recompute at payment time).
6. `hedera.ts` HIP-904 association check, idempotent associate, `parsePrivateKey` sniffing.
7. HCS versioned envelope + `resultHash` never the payload + `readTopic()` guarded parse.
8. `cli/commands/run.ts` buyer client + non-empty `registerPolicy`.
9. HIP-820 WalletConnect signer + `decodeRefusal()`.
10. `registry.ts` matcher, status-derived-on-read, 0.5 seed score.
11. Mystic: pre-402 backend health check + paid-but-undelivered logging.
12. Ops polish: `/metrics` Prometheus text, `doctor --json --fix`, bodyLimit/rateLimit guards.

## Avoid list — Xorv/Mystic
- **Hand-rolled payment gate** (Mystic) — reimplements `@x402/hono` + `x402ResourceServer`
  without the hooks, header negotiation or CORS knowledge.
- **`Access-Control-Allow-Origin: '*'` with `Allow-Headers: '*'`** (Mystic `index.ts:85-91`).
- **In-process `Map` as the only record of paid state** (Mystic `sessionStore.ts:9`) — fatal for
  credit pools; a restart destroys balances people paid for.
- **Resource keyed on a client-supplied public key with no payer binding**, plus a free
  unauthenticated `/session/clear` — anyone who learns a WG public key can tear down a paid peer.
- **`renewSession` overwriting `durationMinutes`** — silently corrupts the renew price fallback.
- **Shipping a large dead payment subsystem from another chain, undisclosed** (Mystic).
- **`onAfterSettle` matching a settlement to "the most recent unpaid job for that payTo"**
  (xorv `app.ts:546-550`) — positional, not keyed; will mis-attribute under concurrent sessions
  to one seller. Thread a correlation id instead.
- **npm scripts pointing at files that do not exist** (`xorv` `pnpm demo` → missing
  `scripts/demo.ts`). Judges run these.
