# One workflow per heavy desktop app
Verified installable on the desktop lane (Ubuntu 22.04 jammy, universe enabled):
`blender 3.0.1` · `kicad 6.0.2` · `freecad 0.19.2` · `gimp 2.10.30` · `inkscape 1.1.2`
`kdenlive 21.12.3` · `audacity 2.4.2` · LibreOffice (in the base `office` template).

## The move that makes these work
Every one of these apps has **both** a GUI and a scripting interface:

| App | Headless / scripting path |
|---|---|
| Blender | `blender -b --python scene.py` (verified working) |
| KiCad | `pcbnew` Python module |
| FreeCAD | `freecadcmd` with Python |
| GIMP | `gimp -i -b` Script-Fu batch |
| Inkscape | `inkscape --actions=` CLI |
| Kdenlive | `melt` / ffmpeg render pipeline |
| Audacity | ffmpeg/sox for the bulk work |

So the agent **chooses per step**: drive the GUI when the work is visual and needs judgement,
drop to the script when it is bulk and repetitive. That choice is visible on the live view — and
it is exactly what a skilled human does. It is also the honest answer to "can an agent really
use Blender": it uses the GUI to decide and the API to execute.

Every workflow below is browser -> machine -> desktop, 4-8 settlements, ending in a file a human
would actually accept.

---

## 1. Blender — product shot from a listing
*"We're selling this part. I need a turntable render for the store page."*
1. `[$]` **browser** — open the supplier listing; pull dimensions, material, and the reference photos
2. **browser** — the spec table is an image, not markup -> read it visually, screenshot it
3. `[$]` **machine** — reconcile the stated dimensions against the photo's aspect ratio; flag the mismatch; prep reference planes
4. `[$]` **desktop** — Blender: block out the part to the real dimensions, GUI for camera and lighting judgement, then `blender -b --python` to render the 36-frame turntable
5. **desktop** — composite the frames to mp4; export `.blend` + stills
6. Artifacts hashed: `.blend`, turntable mp4, each still. **The receipt proves the render matches the listing it came from.**

## 2. KiCad — from a parts list to a routed board
*"Here's the schematic. Get me something manufacturable."*
1. `[$]` **browser** — distributor sites: stock, unit price at qty, lifecycle status for each part
2. **browser** — two parts are NRND -> find pin-compatible alternates, capture the datasheet pages
3. `[$]` **machine** — build the BOM, compute board cost at 100/1k units, pick alternates on price × availability
4. `[$]` **desktop** — KiCad: assign footprints, place, route via `pcbnew` scripting, DRC in the GUI where the judgement is
5. **desktop** — export gerbers + drill + BOM CSV
6. `[$]` **machine** — serve the gerber preview on a **preview URL** for review
7. Artifacts hashed: gerbers, BOM, DRC report. **Astra's headline demo — on rented hardware, with the parts sourcing that makes it real.**

## 3. FreeCAD — a part that has to fit something real
*"Make a bracket that mounts this enclosure to a DIN rail."*
1. `[$]` **browser** — manufacturer's drawing PDF for the enclosure; DIN rail standard dimensions
2. `[$]` **machine** — extract dimensions from the PDF; compute clearances and tolerance stack
3. `[$]` **desktop** — FreeCAD: parametric model driven from those numbers via `freecadcmd`; GUI to sanity-check the fit visually
4. **desktop** — export STL + a dimensioned PDF drawing
5. `[$]` **machine** — mesh check: manifold, wall thickness above the printer's minimum
6. Artifacts hashed: STL, STEP, drawing PDF. **An STL you can send to a printer is the definition of a falsifiable artifact.**

## 4. Inkscape + GIMP — one master into every ad size
*"Here's the hero image. I need the full placement matrix by Friday."*
1. `[$]` **browser** — pull each platform's current spec page: exact pixel sizes, safe areas, text limits
2. **browser** — specs changed since our last run -> diff against the stored set
3. `[$]` **machine** — compute the crop geometry per size; decide which need re-composition rather than a crop
4. `[$]` **desktop** — Inkscape: rebuild the logo lockup as vector at each aspect ratio; GIMP Script-Fu to batch the raster exports
5. **desktop** — contact sheet of all sizes for approval
6. Artifacts hashed: every export + the contact sheet. **The receipt records which spec version each asset was built against.**

## 5. Kdenlive — raw footage to a cut
*"Turn last week's sessions into a 60-second highlight."*
1. `[$]` **browser** — collect the source recordings and their metadata
2. `[$]` **machine** — transcribe; find the moments; **reasoning:** score segments for a 60s cut that still makes sense out of context
3. `[$]` **desktop** — Kdenlive: assemble the timeline, titles and transitions; GUI for pacing judgement
4. **desktop** — `melt` renders the final mp4 headlessly
5. `[$]` **machine** — generate captions; serve the cut on a **preview URL**
6. Artifacts hashed: project file, mp4, caption file, transcript.

## 6. Audacity — a clean interview
*"Clean this up and cut the dead air."*
1. `[$]` **browser** — fetch the raw recording and the episode notes
2. `[$]` **machine** — transcribe with timestamps; detect silence, filler and crosstalk
3. `[$]` **desktop** — Audacity: noise profile and de-noise on the GUI where it needs an ear; ffmpeg for the cuts
4. **desktop** — normalise to broadcast loudness; export
5. `[$]` **machine** — verify LUFS; produce the shownotes in LibreOffice
6. Artifacts hashed: master audio, transcript, shownotes PDF.

---

## Ranking for the video
1. **KiCad (#2)** — mirrors Astra's own headline demo but adds the sourcing they skipped, and ends in gerbers a fab would accept.
2. **FreeCAD (#3)** — the STL is the most falsifiable artifact of the set; "it has to fit a real thing" is legible instantly.
3. **Blender (#1)** — the most visually spectacular; already proven headless on our lane.
4. **Inkscape/GIMP (#4)** — the most relatable, and the one with an obvious buyer.
5. Kdenlive / Audacity — strong but slow to film.

## Honest constraints
- These are heavy apps on 4 vCPU / 8 GB. Blender EEVEE at 640×480 is fine; Cycles at 4K is not.
- First install costs minutes -> **snapshot the app once, fork per run.** That makes "warm state
  as a product" load-bearing rather than decorative.
- GUI automation of pro software is the least reliable part. Script the bulk, drive the GUI for
  the moments that need judgement, and say so plainly rather than pretending it is all vision.
