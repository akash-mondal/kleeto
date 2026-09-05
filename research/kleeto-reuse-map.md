# Kleeto — what to lift from the existing rail, what to build new

Read of the prior codebase (186 files, ~9.2k LOC in the modules that matter). Conclusion:
the settlement rail is production-grade and generalises unchanged; the *service surface* is
the thing being replaced.

## Lift as-is (the rail)
| Module | LOC | Why it transfers unchanged |
|---|---|---|
| `src/session.mjs` | 411 | Session state machine OPENING→ACTIVE↔PAUSED→SETTLING→CLOSED. Credits minted only after on-chain confirmation, idempotent on settlement tx id, pause-at-zero (never overdraw), per-session bearer secret (sha256 + timingSafeEqual), refund not gated on the anchor. All of this is lane-agnostic — "1 credit = 1 event" becomes "1 credit = 1 second of a lane". |
| `src/ledger.mjs` | 206 | Two-tier HCS ledger. Tier 1 burn checkpoints (~$0.0008/write) carrying session, payer, funding txs, price, event range, cumulative burn + commitment hash. Tier 2 HIP-991 settlement anchor (~$0.05, costs the seller ~0.73 HBAR of irrecoverable fees) embedding tier-1's final `sequence_number` + `running_hash`. This IS the differentiator; keep verbatim. |
| `src/receipt.mjs` | 139 | x402 `offer-and-receipt` JWS profile, ES256K over secp256k1, `did:hedera:...#key-1` kid, hand-rolled because the SDK's `sign()` isn't RFC-7515 compatible. Extend the payload, don't rewrite the signing. |
| `src/verifier.mjs` | 179 | Independent bill recomputation from mirror node alone. |
| `src/config.mjs` | 108 | `resolveFeePayer()` from `/supported` (never hardcode), `awaitTx` bounded backoff, `tinybarToUsd` from the network's own exchange rate. |
| `compute/guards.mjs` | 211 | Budget ceilings, concurrency caps, GPU reserve fraction. Testnet HBAR is free from a faucet, so payment provides zero economic friction — guards are the only thing between a stranger and a real card. Directly applicable.  |
| `src/client.mjs` / `src/mcp.mjs` / `src/agent-kit-plugin.mjs` | 457/179/233 | Buyer-side 402→sign→retry, MCP tool surface, Agent Kit plugin. Retarget the tool list, keep the plumbing. |

## Replace (the service surface)
`compute/adapters/` currently has local / Daytona (CPU) / Modal (GPU) behind a 4-method
`ComputeAdapter` (`provision`, `attachStream`, `metrics`, `terminate`) plus optional
`exec/writeFile/readFile/listFiles` and `provision({hold:true})`.

That interface is too narrow for what Kleeto sells. New shape needed:

```
KleetoLane
  provision(spec)        -> {handle, startedAt, streamUrl?, controlUrl?}
  attachStream/metrics/terminate        (unchanged contract)
  exec / writeFile / readFile / listFiles
  + snapshot(handle) -> snapId ; fork(snapId) -> handle ; pause/resume
  + previewUrl(handle, port) -> signed public URL
  + screenshot(handle) -> bytes            [desktop]
  + mouse/keyboard/clipboard/openApp       [desktop]
  + navigate/readPage/evaluate/click/type  [browser]
  + replayUrl(handle) -> rrweb            [browser]
  + recordingUrl(handle) -> mp4           [desktop]
  + artifacts(handle) -> [{path, sha256, bytes}]   ← new, feeds the receipt
```

Lane families for Kleeto (all verified working today against the upstream provider):
- `machine-*` — headless microVM: commands, PTY, git, stateful Python REPL, matplotlib charts, preview URLs. (Verified: clone→pip→pytest 24 passed→chart→public URL, 2.7 min.)
- `browser-*` — real Chrome over CDP/Playwright: fast + stealth pools, residential/static/mobile proxy by country, captcha solving, persistent logged-in profiles, rrweb replay. (Verified: Hyperliquid leaderboard scraped + replay URL; stealth/proxy/captcha gated behind the upstream paid plan.)
- `desktop-*` — full XFCE Linux desktop: VNC live view, mouse/keyboard/screenshot/clipboard/openApp, server-side mp4. (Verified: Chrome→Wikipedia→LibreOffice memo→PDF→Evince, with a human taking the mouse mid-task.)

## Changes the rail needs
1. **Mainnet + testnet.** `config.mjs` pins `NETWORK = "hedera:testnet"`, `ledger.mjs` calls
   `Client.forTestnet()`, `hashscan.*` hardcodes `/testnet/`. Make network a first-class
   config axis: `{network, mirror, facilitator, hashscanBase, client}` resolved once at boot.
   Facilitators: testnet `https://api.testnet.blocky402.com`, mainnet `https://api.blocky402.com`
   (both advertise `hedera:<net>` + `extra.feePayer`; read it from `/supported`, never hardcode).
2. **Artifact-anchored receipts.** Extend the tier-1 checkpoint + JWS receipt with
   `artifacts: [{path, sha256, bytes}]`, `replayId`, `finalScreenshotSha256`. This turns
   "proof you were billed honestly" into "proof of what the machine produced" — the thing
   nothing else in the category has.
3. **Per-lane rate card.** `rates.json` keeps its shape (`providerCostPerSecUsd`,
   `creditTinybar`, verified-cost flags, margin) — add browser/desktop/machine lanes with the
   upstream's real per-second numbers.
4. **Concurrency guard vs upstream caps.** Upstream free tier = 1 concurrent machine, 3
   browsers; stealth/captcha/proxy require a paid plan. The gateway must return a clean
   `503 retryable` before the upstream returns `429`.
