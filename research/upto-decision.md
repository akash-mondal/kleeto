# Decision: do NOT implement `upto` for Hedera

Researched 2026-09-04. Verdict: **skip it.** Reasoning below, with sources.

## 1. It already exists and won the same bounty programme
Hedera announced the previous x402 bounty winners on 2026-08-31
(https://hedera.com/blog/x402-bounty-on-hedera-winners-announced, Jake Hall, DevRel):

> "**Tally**, by Madhav Gupta — Tally is the first non-EVM implementation of x402's `upto`
> scheme… The Hedera Smart Contract Service enforces that cap in consensus through an
> admin-less Permit2 equivalent that spends an HTS allowance under HIP-336 and HIP-376, bound
> to a single payee… the `upto` scheme was submitted upstream to the x402 protocol repo."

Repo https://github.com/Madhav-Gupta-28/Tally, enforcement contract testnet `0.0.9556979`.
(Note: no `upto`+hedera code, issue or PR is findable in coinbase/x402 via the GitHub API —
the upstream submission is **unverified**. The prior art itself is not in doubt.)

## 2. Conformant `upto` on Hedera REQUIRES a smart contract
`specs/schemes/upto/scheme_upto.md` imposes four MUSTs: single-use authorization (nonce),
time-bound (validAfter/deadline), recipient binding, and max-amount.

Pure HAPI `AccountAllowanceApproveTransaction` (HIP-336) satisfies **only max-amount**:
- allowances have **no expiry field** at all (`crypto_approve_allowance.proto` carries only
  `{owner, spender, amount}`) → fails time-bound
- no nonce → fails single-use
- nothing binds `payTo` → a spender holding a 5 USDC allowance can send it anywhere, any
  number of times, forever
- consensus-node `AdjustHbarChangesStep` requires `topLevelPayer == allowance.spenderId()`,
  so a HAPI-only design forces facilitator == spender — relocating trust, not removing it
- revocation is owner-only (`approve 0`; `AccountAllowanceDeleteTransaction` is NFT-only), so
  leftover ceiling persists after settlement

Restoring the other three MUSTs needs an HSCS proxy using HIP-376 `transferFrom` — i.e. a
smart contract. That **contradicts the differentiator the judges explicitly praised**:
> "The facilitator pays all network fees and **there is no smart contract**, so any buyer can
> recompute the whole bill from the free public mirror node." — Hedera on Pinout, same post

It also contradicts Hedera's own marketing: AI Studio "removes the need to write or audit
smart contracts."

## 3. `upto` is the wrong shape for renting a machine
`scheme_upto.md` lists **"multi-settlement/streaming, recurring"** as explicitly out of scope.
It is one authorization → one settlement. A rented computer runs for an unbounded duration and
tops up repeatedly. The existing credit-pool session already does what `upto` declines to do.

The spec also concedes the trust gap it does not close: "Malicious servers could charge up to
`amount`." Recomputable HCS checkpoints are not weaker than that; they are the same
off-chain-fairness assumption with a better audit trail.

## What takes its place as "extra credit"
The new bounty says: *"x402 on Hedera is still short of one thing: actual services you can pay
for."* They want services, not more protocol. So:

1. **Streaming multi-settlement** — position it as the thing `upto` explicitly refuses. A
   ceiling-and-settle scheme cannot rent you a machine for an hour; a credit pool with
   continuous top-up can.
2. **Artifact-anchored receipts** — sha256 of every artifact, replay id, final screenshot hash
   in the HCS checkpoint and the JWS receipt. Proof of *what the machine produced*, not just
   proof of billing. Neither the sandbox category nor the payments category has this.

Both extend the no-smart-contract architecture rather than abandoning it.

## Reusable finding (kept for reference)
If `upto` is ever revisited: a third party CAN be fee payer for an allowance approve
(buyer signs as owner, facilitator pays and submits, `transactionId.accountId = facilitator`),
and `AccountAllowanceApproveTransaction` is `toBytes()`-serialisable partially signed — so the
`exact_hedera` envelope pattern does transport it. Caps: 20 approvals/tx, 100 allowances/account.
Pre-signing a blank-amount transfer is impossible (`SignedTransaction.bodyBytes` covers every
`AccountAmount.amount`). Scheduled transactions freeze the amount at creation, so they are also
a dead end for variable pricing.
