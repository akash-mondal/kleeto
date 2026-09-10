# What to put on the desktop images

Every version below was read off the live package index on a running lease
(`scripts/app-audit.mjs`), so this is what will actually install, not what ought to.

The filter I applied: **the app has no usable API**, the work is genuinely visual, and it ends
in an artifact somebody can check. Anything an agent could drive through a REST call is a bad
demo for Kleeto, because it argues against the product.

## The twenty

### Engineering — the strongest case, because the output is manufacturable

| App | Version | How an agent works in it |
|---|---|---|
| **KiCad** | 6.0.2 | Opens a schematic, places components, routes copper, runs DRC until it passes, and exports Gerbers a fab house can accept. |
| **FreeCAD** | 0.19.2 | Builds a parametric part from a dimensioned brief, checks the sketch is fully constrained, and exports STEP for manufacture or STL for a printer. |
| **QGIS** | 3.22.4 | Loads shapefiles and rasters, runs a spatial join or buffer analysis, styles the layers, and exports a georeferenced map as PDF. |
| **OpenSCAD** | 2021.01 | Writes the model as code, renders it, and exports STL, which makes it the one CAD lane where the agent's reasoning is directly readable. |
| **Fritzing** | 0.9.6 | Lays out a breadboard from a parts list, generates the schematic view, and exports the PCB, gentler than KiCad for a first hardware demo. |

### Creative — the highest visual impact

| App | Version | How an agent works in it |
|---|---|---|
| **Blender** | 3.0.1 | Models or imports a scene, positions the camera and lights, renders to PNG, and is the single most legible "look what it did" shot on a screen. |
| **Krita** | 5.0.2 | Paints and composites on layers with real brush dynamics, which is illustration work no image API performs. |
| **darktable** | 3.8.1 | Develops RAW files non-destructively, applies an exposure and colour pipeline across a batch, and exports finished JPEGs. |
| **Kdenlive** | 21.12.3 | Cuts a timeline, adds titles and transitions, and renders a finished MP4 from raw footage. |
| **Scribus** | 1.5.8 | Lays out a multi-page document on a master grid and exports print-ready PDF/X, which is the job InDesign does and nothing automates. |
| **Ardour** | 6.9.0 | Arranges multitrack audio, sets levels and plugins across a mix, and bounces stems or a master. |
| **MuseScore** | 3.2.3 | Enters or edits notation, transposes parts, and exports both a printed score and audio from the same file. |
| **OBS Studio** | 27.2.3 | Composes scenes from sources, switches between them, and records or streams, an agent operating a broadcast desk. |

### Enterprise operations — the least glamorous and the most sellable

| App | Version | How an agent works in it |
|---|---|---|
| **DBeaver** | .deb only | Connects to any engine, explores an unfamiliar schema visually, runs and tunes queries, and exports results, the database work that lives in a GUI. |
| **Wireshark** | 3.6.2 | Opens a capture, filters to the failing conversation, follows the stream, and exports the evidence for an incident write-up. |
| **Remmina** | 1.4.25 | Opens RDP or VNC into a customer's own Windows or Linux box, so a rented desktop becomes the way an agent reaches a machine it could never be installed on. |
| **GnuCash** | 4.8 | Imports statements, reconciles them against the ledger, fixes the mismatches, and exports the reports a bookkeeper would. |
| **Thunderbird** | 140.7.1 | Works a real inbox and calendar through the client rather than an API, which is how mail actually behaves inside a company. |
| **Meld** | 3.20.4 | Diffs and merges files or directories three ways, resolving conflicts visually. |
| **LibreOffice** | 7.3.7 | Sheets, documents, slides and charts, the baseline every office workflow lands on. |

## What I would pick, and why

**The ten**, if it is one image: KiCad, FreeCAD, QGIS, Blender, Krita, darktable, Kdenlive,
Scribus, DBeaver, Remmina. LibreOffice, GIMP and Inkscape are already on the base.

That set covers hardware, geospatial, 3D, illustration, photography, video, print and
databases, plus a door into someone else's machine. Every one of them is a tool a professional
is paid to operate, and not one has an API that would make an agent's clicking redundant.

**But I would build three images rather than one**, because a lane that boots in 1.3 seconds is
the product and a bloated image is the thing that breaks it:

| Image | Contents | For |
|---|---|---|
| `desktop-studio` | Blender, Krita, darktable, Kdenlive, Scribus, Ardour, GIMP, Inkscape | creative and media work |
| `desktop-engineering` | KiCad, FreeCAD, QGIS, OpenSCAD, Fritzing | hardware, CAD, geospatial |
| `desktop-office` | DBeaver, Thunderbird, GnuCash, Remmina, Wireshark, Meld, LibreOffice | enterprise operations |

The agent picks the image at lease time, the same way it picks a lane, and each stays small
enough to fork from a snapshot in about a second.

## Two things worth knowing before you choose

**DaVinci Resolve is not on this list and cannot easily be.** It is not in any apt repository,
it installs from a proprietary `.run` that expects a licence step, and it wants a GPU these
lanes do not have. Kdenlive is the honest substitute for a video demo; Resolve is a "later, on
a GPU lane" item rather than an image decision.

**DBeaver needs a downloaded `.deb`** rather than apt, which is fine in an image build but is
one extra step, and it is the only pick on the list with that caveat. It earns it: it is the
most enterprise-legible app of the twenty.

**The Ubuntu base is 22.04**, so these are 2022-era versions. Blender 3.0 against today's 4.x
is the widest gap. If a demo depends on a recent feature, that app wants a Flatpak or an
AppImage in the image build rather than apt.
