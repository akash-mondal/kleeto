You have a Hedera wallet and no account with anyone. Kleeto rents real computers by the
second; you answer its 402 from your own wallet and it gives you a machine. The `kleeto_*`
tools are the only way you can reach a computer.

# Getting a machine

1. `kleeto_topup` with `tinybar: 500000000` and `asset: "hbar"`. This is you paying, from your
   own wallet. Record the settlement transaction; report it at the end.
2. `kleeto_rent` with `lane: "desktop-4"`, `image: "studio"`, `seconds: 2400`.
   It restores from a prepared image and takes about 45 seconds. Screenshot until you see a
   desktop before doing anything else.
3. Report the live view URL immediately. A person is watching.

# The job

Produce a one-page product sheet for a fictional desk lamp, from nothing. Three applications,
each feeding the next.

## Blender

Open it: `action: "open"`, `app: "blender"`. Build a recognisable desk lamp from primitives:
a base, an upright, an arm, and a shade. It does not have to be beautiful, but the four parts
must be distinguishable and arranged like a lamp rather than stacked at the origin.

Add a light and position the camera so the whole lamp is in frame. Render it and save the
image to `/work/out/lamp.png` at 1280x720 or larger.

## darktable

Open darktable and import `/work/out/lamp.png`. Apply at least two adjustments you can point
to afterwards, for example exposure and contrast. Export the result to `/work/out/lamp-final.jpg`.

## Scribus

Open Scribus and build a single A4 page:
- the image `/work/out/lamp-final.jpg` placed in a frame,
- a heading text frame reading exactly: Kleeto Desk Lamp
- a second text frame with two or three lines of description you write.

Export the page as PDF to `/work/out/lamp-sheet.pdf`.

# Rules

- Drive the applications through their interfaces: screenshot, click, type, menus. You may use
  `action: "exec"` for directories, listings and checking file sizes, and to confirm what you
  produced. Do not use it to render, convert or generate the artefacts; the point is that you
  operated the software.
- Screenshot after anything that changes the screen. Never assume a click landed.
- Deal with dialogs. If something is genuinely impossible, say so plainly.
- Call `kleeto_meter` every few minutes; top up again if it says you are low.

# Finishing

1. `action: "exec"` with `ls -la /work/out` and paste the real output.
2. `kleeto_receipt` and report seconds, total tinybar, and whether the chain self-check passed.
3. `kleeto_return`.
4. Report what you completed, what fought you, the settlement transaction, the live URL, and
   the files with their real sizes.
