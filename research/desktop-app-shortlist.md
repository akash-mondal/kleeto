# What to put on the desktop images

One tool per job. Versions read off the live package index on a running lease
(`scripts/app-audit.mjs`), so this is what will actually install.

The filter: **the app has no usable API**, the work is genuinely visual, and it ends in an
artifact somebody can check. Anything an agent could drive through a REST call is a bad demo
for Kleeto, because it argues against the product.

## Already on the base image

LibreOffice, GIMP, Inkscape, Chrome. Between them they own four jobs already: office documents,
bitmap editing, vector illustration, and the web. Nothing below duplicates them.

## The twelve to add

| Job | Tool | Version | How an agent works in it |
|---|---|---|---|
| 3D | **Blender** | 3.0.1 | Models or imports a scene, positions the camera and lights, renders to PNG. The most legible "look what it did" shot there is. |
| Electronics | **KiCad** | 6.0.2 | Opens a schematic, places components, routes copper, runs DRC until it passes, exports Gerbers a fab house accepts. |
| Mechanical CAD | **FreeCAD** | 0.19.2 | Builds a parametric part from a dimensioned brief, checks the sketch is fully constrained, exports STEP for manufacture or STL for a printer. |
| Geospatial | **QGIS** | 3.22.4 | Loads shapefiles and rasters, runs a spatial join or buffer analysis, styles the layers, exports a georeferenced map PDF. |
| Photography | **darktable** | 3.8.1 | Develops RAW files non-destructively, applies one exposure and colour pipeline across a batch, exports finished JPEGs. |
| Print layout | **Scribus** | 1.5.8 | Lays out a multi-page document on a master grid and exports print-ready PDF/X. The InDesign job, which nothing automates. |
| Video | **Kdenlive** | 21.12.3 | Cuts a timeline, adds titles and transitions, renders a finished MP4 from raw footage. |
| Databases | **DBeaver** | .deb | Connects to any engine, explores an unfamiliar schema visually, runs and tunes queries, exports results. |
| Remote machines | **Remmina** | 1.4.25 | Opens RDP or VNC into a customer's own Windows or Linux box, so a rented desktop becomes how an agent reaches a machine it could never be installed on. |
| Network forensics | **Wireshark** | 3.6.2 | Opens a capture, filters to the failing conversation, follows the stream, exports the evidence for an incident write-up. |
| Bookkeeping | **GnuCash** | 4.8 | Imports statements, reconciles them against the ledger, fixes mismatches, exports the reports. |
| Mail and calendar | **Thunderbird** | 140.7.1 | Works a real inbox and calendar through the client rather than an API, which is how mail behaves inside a company. |

Sixteen tools across sixteen jobs, no two doing the same thing.

## What was cut, and why

| Cut | Because |
|---|---|
| Krita | GIMP already owns bitmap. Krita is the better painting tool, so swap it *for* GIMP on a creative image rather than shipping both. |
| OpenSCAD | FreeCAD already owns CAD. It also undermines the thesis: an agent writing a model as code is just coding, not computer use. |
| Fritzing | KiCad already owns PCB, and does it professionally. |
| OBS Studio | Kdenlive owns video, and a stream leaves no artifact to check. |
| Ardour, Audacity | Audio is a weak demo for a product whose whole pitch is watching a screen. |
| MuseScore | Narrow. Only worth it if music publishing is a target vertical. |
| Meld | Developer-only and narrow; the diff is a step inside a job, not a job. |
| LibreCAD, Calibre, HandBrake, Shotcut | Each duplicates something already on the list. |

## Three images, not one

A lane that boots in 1.3 seconds is the product, and one bloated image is what breaks it. The
agent picks an image at lease time the same way it picks a lane.

| Image | Adds | Owns |
|---|---|---|
| `desktop-studio` | Blender, darktable, Scribus, Kdenlive | 3D, photography, print, video |
| `desktop-engineering` | KiCad, FreeCAD, QGIS | electronics, CAD, geospatial |
| `desktop-office` | DBeaver, Thunderbird, GnuCash, Remmina, Wireshark | data, mail, books, remote access, network |

## Two constraints worth knowing

**DaVinci Resolve is not available and cannot easily be.** Not in any apt repository, installs
from a proprietary `.run` with a licence step, and wants a GPU these lanes do not have.
Kdenlive is the honest substitute; Resolve is a "later, on a GPU lane" item.

**The base is Ubuntu 22.04**, so these are 2022-era builds. Blender 3.0 against today's 4.x is
the widest gap. Anything that depends on a recent feature wants a Flatpak or AppImage in the
image build rather than apt. DBeaver is the one pick that needs a downloaded `.deb` either way.
