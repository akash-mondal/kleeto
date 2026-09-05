# Solari live test — 2026-09-04 (key slr_live_d59w…, plan: free)

## Setup that works
- Cline CLI 3.0.61 headless: `cline -P cline-pass -m cline-pass/glm-5.3-flash --json --thinking low -t <s> -c <cwd> "<task>"` → NDJSON events. ClinePass OAuth already present in ~/.cline/data/settings/providers.json.
- GLM-5.3-Flash on ClinePass: 1.3M ctx, capabilities images/video/tools/reasoning, $0.075/M in, $0.25/M out. "GLM_OK" smoke test in 3.1s.
- Solari MCP registered in ~/.cline/data/settings/cline_mcp_settings.json as stdio `npx -y @solarisdk/mcp` (v0.4.3) with SOLARI_API_KEY env. Tools appear as `solari__solari_*`. Image tool results reach the model (it described screenshots correctly).
- Observer loop (independent of the agent): poll `GET /sandboxes?kind=desktop&state=running`, then `POST /sandboxes/:id/exec` `scrot` + base64 every 12s → agent-runs/runN-shots/. Works. Recording mp4 (`record:true` on create) also returned a presigned S3 URL.

## Plan gating on this key (free)
- Stealth, captcha, proxy → `402 FeatureRequiresPlan`. webBotAuth unsupported. Concurrent: 1 sandbox/VM, 3 browsers. Desktops ARE entitled on free (worked).
- Consequence: fast pool only. Fast pool gets Cloudflare "Just a moment" on openai.com (seen in run 1). Stealth/captcha tests need Starter ($20).

## Run 1 — browser (fast pool), 4 min, ~$0.01
Task: HN top-10 table + open #1 + summary + screenshot + replay. Result: hn-report.md correct (10 rows w/ points/comments/URLs), replay URL obtained. #1 story (openai.com) blocked by Cloudflare challenge; GLM tried clicking the Turnstile checkbox twice, then fell back to a server-side fetch for the summary and documented that honestly. First create call asked for stealth → 402 → self-recovered to fast mode.

## Run 2 — desktop multi-app (office template), 15.8 min, 52 iters, $0.046, timed out
Achieved: desktop create → Chrome → Wikipedia Hedera article → read from screen (accurate) → Writer → typed 3-bullet memo → Save dialog → ODT saved (with one human click).
Failure modes observed:
- `solari_open_app` called with "app --flag url" as one string twice (exec fails); fixed itself both times by `which` + args array.
- Claimed "saved, title bar confirms" while the GTK dialog showed "/root/Desktop: No such file or directory" — hallucinated success, caught by my independent screenshot. It later found the truth via `ls`, made the dir.
- Return/Alt+F key events via solari_key often didn't reach the GTK dialog/menu; coordinate clicks work. I (human) clicked Save at (1210,50) → file saved instantly.
- Typed the file path into the document body once when focus was wrong.
- Chrome window title in template starts at about:blank (Chrome pre-opened in office template).
Artifacts: /root/Desktop/hedera-memo.odt (15,187 B), run2-shots/ (50 frames).

## Run 3 — desktop continuation (re-attach via solari_connect), 6.5 min, 26 iters, $0.025, completed
Re-attached to the same VM by session id. GUI: File → Export As → Export as PDF → PDF Options reached with coordinate clicks (menus work by click); the Export button click never registered (screenshots byte-identical) — agent detected this via `ls` and honestly reported it, then fell back to `libreoffice --headless -env:UserInstallation=file:///tmp/lo-convert --convert-to pdf` (needed a separate profile because GUI Writer holds the lock). PDF 14,824 B. Opened in Evince (open_app + args list worked), final screenshot shows Chrome + Writer + Evince. Agent screenshot == my watcher frame (verified identical scene). Artifact copied out: agent-runs/hedera-memo.pdf.

## Run 4 — headless sandbox dev task, 2.7 min, 11 iters, $0.0046, completed
git clone psf/requests → pip -e . → `requests 2.34.2` on Py 3.11.2 → pytest tests/test_structures.py → `24 passed in 0.04s` → solari_run_code matplotlib → PNG returned inline (19,784 B) → wrote /work/site/index.html → `python3 -m http.server 3000` via run_command_bg → solari_get_preview_url → I curled the public preview URL from my Mac and got the HTML (HTTP 200) → REPORT.md → solari_kill. Zero errors, zero hallucinations. This lane is the cleanest by far.

## Observations so far
- Cost/time: browser ~$0.01/4min; desktop ~$0.07/22min across two runs; sandbox $0.005/3min. Compute side on Solari: negligible at free-tier rates.
- GLM-5.3-Flash + MCP: good at shell/code verification and honest reporting when told "never claim success without evidence"; weak at GTK dialogs via synthetic key events (Return/Alt+F frequently lost), strong with coordinate clicks on menus. Once claimed a save succeeded that hadn't (caught by independent screenshot).
- Visual observability: (a) agent's own solari_screenshot images are in the NDJSON as base64 (extracted to runN-agent-shots/); (b) my independent exec+scrot watcher gives a second, un-influenced view; (c) browser sessions give rrweb replay URLs; (d) desktop `record:true` gives server-side mp4 (only when I create the VM via API, not via MCP).
- Human-in-the-loop works trivially: same VM, xdotool via /exec — I clicked Save while the agent was mid-task and it picked up the new state.

## Run 5 — Hyperliquid leaderboard (Demo-1 scenario), fast pool, 3.8 min, 14 iters, $0.0068, completed
app.hyperliquid.xyz/leaderboard rendered fully on the FREE fast pool — no Cloudflare challenge. Top-10 table extracted (rank, address, account value, PnL, ROI). Clicked into #1 → explorer address page (TokenDelegate/SystemSpotSend txs; no perp positions on that view — agent said so honestly). Recording + replay URL obtained. Agent screenshots show the mobile-width SPA layout (viewport default ~800px) and a "restricted jurisdiction" banner because the exit IP is US → a paid `proxy:{country:"sg"}` would remove that banner; that is the real reason Demo 1 wants the stealth+proxy tier, not Cloudflare.
Small slip: `sed` truncated the signed replay URL; agent noticed and rewrote it with Python.

## Demo implications
- Demo 1 (browser research) is feasible on free tier today; upgrade to Starter for proxy country + stealth to avoid the jurisdiction banner and to survive Cloudflare sites (openai.com blocked in run 1).
- Demo 2 (desktop multi-app) works on free tier; make the task use coordinate clicks for dialogs, pre-create ~/Desktop, and expect ~15–25 min unedited runtime for a 4-app flow with GLM-5.3-Flash. Use `record:true` on a built-in template when creating via API to get the server-side mp4 for editing; MCP-created desktops don't record.
- Everything the agent sees is recoverable: agent screenshots in NDJSON, independent scrot watcher, rrweb replays, mp4.
