/**
 * The desktop images an agent can choose between.
 *
 * A lane is how much machine; an image is what is on it. They are separate because the price
 * depends only on the first: a desktop with QGIS on it costs exactly what a bare desktop costs,
 * since the disk is already paid for.
 *
 * One tool per job across all three. Nothing here duplicates anything on the base, which
 * already carries LibreOffice, GIMP, Inkscape and Chrome.
 */
import { existsSync, readFileSync } from "node:fs";

/** What each image is for, and what an agent can reach on it. */
export const IMAGES = {
  base: {
    label: "Base desktop",
    owns: "office documents, bitmap editing, vector illustration, the web",
    apps: ["LibreOffice", "GIMP", "Inkscape", "Chrome"],
  },
  studio: {
    label: "Studio",
    owns: "3D, photography, print, video",
    apps: ["Blender", "darktable", "Scribus", "Kdenlive"],
  },
  engineering: {
    label: "Engineering",
    owns: "electronics, CAD, geospatial",
    apps: ["KiCad", "FreeCAD", "QGIS"],
  },
  office: {
    label: "Office operations",
    owns: "databases, mail, bookkeeping, remote access, network forensics",
    apps: ["DBeaver", "Thunderbird", "GnuCash", "Remmina", "Wireshark"],
  },
};

/**
 * Snapshot ids are written by `scripts/build-images.mjs` rather than committed: they are
 * account-scoped and rebuilding an image changes them, so a constant here would go stale
 * silently and boot the wrong disk.
 */
export function resolveImage(name) {
  if (!name || name === "base") return null;      // null means the stock template
  const key = String(name).toLowerCase();
  const image = IMAGES[key];
  if (!image) {
    throw new Error(`unknown image ${name}; expected one of ${Object.keys(IMAGES).join(", ")}`);
  }
  const built = existsSync("var/images.json") ? JSON.parse(readFileSync("var/images.json", "utf8")) : {};
  const record = built[`kleeto-desktop-${key}`];
  if (!record?.snapshotId) {
    throw new Error(`image ${name} is described but not built yet; run scripts/build-images.mjs`);
  }
  return record.snapshotId;
}

/** The menu, with whether each one is actually bootable right now. */
export function imageCatalogue() {
  const built = existsSync("var/images.json") ? JSON.parse(readFileSync("var/images.json", "utf8")) : {};
  return Object.entries(IMAGES).map(([name, i]) => ({
    image: name, label: i.label, owns: i.owns, apps: i.apps,
    ready: name === "base" || Boolean(built[`kleeto-desktop-${name}`]?.snapshotId),
  }));
}
