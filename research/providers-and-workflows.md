# Providers × workflows — what agents actually use sandboxes for

Compiled 2026-08-30 from provider docs/blogs/GitHub (3 research passes) + ~900 X posts (4 search rounds).
Companion files: `x-chatter-2026-08-30.md`, `x-tweets-2026-08-30.json`.

Guiding quote (jlongster, Aug 22): *"I finally get the sandboxes use case. Has nothing to do with security. It's unbounded resources (only limited by $)."* Every workflow below is justified by one of three things: **(S)** the code is less trusted than the host, **(N)** the agent needs N environments, **(P)** the environment must outlive the caller.

---

## Lane A — Ephemeral microVM tool-execution (harness outside, tool calls inside)
**Providers:** Vercel Sandbox · E2B · Novita · Modal Sandboxes · Cloudflare Sandbox SDK · Docker `sbx` (local)

| Workflow | Why the sandbox is justified | Evidence |
|---|---|---|
| **Run LLM-written code as a tool call** — agent writes Python/JS, runs it, reads stdout, iterates | S — model-generated code on a shared host is a breach waiting to happen; harness stays outside for *stability* | Rogo (finance) "any code an agent generates has to run in a sandbox with full auditability"; Vercel KB; jhleath on stability |
| **Data analysis on uploaded files** — CSV/PDF/parquet → pandas → chart/report | S+N — untrusted parsers, one env per upload; pause to avoid re-downloading data | E2B AI-Analyst cookbook, StackAI Code Node, Daytona `pause_on_exit` text-to-SQL guide |
| **Self-healing generate→test loop** — write code, run the test suite, fix, repeat until green | N — parallel attempts, throwaway envs; run the *whole* suite because compute is unbounded | Vercel "durable AI code agent"; nateberkopec "might as well run the whole test suite and git signoff"; Modal docs |
| **Per-tenant isolation in a SaaS product** — each user session gets its own VM | S — enterprise buyers demand no cross-tenant leakage | Genspark, Manus, StackAI, Effective AI (1,000+ concurrent), Delty "hard requirement for enterprise" |
| **Tree-of-thought / fork-and-compare** — snapshot at step k, fork N, keep the best | N — memory-intact forks in ~80ms | E2B fork (100 forks), Podflare, Isorun, Modal snapshots ("branch from checkpoints") |
| **Try a GitHub repo before cloning it** — agent clones, installs, runs, records the session | S — unknown third-party code | ashu_trv project (Pi agent), Bunnyshell PR-review-by-running-the-branch |

**x402 fit:** best of all lanes — short-lived, metered per second, no identity needed. Cloudflare/Vercel bill active-CPU only; Novita/E2B wall-clock.

---

## Lane B — Persistent "computer per agent" (whole harness inside, survives laptop close)
**Providers:** Fly.io Sprites · Blaxel · box · Superserve · Le Bureau · Grok Bot's built-in cloud computer (closed) · Hermes Cloud · Daytona (OpenClaw guide) · Novita (NovitaClaw)

| Workflow | Why | Evidence |
|---|---|---|
| **24/7 personal-agent business ops** — OpenClaw/Hermes/Grok Bot logs into the owner's real SaaS and runs the day: trucking dispatch (find loads, read rate cons, invoice, chase brokers), plumber's morning routine, newsletter business, daily SEO page publishing, evening digest | P — must run while the laptop is shut; S — never on the main machine | beamnxw/DamiDefi trucking; RoundtableSpace plumber; gregisenberg "Billy's newsletter"; sairahul1 "paid its own salary"; AleiahLock 26-agent digest |
| **Autonomous trading/research desk** — 8–14 agents, Polymarket/crypto, 4am morning call, backtests running 13h straight | P+N — long-horizon loops, several agents sharing one env | Argona0x ($50→$5,273), antpalkin 13h40m backtest, ridark_eth 8-agent desk, adiix GROKSTREET |
| **Overnight coding sessions / "close your laptop"** — kick off Claude Code/Codex YOLO, come back to PRs | P+S — `--dangerously-skip-permissions` needs a blast-radius boundary; laptop can sleep | Sprites "start the swarm, close your laptop"; JackWoth98 (GCP VM + iOS SSH); Docker/Anthropic docs; ledwards |
| **Agent-run cloud IDE per human** — hackathons/workshops, 40–100 concurrent | N | Blaxel × HackerSquad |
| **Multi-agent shared office** — chief-of-staff routes work to researcher/writer/designer sharing one filesystem + browser sessions | P — shared persistent state is the product | monokern; Voxyz six-roles; Grok Bot guides |
| **Watch-and-take-over** — human opens VNC when the agent stalls | P | Le Bureau Mission Control; Sprites; Grok Bot "computer view" |

