# What Kleeto uses from the upstream provider, and the live-view UI

## A. Wired and verified working
| Capability | How we use it | Verified |
|---|---|---|
| `POST /sandboxes` kind=sandbox | `machine-*` lanes (headless microVM) | up in **1.27s** |
| `POST /sandboxes` kind=desktop | `desktop-*` lanes (XFCE, `office` template) | up in ~1.3s |
| `POST /sessions` (fast pool) | `browser-fast` lane, driven over CDP/Playwright | HN + Hyperliquid scrapes |
| `POST /sandboxes/:id/exec` | every command; the REST fast path, no control-channel WS needed | yes |
| Template `base` | machine lanes: Python 3.11.2, Node 18, git | yes |
| Template `office` | desktop lanes: LibreOffice, Chrome, Evince, Thunar, xdotool, scrot | yes |
| `cpu` / `memMb` sizing | drives the lane table (1–8 vCPU, 2–16 GiB) | yes |
| `lifecycle.onTimeout: "kill"` | upstream must never outlive our meter | yes |
| `Idempotency-Key` on create | a retried provision cannot double-charge a machine | yes |
| `DELETE /sandboxes/:id` | teardown, idempotent | yes |
| `GET /sandboxes?state=running` | reconciliation sweep for leaked machines | yes |
| **`streamUrl` (wss RFB)** | **desktop live view — RFB 003.008 handshake confirmed** | **yes** |
| Session recording (rrweb) | browser lane replay, `.ndjson.gz` presigned | yes |
| Preview URLs | public HTTPS for a port inside a lane | yes (curled from my laptop) |
| Artifact hashing | `sha256` computed *inside* the machine, JSON-emitted | in-machine == local |

## B. Available, worth wiring next
| Capability | Why we want it |
|---|---|
| **Snapshot / fork** | pay once to warm a lane, fork N; the "50 machines" demo beat |
| **Pause / resume** | stop the meter without losing state on a long lease |
| `record: true` → server-side **mp4** | edit-ready demo footage. **Desktop + built-in template only**; combined with `fromSnapshot` or a `tpl_…` it returns a dead link |
| Volumes | persist datasets across leases |
| Custom templates (`Image.base().aptInstall()`) | a `desktop-creative` lane with Blender/GIMP/Inkscape |
| PTY | interactive terminal in the web UI |
| `runCode` stateful REPL | matplotlib charts returned as base64 PNG + structured chart data |
| `git` namespace | clone/commit/push with per-call credentials, never persisted |

## C. Plan-gated on the current key (free tier)
`stealth`, `captcha`, `proxy` all return **402 FeatureRequiresPlan**; `webBotAuth` unsupported.
Concurrency: **1 machine / 3 browsers**. Starter ($20) unlocks stealth + proxy + captcha and
raises concurrency to 2 machines / 20 browsers.
Consequence today: fast pool only, so Cloudflare-defended sites are out and a US exit IP
triggers geo banners. `browser-stealth` stays out of the lane table until it is measured.

## D. Deliberately not used
Legacy `/desktops` route (superseded by `/sandboxes` kind=desktop, and it does **not** reject
`record:true` on a restore boot, silently handing back a dead recording URL); the control
WebSocket (v1 uses the REST `/exec` fast path so a lease survives a gateway restart with
nothing to re-establish).

---

# The live-view UI

## The security problem, stated plainly
`streamUrl` is `wss://api.getsolari.com/stream/<signed-session-id>`. **The signed id in the URL
IS the capability, and it is full control, not view-only.** Anyone holding that URL can move the
mouse and type. There is no documented `viewOnly` flag on this provider.

So the URL may only ever reach the lease holder. For any public or shared view — the landing
page, a demo link, a judge watching — the gateway must proxy the socket and filter it.

## Read-only proxy
RFB client→server messages are typed by their first byte. The gateway relays only what a viewer
needs to render, and drops anything that mutates the desktop:

