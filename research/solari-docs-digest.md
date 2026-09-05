# Solari (docs.getsolari.com) — full-docs digest, read 2026-08-30

One provider, three products, one `slr_live_` key, base `https://api.getsolari.com` (region us-west only).

## Products
1. **Browsers** (`@solarisdk/browser`, class `Solari`): real Chrome ~1s. `launch()` → Playwright Browser (TS/Python only; Go/Rust/C++ get cdpEndpoint). Options: `stealth`, `proxy` ("us" | {country,tier:residential|static|mobile,session,sessionDuration,state,city,asn} | "smart" escalation ladder), `captcha` (reCaptcha v2/v3, hCaptcha, Turnstile), `recording` (rrweb replay), `profileId`, `webBotAuth`. proxy+captcha REQUIRE stealth. 15 proxy countries; static tier in 12.
2. **VMs / Desktops** (`@solarisdk/desktop`, `DesktopClient`→`Desktop`): full Linux GUI on Cloud Hypervisor microVMs, boot from memory snapshot (~1s). VNC via `streamUrl` (raw RFB WS; `mountDesktop(el,{streamUrl})` helper needs @novnc/novnc). Control: mouse (humanize option), keyboard (type/press/hotkey/down/up), screenshot (png/jpeg), display.set/size/cursor, clipboard, `open(app,args)`→pid, process.list/kill, exec/execStream, fs.*, record.start/stop (mp4 in guest → downloadUrl()), pkg.install.
3. **Sandboxes** (`@solarisdk/sandbox`, `SandboxClient`→`Sandbox`): same engine headless. commands.run/start (no shell by default — use `sh -c`), pty.create, runCode (stateful Python REPL; matplotlib → base64 PNG + structured `charts`), files.* (write/readText/list/search/watch), git.* (clone/status/add/commit/push/pull/checkout/branches/log; creds per-call, never persisted), env(), previewUrl(port) → signed public URL (`pt_token`, 1h; 425 while nothing listening), metrics(). `Desktop extends Sandbox` — everything works on a desktop too.

## Shared machine features
- Sizes: cpu 1–16 (default 2), memMb up to 65536 (default 2048), diskGb 1–100 (default 10, sandboxes route only). Size survives pause/resume.
- **Templates**: built-ins `base` (sandbox), `default`/`workstation` (Ubuntu desktop), **`office`** (desktop + LibreOffice, GIMP, Inkscape, file manager, PDF viewer), **`code`** (desktop + git/Python/Node + VS Code in browser). Custom: `Image.base("ubuntu:22.04").kind("sandbox"|"desktop").aptInstall().pipInstall().runCommands().env().workdir()` → `templates.build(image,{name})` → `tpl_…` (202 async; status building|ready|failed). `Image.fromTemplate("workstation")` OK. addLocalFile NOT supported (`LocalFilesUnsupported`).
- **Snapshots**: `sbx.snapshot(name)` (machine keeps running) → `snap_…`; `revert(snapId)` rewinds same machine (same id); `create({fromSnapshot})` forks N independent copies; `promoteSnapshot(snapId,name)` → template. Delete blocked while live children (`SnapshotHasChildren`).
- **Volumes**: org-owned S3-backed folders; `volumes.create({name,sizeMb,metadata})` → `vol_…`; mount via `create({volumes:[{volumeId,path:"/data"}]})`; absolute unique paths; multi-attach OK; survive machines.
- **Lifecycle**: rolling idle `timeoutMs` (default: sandbox 2h [SDK docs page says 30m default if unset — API says 2h sandbox/30m desktop], desktop 30m); activity resets; `lifecycle:{onTimeout:"pause"|"kill", autoResume}`. pause() saves RAM+disk, stops billing, frees concurrency slot; resume() re-checks credit and returns fresh controlUrl. Paused survives host replacement (snapshot → S3).
- **Recording (server-side mp4)**: `record:true` only for kind desktop AND golden-template boot; `RecordingRequiresDesktop` / `RecordingRequiresGoldenBoot` on /sandboxes; NOTE /desktops does NOT reject the restore case → dead link. `201` carries presigned `recordingUrl`.

