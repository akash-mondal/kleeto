# gpt-6-astra driving a Kleeto desktop lease, 2026-09-08

One run, 18 minutes on a `desktop-4` lease from the warm snapshot, Codex CLI 0.153.4 with
`model_reasoning_effort=xhigh`, reaching the machine only through the provider's MCP server.

## The task

A seven-milestone GUI chain, chosen so that no step could be shortcut by scripting: read the
five tallest buildings and their heights off a live Wikipedia page in Chrome, retype them into
LibreOffice Calc, build a bar chart through Insert > Chart titled exactly
`Five tallest buildings (m)`, export the sheet to PDF, convert that PDF to PNG in GIMP, compose
a poster in Inkscape with an exact text string, and open the PDF in Evince.

Hard rule given to the agent: no `solari_exec`, `run_command_bg`, `run_code`, `write_file` or
`read_file`. Screen, mouse and keyboard only.

## What it reached

| # | Milestone | Result |
|---|---|---|
| 1 | Read the table in Chrome | done, heights correct to the decimal |
| 2 | Data typed into Calc | done |
| 3 | Bar chart with the exact title | done |
| 4 | `/work/out/towers.pdf` | done, 14,698 bytes |
| 5 | PNG via GIMP | reached the point of launching GIMP; run stopped here |
| 6 | Inkscape poster | not reached |
| 7 | Evince | not reached |

Verified from the artifact rather than from the agent's account: `pdftotext` on the exported
PDF returns the header, all five rows (828, 678.9, 632, 601, 599.1), the chart title character
for character, and the chart's five category labels. Those heights match the page fetched
independently from this machine at the same time. `pdfimages` lists nothing, which is correct:
a Calc chart exports as vector, not as a bitmap.

## What the run says about the model

**It did not take the shortcut.** 176 tool calls, and not one of them was a forbidden tool:
90 screenshots, 46 clicks, 22 keys, 12 typings, 3 app launches, 2 file listings, 1 connect.
2 failed calls. Every artifact came out of an application's own interface.

**It looks before it acts.** Slightly over half the calls are screenshots, taken after nearly
every action rather than assuming a click landed.

**It was honest about an impossible step, then made it possible.** GIMP is not installed on
this snapshot; only Inkscape, Evince, LibreOffice and Chrome are. Checked directly: `which gimp`
is empty and no launcher exists. The agent reported exactly that rather than claiming an export
it had not done. It then downloaded the official GIMP AppImage in Chrome, set the executable bit
through the file manager's properties dialog, and launched it, all without a shell. That route
was not in the task and not one I had considered.

**Dialogs did not stop it.** It handled Calc's Tip of the Day, the chart wizard, and the
multi-tab PDF export dialog with its file chooser.

## Cost

18 minutes of `desktop-4` is $0.0744 at provider cost, $0.0818 at the lane's quoted price.

## Caveat

One run, one task, stopped early by hand. It says the model can hold a long GUI chain together
and re-plan around a missing tool; it does not say anything about reliability across repeats.
Nothing here changes the demo agent choice, which is a separate question about cost per run.
