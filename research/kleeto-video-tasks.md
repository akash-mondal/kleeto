# 30 tasks an agent can do on a Kleeto lease
Ideation for the 60-second hero film. Every task below is doable on the lanes we have
verified; the ★ marks the ones cut into the film.

## Browser — real Chrome on a CDP endpoint
1. ★ Search a live map for a landmark, take the first result and zoom into it.
2. ★ Pull a news front page through its public API, then screenshot the rendered page.
3. Fill a multi-field public form and submit it, reading the confirmation back.
4. Sign in to a demo app with credentials held outside the page, then navigate as that user.
5. Compare a price across three tabs and screenshot each one for the record.
6. Download a PDF from a site and open it in the desktop's viewer.
7. Walk a paginated table and write it out as CSV.
8. Re-visit a page on a schedule and diff today's screenshot against yesterday's.
9. Record a full session replay of a checkout flow on a demo store.
10. Use in-page search to find a code sample and copy it into a file on disk.

## Desktop — a full Xfce session the agent drives
11. ★ Open a scene in Blender, orbit the viewport, snap to camera and render it.
12. Change a material colour in Blender and re-render to compare.
13. ★ Open the scraped CSV in LibreOffice Calc, add a computed column and chart it.
14. Draft a memo in LibreOffice Writer and export it as PDF.
15. Edit text in an SVG with Inkscape and export a PNG at print size.
16. ★ Open the finished render in an image viewer and zoom in on it.
17. Tidy outputs in the file manager: new folder, move, rename.
18. ★ Hand the mouse to a person mid-task, let them click, then hand it back.
19. Page through a generated PDF in Evince to check it rendered.
20. Install a GUI application at runtime and use it in the same session.

## Machine — headless Linux with a shell and a REPL
21. ★ Render the same Blender scene headless and watch the sample log stream.
22. ★ Hash every file the machine produced and print the merkle root.
23. ★ Start a web server on the machine and open its public preview URL in the browser lane.
24. ★ Load the scraped CSV in a stateful Python REPL and plot it with matplotlib.
25. Install a toolchain with apt and build a binary from source.
26. Turn a folder of rendered frames into an mp4 with ffmpeg.
27. ★ Pause the lease mid-job, watch the meter stop, resume and carry on.
28. Snapshot the machine with everything installed, then fork copies of it.
29. Mount a volume, write results to it, and remount it on a different machine.
30. Clone a repository and run its test suite.

## The film's spine
A single job that needs all three: **research in the browser → compute on the machine →
make something on the desktop → publish it back through the browser → hand over the
receipt.** That is the order the beats are shot in.