| msg type | meaning | read-only viewer |
|---|---|---|
| 0 | SetPixelFormat | relay |
| 2 | SetEncodings | relay |
| 3 | FramebufferUpdateRequest | relay |
| 4 | KeyEvent | **drop** |
| 5 | PointerEvent | **drop** |
| 6 | ClientCutText | **drop** |

Server→client frames pass through untouched. Same socket, one byte of inspection, and
"watch the agent work" becomes safe to hand to anyone. Interactive takeover is then an explicit
capability the lease holder can request — which is exactly the human-in-the-loop beat that only
two of the 27 sites we surveyed even talk about.

## Screens
1. **Lease view** — the hero. Left: live desktop (noVNC on the read-only proxy) or the browser
   lane's current screenshot. Right: a meter ticking seconds → tinybar → USD, the credit
   balance draining, and a top-up button. Below: the command/tool log as it happens.
2. **Receipt view** — artifacts table (path, size, sha256), the merkle root, HashScan links for
   every settlement, and a "verify this bill yourself" command that recomputes from the mirror
   node with no credentials.
3. **Catalogue** — the 7 lanes with price per hour *and* per 10 minutes, in USD.
4. **Replay** — rrweb player for browser leases, mp4 for desktop leases.

## Stack
Next.js app router (the shape the previous winners shipped), `@novnc/novnc` for the desktop
canvas, `rrweb-player` for browser replays, SSE from the gateway for meter and log events,
WalletConnect **HIP-820** for human top-ups — not Privy, which signs EVM RLP while Hedera
`exact` needs a native protobuf transfer.

---

# Feature verification run (2026-09-04) — all green

Every capability below was exercised against the live provider on the free tier.

| Feature | Result |
|---|---|
| Volume create + mount at `/data` | persisted, read back |
| `machine-2` boot | **753–875 ms** |
| Stateful code REPL | variables survive between calls (`sum=900`) |
| matplotlib → PNG | 17,952-byte PNG returned inline as base64 |
| Structured chart data | **empty on the `base` template** — the docs warn this is template-dependent; always fall back to the PNG |
| PTY | interactive terminal, echo round-tripped |
| Preview URL | public HTTPS, **200** from my laptop |
| Artifacts | hashed in-guest, merkle root computed |
| Snapshot | taken while the machine kept running |
| Pause → resume | state intact, `# lane report` read back after resume |
| Fork from snapshot | state carried across |

## Performance, measured not assumed
- Golden-template boot: **~0.75–1.3 s**
- Snapshot **restore: 15–69 s** — an order of magnitude slower than a fresh boot.

**Consequence: do not promise "fork 50 machines instantly."** Forking is for carrying *state*
(a warmed cache, an installed toolchain, a logged-in profile), not for fan-out latency. A fresh
golden boot is far faster than a restore. This kills the tree-of-thought fan-out demo beat and
we should not claim it.

## Two SDK behaviours that cost real time
1. **Never connect the control channel eagerly.** `provision()` returns before the channel is
   needed; plain `runCommand` rides a warm HTTP path. A snapshot-restored machine serves that
   path happily while its control channel is still settling — connecting eagerly turns a healthy
   fork into `Control channel closed (1005)`. The adapter now opens the channel lazily, with
   backoff, and only for calls that genuinely need it (`runCode`, `pty`, `screenshot`,
   `openApp`, `health`).
2. **`pause()` closes the control channel and rejects everything in flight**, and `resume()`
   mints a *fresh* controlUrl. Those rejections can land with nobody awaiting them, which kills
   the process and skips the teardown in `finally`. `resume()` must reconnect; the process needs
   an `unhandledRejection` guard.

## Leak lesson for the gateway
A create that succeeds but whose *connect* fails still leaves a machine running and holding a
concurrency slot. Teardown must be driven by "did we create it", never by "did we finish with
it". Both leaks observed here produced `429 ConcurrencyLimitExceeded` on the next run.

## Volumes do not follow a fork
A machine forked `fromSnapshot` does **not** inherit the volumes of the original; they must be
re-passed at create time. Verified: `/data` was empty on the fork.
