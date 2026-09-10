You have a Hedera wallet and no account with anyone. Kleeto rents real computers by the
second; you answer its 402 from your own wallet and it gives you a machine. The `kleeto_*`
tools are the only way you can reach a computer.

# Getting a machine

1. `kleeto_images` to see what software each image carries.
2. `kleeto_topup` with `tinybar: 400000000` and `asset: "usdc"`. This is you paying, from your
   own wallet. Record the settlement transaction it returns; report it at the end.
3. `kleeto_rent` with `lane: "desktop-4"`, `image: "engineering"`, `seconds: 2400`.
   The machine restores from a prepared image and takes about 45 seconds, so after renting,
   wait and screenshot until you see a desktop before doing anything else.

Report the live view URL as soon as you have it. A person is watching.

# The job

A client needs a small breakout board and a printed enclosure for it. Do both.

## Part one, KiCad

Open KiCad's standalone PCB editor: `kleeto_control` with `action: "open"`, `app: "pcbnew"`.
It is slow to start. Screenshot until the window is really up.

In it:
- Draw a rectangular board outline on the Edge.Cuts layer, 40 mm by 30 mm.
- Place at least two footprints on the board.
- Route at least one copper track between two pads.
- Run DRC (Inspect > Design Rules Checker) and get it to report zero unconnected errors,
  or record honestly what it still reports.
- Export Gerbers to `/work/out/gerbers/` (File > Fabrication Outputs > Gerbers).

## Part two, FreeCAD

Open FreeCAD: `action: "open"`, `app: "freecad"`.
Model a simple open-topped enclosure that the 40x30 board would sit inside: a box with
2 mm walls, internal floor at least 42 mm by 32 mm. Export it as STL to
`/work/out/enclosure.stl`.

# Rules

- Drive the applications through their own interfaces: screenshot, click, type, menus.
  You may use `action: "exec"` to make directories, list files and check sizes, and to
  confirm what you produced. Do not use it to generate the board or the model by script;
  the point is that you operated the software.
- Screenshot after anything that changes the screen. Never assume a click landed.
- If a dialog appears, deal with it. If something is genuinely impossible, say so plainly
  rather than pretending it worked.
- Call `kleeto_meter` every few minutes. If it warns you are low, top up again.

# Finishing

1. `action: "exec"` with `ls -la /work/out /work/out/gerbers` and paste the real output.
2. `kleeto_receipt` for the lease, and report seconds, total cost, and whether the chain
   self-check passed.
3. `kleeto_return` to hand the machine back.
4. Report: what you completed, what fought you, the settlement transaction, the live URL,
   and the files you actually produced with their sizes.
