/**
 * Build the three desktop images, by snapshot rather than by template.
 *
 * The template builder returns a bare `exit 100` on every one of these package sets, while the
 * identical apt invocation finishes cleanly on a running lease with 13 GB to spare. Whatever
 * the builder's constraint is, it is not the packages and not the disk, so the images are made
 * the way that demonstrably works: install on a live machine, then snapshot it.
 *
 * A snapshot boots as fast as a template and forks the same way, so nothing downstream cares
 * which route produced it.
 */
import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
import { writeFileSync, existsSync, readFileSync } from "node:fs";

const IMAGES = {
  "kleeto-desktop-studio": {
    apt: ["blender", "darktable", "scribus", "kdenlive"],
    owns: "3D, photography, print, video",
    check: ["blender", "darktable", "scribus", "kdenlive"],
  },
  "kleeto-desktop-engineering": {
    apt: ["kicad", "freecad", "qgis", "qgis-plugin-grass"],
    owns: "electronics, CAD, geospatial",
    check: ["kicad", "freecad", "qgis"],
  },
  "kleeto-desktop-office": {
    apt: ["thunderbird", "gnucash", "remmina", "remmina-plugin-rdp", "remmina-plugin-vnc", "wireshark"],
    owns: "mail, books, remote access, network",
    // DBeaver is in no apt repository, so it comes from the vendor's own .deb
    post: ["curl -fsSL -o /tmp/dbeaver.deb https://dbeaver.io/files/dbeaver-ce_latest_amd64.deb " +
           "&& DEBIAN_FRONTEND=noninteractive apt-get install -y -qq /tmp/dbeaver.deb; rm -f /tmp/dbeaver.deb"],
    check: ["thunderbird", "gnucash", "remmina", "tshark", "dbeaver"],
  },
};

const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
const out = existsSync("var/images.json") ? JSON.parse(readFileSync("var/images.json", "utf8")) : {};
const t0 = Date.now();
const log = (...x) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s]`, ...x);

async function build(name, spec) {
  log(`${name}: booting`);
  const lease = await a.provision({ id: "desktop-2", ...requireLane("desktop-2"), diskGb: 20 },
    { timeoutMs: 3_600_000, template: "workstation", metadata: { kleeto: "image-build" } });
  try {
    await lease.runLong("apt-get update -qq 2>&1 | tail -1", { pollMs: 5000 });
    log(`${name}: installing ${spec.apt.length} packages`);
    await lease.runLong(
      `DEBIAN_FRONTEND=noninteractive apt-get install -y -qq -o Dpkg::Options::=--force-confold ${spec.apt.join(" ")} 2>&1 | tail -2`,
      { pollMs: 15000, timeoutMs: 3_000_000 });
    for (const cmd of spec.post ?? []) await lease.runLong(cmd, { pollMs: 15000, timeoutMs: 900_000 }).catch(() => {});

    // Verify before snapshotting. An image that is missing a tool is worse than no image,
    // because the failure surfaces on camera rather than here.
    const found = await lease.sh(
      `for b in ${spec.check.join(" ")}; do printf '%s=%s ' $b "$(command -v $b >/dev/null && echo ok || echo MISSING)"; done`);
    log(`${name}: ${found.trim()}`);
    if (/MISSING/.test(found)) throw new Error(`not all tools present: ${found.trim()}`);

    await lease.sh("apt-get clean; rm -rf /var/lib/apt/lists/*; sync");
    const disk = (await lease.sh("df -h / | tail -1 | awk '{print $3\" used, \"$4\" free\"}'")).trim();
    const snap = await lease.snapshot(name);
    const id = snap.snapshotId ?? snap.id ?? snap;
    out[name] = { snapshotId: String(id), owns: spec.owns, apt: spec.apt, disk, builtAt: new Date().toISOString() };
    log(`${name}: snapshot ${id}  (${disk})`);
  } catch (e) {
    log(`${name}: FAILED ${String(e.message).slice(0, 160)}`);
    out[name] = { failed: String(e.message).slice(0, 200) };
  } finally {
    await lease.terminate().catch(() => {});
    writeFileSync("var/images.json", JSON.stringify(out, null, 1));
  }
}

const only = process.argv[2];
const todo = Object.entries(IMAGES).filter(([n]) => !only || n.includes(only));
// two at a time: the plan allows two concurrent machines
for (let i = 0; i < todo.length; i += 2) {
  await Promise.all(todo.slice(i, i + 2).map(([n, s]) => build(n, s)));
}
console.log("\n" + JSON.stringify(out, null, 1));
