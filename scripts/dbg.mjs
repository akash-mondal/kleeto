import { SolariAdapter } from "../src/adapters/solari.mjs";
import { requireLane } from "../src/lanes.mjs";
process.on("unhandledRejection", () => {});
const a = new SolariAdapter({ apiKey: process.env.SOLARI_API_KEY });
for (const s of await a.running()) await a.sandboxes.kill(s.sandboxId).catch(()=>{});
const lease = await a.provision({ id:"desktop-4", ...requireLane("desktop-4") }, { timeoutMs: 900_000 });
try {
  console.log("-- sources --");
  console.log((await lease.run("sh",["-c","grep -h '^deb ' /etc/apt/sources.list /etc/apt/sources.list.d/* 2>/dev/null | head -6"])).stdout);
  console.log("-- update --");
  const u = await lease.run("sh",["-c","DEBIAN_FRONTEND=noninteractive apt-get update 2>&1 | tail -3"]);
  console.log(u.stdout, u.stderr);
  console.log("-- candidates --");
  const c = await lease.run("sh",["-c","for p in blender kicad freecad gimp inkscape kdenlive audacity; do printf '%-10s %s\\n' $p \"$(apt-cache policy $p 2>/dev/null | sed -n 's/  Candidate: //p' || echo none)\"; done"]);
  console.log(c.stdout, c.stderr);
} finally { const {seconds} = await lease.terminate(); console.log("held", seconds+"s"); }