**x402 fit:** medium — needs a wallet with standing balance and a "keep paying while paused" model. Zero-idle billers (Sprites, Blaxel, box) map best. Risk: kocer_eth — bot with logins "signed up for a paid trial in my name" overnight → spend caps are mandatory.

---

## Lane C — Desktop / browser (agent drives Chromium via CDP or pixels via VNC)
**Providers:** Daytona (Linux + **Windows**, screen recording) · Tensorlake (`ubuntu-vnc`, CDP tunnel, warm-profile forks) · E2B Desktop + Surf · Kernel / Browserbase / Browser Use Cloud (browser-only) · Isorun · Cua Cloud Fleets · Bunnyshell · Orgo · OpenSandbox (Alibaba)

| Workflow | Why | Evidence |
|---|---|---|
| **Portals with no API** — insurance claims, payer portals, vendor onboarding, government forms, HR systems; hundreds of records in parallel with session replay for audit | N+S — needs a real logged-in browser per job, isolated from the user's cookies | Browserbase Commure "Scout" (payer portals, 20× daily claims), data-entry cookbook; Daytona/OpenAI CUA form-fill cookbook |
| **QA of generated apps** — agent builds the app, then a second agent clicks through it in a real browser and records video | N — build env + browser env per variant | charlieholtz (Conductor ported to Linux, QA'd by Codex computer use, screen recording); alexop "Claude Code as QA tester"; Daytona A/B GPT (one sandbox per variant + Browser Use) |
| **Research/scraping swarms** — competitor pricing, lead intel, X monitoring, "strip engagement bait and cross-check sources" | N — many browsers, residential proxies, stealth | Kernel `lead-intel.ts` / `ux-swarm.ts`; Browser Use $0.02/hr stealth via Hermes; slash1sol 24h research brief |
| **Legacy desktop software** — Excel with plugins, Office on Windows, native apps, canvas UIs | S+N — pixel-level computer use where no DOM exists | Daytona "Excel with specific plugins", Windows + Office guides, OSWorld on Windows; Isorun "CDP for DOM, pixels for native" |
| **Warm-profile fan-out** — fork a Chrome with cookies/extensions already loaded for N parallel agents | N | Tensorlake snapshots doc |
| **Teach-by-demonstration** — human records a workflow once in the agent's computer view; it becomes a routine | P | Grok Bot "Teach a task" (_avichawla) |

**x402 fit:** high for per-task browser sessions (Kernel/Browser Use already price per hour); Windows desktops are the scarce, premium SKU nobody sells per-request.

---

## Lane D — Cheap isolate tier (no VM; V8/WASM/QuickJS)
**Providers:** Cloudflare Durable Objects (OpenCode-in-a-DO, celld) · Rivet agentOS · Vercel `run` · Naïve (isolate → Firecracker escalation) · PGlite/ElectricSQL (WASM Postgres for sandboxes)

| Workflow | Why | Evidence |
|---|---|---|
| **Read-only investigation agents** — grep/inspect code, never write | cost — "some agents only read code… in-memory bash emulator, no VM, no bill" (until it isn't enough) | PhilipSnyder |
| **Code-mode tool calls** — model writes a small JS snippet to compose 3 API calls; run it in QuickJS with host-function allowlist, pause for approval | cost — "you don't always need a full sandbox" | Vercel `run`; Cloudflare "OpenCode in a Durable Object"; camelAI moved *off* VMs |
| **Always-on lightweight agents at scale** — 2.3ms cold start, 1.2MB per agent | cost | weiinberg on Naïve |

**x402 fit:** micro-prices (sub-cent per call) — the natural "penny SKU" in a marketplace.

---

## Lane E — Fleet fan-out for RL, evals, benchmarks
**Providers:** Daytona (Stanford 1M/mo, Meta MSL, ARES SWE-bench in 20 min) · Modal (100Ks concurrent, RL library) · Runloop (SWE-bench catalog, 10k burst) · HF sandboxes (TRL/OpenEnv) · Tencent CubeSandbox / Cloud Agent Runtime (100k+ concurrent) · SF Compute autoresearch · forkd · OSGym ($0.23/sandbox/day for OS+GUI) · Prime Intellect environments

| Workflow | Why | Evidence |
|---|---|---|
| **RL rollouts** — sandbox per rollout, reset thousands of times; "your GPUs aren't the bottleneck, rebuilding the environment is" | N — snapshot once, roll out 1,000× | sebuzdugan; Daytona TRL 500 concurrent; HF/OpenCode RL blog; MiniMax×Tencent 1M+ rollouts |
| **Benchmark/eval sweeps** — SWE-bench, Terminal-Bench, OSWorld, computer-use arenas | N | Runloop, ARES, Laude 37k sandboxes/week, Coarena |
| **Agent-native "git"** — checkpoint full state (files, dev server, DB, KV cache) at step k, rewind on mistake | N — Stanford paper (akshay_pachaar) | SF Compute microVM snapshots; E2B/Daytona/Modal snapshots |
| **Self-improving agent loops** — agent that tunes other agents, runs each candidate in its own env | N | DeRonin_; Exo recursive agents; ClawGym II |

**x402 fit:** strong for bursty buyers (research labs, indie RL) who don't want to negotiate contracts; needs bulk pricing.

---

## Lane F — Stateful replicas of external systems ("API sandboxes")
**Providers:** Archal (YC S26: Slack/Linear/Datadog + 20 replicas) · Arga Labs ($10M: Slack/GitHub/Salesforce twins) · Cordium (k8s, secretless access to internal DBs/APIs) · NeoSigma-style DB branching

| Workflow | Why | Evidence |
|---|---|---|
| **Test an agent that takes consequential actions before it touches prod** — run it against a twin of Salesforce/Slack, inspect state diffs, reset | S — "teams still test agents in production" | Arga seed announcement; Archal launch |
| **CI for agents** — every PR to the agent runs against replayed real-world traffic in replicas | N+S | Archal "run tests, inspect state changes, reset everything" |

**x402 fit:** untested but attractive — per-run replica environments are the purest "pay for a scenario" product.

---

## Cross-cutting features buyers demanded this month
1. **Isolation tier stated explicitly** (Firecracker/Kata/gVisor/container/isolate) — post-HF-incident, container-only is disqualifying for hostile code.
2. **Egress allowlist + credential broker** — agent never holds the real key (Hermes credential firewall, Runloop Gateway, Fly Connectors, Vercel firewall, Daytona Secrets Manager, Sprites Connectors).
3. **Snapshot/fork/pause-resume** with memory, fast resume (<1s) — championswimmer: "alpha is in fast sleep/resume".
4. **Tunnel/preview URLs** per port; Docker-in-sandbox; stdout dashboard (colemurray list).
5. **Spend/TTL enforcement on the seller side** — cbaihao: x402 endpoints must *enforce* good behavior; kocer_eth overnight-spend horror story.
6. **Inverted provisioning** — mount pre-verified tool snapshots read-only instead of `pip install` per boot (AlexJonesax) → template marketplace angle.

## Minimum viable catalog (one provider per lane, 4 lanes)
| Lane | Pick | Backup |
|---|---|---|
| A ephemeral exec | **Novita** (cheapest E2B-compatible, templates, pause free) | Vercel / E2B |
| B persistent computer | **Sprites** (zero idle, public URL, credential broker, no duration cap) | Blaxel / box |
| C desktop+browser | **Daytona** (Linux+Windows, recording, fork) | Tensorlake (CDP) / Kernel (browser-only) |
| D cheap isolate | **Cloudflare Sandbox/DO** | Rivet agentOS |
Add E (Modal or Daytona GPU) and F (Archal) once A–D are live.
