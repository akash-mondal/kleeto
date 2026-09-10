/**
 * Proves the live view is Kleeto's: real machine, real frames, and nothing on the page or the
 * wire that names the supplier.
 */
import { provision, publicView, leaksVendor } from "../src/gateway/vendors.mjs";
import { Store, newId } from "../src/gateway/store.mjs";
import { viewerPage, attachLiveSocket } from "../src/gateway/live.mjs";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { WebSocket } from "ws";

const LANE = process.argv[2] ?? "browser-fast";
const ORIGIN = "http://127.0.0.1:8899";
const store = new Store({ path: "var/live-test.json" });

console.log(`provisioning ${LANE}…`);
const up = await provision(LANE, { seconds: 300 });
const lease = store.put({
  id: newId("ls"), lane: LANE, kind: up.kind, state: "open", network: "hedera:testnet",
  secondsPurchased: 300, startedAt: new Date().toISOString(),
  viewToken: randomBytes(18).toString("base64url"),
  vendor: up.vendor, vendorId: up.vendorId, upstream: up.upstream,
});
console.log(`up. upstream (server-side only): ${JSON.stringify(up.upstream).slice(0, 90)}…`);

const app = new Hono();
app.get("/live/:t", (c) => {
  const l = store.byViewToken(c.req.param("t"));
  return c.html(viewerPage({ lease: l, wsPath: `ws://127.0.0.1:8899/live/${l.viewToken}/socket`, origin: ORIGIN }));
});
const server = serve({ fetch: app.fetch, port: 8899 });
attachLiveSocket(server, { store, resolveUpstream: (l) => l.upstream });

const url = `${ORIGIN}/live/${lease.viewToken}`;
console.log(`viewer: ${url}`);

// 1. the page a person loads
const html = await fetch(url).then((r) => r.text());
const pageLeak = leaksVendor(html);
console.log(`\npage  ${html.length} bytes · vendor names on it: ${pageLeak.length ? pageLeak : "none"}`);
console.log(`      hostnames referenced: ${[...new Set(html.match(/https?:\/\/[a-z0-9.-]+/gi) ?? [])].join(", ") || "none"}`);

// 2. the API shape a client is handed
const pub = publicView(lease, { origin: ORIGIN });
console.log(`\nAPI   ${JSON.stringify(pub).slice(0, 150)}…`);
console.log(`      vendor names in it: ${leaksVendor(pub).length ? leaksVendor(pub) : "none"}`);

// 3. do pixels actually arrive over our socket
await new Promise((resolve) => {
  const ws = new WebSocket(`ws://127.0.0.1:8899/live/${lease.viewToken}/socket`);
  let frames = 0, bytes = 0, control = [];
  const done = () => { ws.close(); resolve(); };
  ws.on("message", (d) => {
    const s = d.toString();
    if (s.startsWith("{")) { control.push(s.slice(0, 60)); return; }
    frames++; bytes += s.length;
    if (frames >= 3) {
      console.log(`\nsocket ${frames} frames, ${(bytes / 1024).toFixed(0)} KB of jpeg over our host`);
      console.log(`      control: ${control.join(" ")}`);
      done();
    }
  });
  ws.on("error", (e) => { console.log("\nsocket error:", e.message.slice(0, 80)); done(); });
  setTimeout(() => { console.log(`\nsocket ${frames} frames after 25s; control: ${control.join(" ")}`); done(); }, 25000);
});

const { terminate } = await import("../src/gateway/vendors.mjs");
await terminate(lease);
console.log("\nmachine released.");
process.exit(0);