## HTTP API essentials
- Two gateways, same host. REST = lifecycle only; live work rides WebSockets (`/ws` Playwright, `/cdp`, `/control` JSON-RPC, `/stream` RFB). Signed session IDs ARE the capability — URL-encode (contain `:` `.`), treat as secrets.
- Fast paths: `POST /sandboxes/:id/exec` one-shot ({cmd,args} no shell) and signed file upload/download URLs.
- `POST /sessions` (browser) → {sessionId, wsEndpoint, cdpEndpoint, expiresAt, storageStateUrl(presigned), proxy?}. **Proxy degradation is silent** — assert `proxy` field presence. `GET /sessions/:id` is dead (always 404). DELETE → 204 = accepted (fire-and-forget; orphan reaper ~3.5m). Replay URL: poll through 404, ready 1–3s after release.
- `POST /sandboxes` unified (kind sandbox|desktop) — preferred over legacy `/desktops`. Idempotency-Key on creates (24h replay, `Idempotent-Replayed: true`).
- Desktop ids work on every /sandboxes/:id/* route.
- Errors: `{error, code?, retryable?}`. Codes: FeatureRequiresPlan(402), InsufficientCredit(402), NotEntitled(403), PlanLimitExceeded(403), ConcurrencyLimitExceeded(429, NOT retryable), ConcurrencyCheckUnavailable(503), InvalidSessionId(404), TemplateKindMismatch, TemplateNotReady, TemplateBuilding, SnapshotHasChildren, LocalFilesUnsupported, RecordingRequiresDesktop, RecordingRequiresGoldenBoot. Retry 502/503/504 + `retryable:true`; 404 is deliberately opaque cross-org.
- **Solari itself uses HTTP 402** for plan/credit failures — nice resonance with x402.

## SDK gotchas (TypeScript)
- ESM only; browser pkg needs Node ≥20, others ≥18; `await using` needs 22+.
- **No SDK reads env vars** — pass apiKey (and baseUrl for Desktop/Sandbox clients: required!) explicitly. Only the `solari` CLI reads SOLARI_API_KEY.
- `sbx.connect()` REQUIRED before control-channel methods (files, runCode, pty, git, env, commands.start). Exception: plain `commands.run()` rides warm HTTP.
- `SandboxClient.connect(id)` does NOT resume paused (call resume()); `DesktopClient.connect(id)` DOES resume.
- Desktop GUI methods throw ConnectionError until `vm.connect()`; wait `health().ready`.
- Browser `wsEndpoint`/`cdpEndpoint` from the TS SDK are loopback LocalProxy URLs (process-local); other SDKs return upstream URLs. wsEndpoint needs patchright-core@1.62.x pin; cdpEndpoint any CDP client.
- `browser.close()` releases session; `client.close()` optional. `releaseAndWait` before `getReplayUrl`. Retry: browser client 502/503/504 ×2 fixed 500ms; VM client any 5xx/retryable ×6 exp+jitter, idempotent-only.
- `@solarisdk/sdk` = SolariClient{desktops,sandboxes,templates,volumes} + `solari` CLI. Python: `solari-browser`, `solari-sandbox`, `solari-desktop` (full parity).

## MCP server
Hosted `https://mcp.getsolari.com/mcp` (Bearer key; rolling out, may 404) or `npx -y @solarisdk/mcp` (env SOLARI_API_KEY). 27 tools: solari_browser_create/navigate/read_page/screenshot/click/type/key/evaluate/replay_url/close; solari_sandbox_create/desktop_create/exec/run_command_bg/run_code/read_file/write_file/list_files/get_preview_url/screenshot/click/type/key/open_app/list/connect/kill. Sandboxes idle-pause (state survives); browsers released on close/idle.

## Pricing & plans
| | Free | Starter $20 | Pro $200 | Ent |
|---|---|---|---|---|
| credits/mo | $3 | $20 | $200 | custom |
| max session | 1h | 5h | 24h | ∞ |
| browsers: rate | $0.15/h | $0.10/h | $0.07/h | $0.05/h |
| concurrent browsers | 3 | 20 | 150 | 150+ |
| stealth | ✗ | ✓ | ✓ | ✓ |
| captcha | ✗ | $0.01 | $0.005 | $0.005 |
| proxy /GB | ✗ | $1.00 | $0.10 | $0.10 |
| vCPU-hr | $0.0525 | $0.035 | $0.0245 | $0.0175 |
| GB-hr | $0.0165 | $0.011 | $0.0077 | $0.0055 |
| concurrent sandboxes | 1 | 2 | 10 | 50+ |
VMs +$0.02/h screen. 2vCPU/4GB ≈ $0.114/h Starter. No overage billing — hard stop at zero balance (creates fail `InsufficientCredit`). Desktops need paid plan (`FeatureRequiresPlan` on Free).

## Fit for our demos
- Demo 1 (browser research): `launch({stealth:true, recording:true, proxy:"us"})` + replay URL for b-roll; browser-use via cdpEndpoint if wanted.
- Demo 2 (desktop Blender→Slack): `create kind:"desktop"`, built-in template (needed for `record:true` mp4!), `open()`, mouse/keyboard/screenshot, streamUrl for live VNC shot, record.start/stop → downloadUrl for the edit.
- Caveats: need ≥Starter ($20) for stealth/desktops + 2 concurrent sandboxes; Pro for >2 concurrent machines and 24h sessions. Blender not preinstalled — custom template with aptInstall(["blender"]) (kind desktop) or install on camera. `office`/`code` templates cover GIMP/Inkscape/LibreOffice/VS Code path.
