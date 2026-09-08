/**
 * Checks what the agent actually produced, through its own MCP server rather than the
 * holder's control channel, and against the source data fetched independently.
 *
 * The agent's report of its own success is not evidence. These are the artifacts.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const OUT = "agent-runs/astra";
mkdirSync(OUT, { recursive: true });
const id = readFileSync(`${OUT}/lease-id.txt`, "utf8").trim();

const mcp = spawn("npx", ["-y", "@solarisdk/mcp"], { env: process.env, stdio: ["pipe", "pipe", "ignore"] });
let buf = "";
const waiters = new Map();
mcp.stdout.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    try { const j = JSON.parse(line); if (j.id && waiters.has(j.id)) { waiters.get(j.id)(j); waiters.delete(j.id); } } catch {}
  }
});
let seq = 0;
const rpc = (method, params) => new Promise((res, rej) => {
  const rid = ++seq;
  waiters.set(rid, res);
  mcp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: rid, method, params }) + "\n");
  setTimeout(() => rej(new Error(`${method} timed out`)), 120_000);
});
await rpc("tools/call", { name: "solari_connect", arguments: { sessionId: id } });
const tool = async (name, args) => {
  const r = await rpc("tools/call", { name, arguments: { sessionId: id, ...args } });
  return r.result?.content?.map?.((c) => c.text ?? `[${c.type}]`).join("\n") ?? JSON.stringify(r.error ?? r.result);
};

await new Promise((r) => setTimeout(r, 4000));
await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "verify", version: "1" } });
mcp.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

console.log("== /work/out on the lease ==");
console.log(await tool("solari_exec", { command: "ls -la /work/out 2>&1 | tail -12" }));

console.log("\n== file types ==");
console.log(await tool("solari_exec", { command: "cd /work/out && for f in towers.pdf towers.png poster.svg; do [ -f $f ] && echo \"$f: $(file -b $f | cut -c1-60) $(stat -c%s $f) bytes\" || echo \"$f: MISSING\"; done" }));

console.log("\n== what the PDF says ==");
console.log(await tool("solari_exec", { command: "which pdftotext >/dev/null 2>&1 || (apt-get install -y -qq poppler-utils >/dev/null 2>&1); pdftotext /work/out/towers.pdf - 2>/dev/null | tr -s '\\n' '\\n' | head -20" }));

console.log("\n== chart image embedded in the PDF? ==");
console.log(await tool("solari_exec", { command: "pdfimages -list /work/out/towers.pdf 2>&1 | head -6" }));

console.log("\n== poster.svg ==");
console.log(await tool("solari_exec", { command: "grep -o 'Kleeto[^<]*' /work/out/poster.svg 2>/dev/null | head -3; grep -c 'image' /work/out/poster.svg 2>/dev/null" }));

console.log("\n== the PNG ==");
console.log(await tool("solari_exec", { command: "python3 -c \"from PIL import Image; im=Image.open('/work/out/towers.png'); print(im.size, im.mode); ex=im.convert('L').getextrema(); print('brightness range', ex)\" 2>&1 | head -4" }));

mcp.kill();
process.exit(0);
