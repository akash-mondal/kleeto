import { SolariAdapter } from "/Users/akshmnd/Dev Projects/hedera-x402sandbox/src/adapters/solari.mjs";
import { requireLane } from "/Users/akshmnd/Dev Projects/hedera-x402sandbox/src/lanes.mjs";
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(() => {});
const lease = await a.provision({ id: "desktop-2", ...requireLane("desktop-2") },
  { timeoutMs: 900_000, template: "workstation", metadata: { kleeto: "app-audit" } });
try {
  await lease.runLong("apt-get update -qq 2>&1 | tail -1", { pollMs: 5000 }).catch(() => {});
  const pkgs = ["davinci-resolve","kicad","qgis","dbeaver-ce","freecad","blender","scribus",
    "darktable","krita","ardour","natron","wireshark","remmina","thunderbird","gnucash",
    "kdenlive","openscad","libreoffice","inkscape","gimp","audacity","obs-studio","musescore3",
    "librecad","fritzing","rstudio","meld","calibre","handbrake","shotcut"];
  const out = await lease.runLong(
    `for p in ${pkgs.join(" ")}; do v=$(apt-cache policy $p 2>/dev/null | grep Candidate | awk '{print $2}'); ` +
    `sz=$(apt-get install -s $p 2>/dev/null | grep -oE 'After this operation, [0-9.]+ [MGk]B' | grep -oE '[0-9.]+ [MGk]B' | head -1); ` +
    `echo "$p|\${v:-NONE}|\${sz:-?}"; done`, { pollMs: 8000, timeoutMs: 900_000 });
  console.log(out);
} finally { await lease.terminate().catch(() => {}); }
