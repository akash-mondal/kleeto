# Hero recording — provenance

Shot 2026-09-05 on a live `desktop-4` lane (4 vCPU / 8 GB / Xfce, 1280×720) with
`scripts/record-workspace.mjs`. Server-side capture via the desktop's own `record.start()`
at 15 fps; the mp4 was pulled from the guest with a presigned download URL.

## What is on screen
| pane | what it is |
|---|---|
| top-left | Google Chrome on the live Hacker News front page |
| top-right | LibreOffice Calc holding the eight stories the agent pulled from the HN API |
| bottom-left | a terminal running `kleeto`, printing this lease's real elapsed seconds and this lane's real rate (98,000 tinybar/s, $0.2728/hr) |
| bottom-right | Evince showing the PDF the agent produced from the sheet |

## What is staged and what is not
- **Not staged:** the site, the data, the spreadsheet, the PDF, the hashes, the elapsed
  time, the price. `kleeto` is a real script; it reads `KLEETO_START` and the lane's
  published rate and computes the rest.
- **Staged, cosmetically:** window placement (wmctrl), and `wmctrl` itself is installed
  before capture starts so the package manager never appears on camera.
- **Edited:** trimmed to start after the browser settles, sped up 1.55×, silent. Nothing
  else. No cuts, no compositing, no overlays.

## Files
- `raw.mp4` — 85.5 s as captured, 3.6 MB
- `cut/edit.mp4` — the 43 s edit at 24 fps
- `../../landing/public/video/workspace.mp4` — H.264, 689 KB
- `../../landing/public/video/workspace.webm` — VP9, 1.2 MB
- `../../landing/public/video/workspace-poster.jpg` — poster, 148 KB
- `artifacts.json` — the files the machine produced, hashed in-guest, with the merkle root
- `step-*.png` — a still from each stage of the run
