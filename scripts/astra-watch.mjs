/**
 * Progress on the astra run, read straight out of the Codex event log: what it called, and
 * the frames it was looking at when it called them. No second connection to the lease, which
 * would fight the holder process for the control channel.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const OUT = "agent-runs/astra";
mkdirSync(OUT, { recursive: true });

const lines = readFileSync("/tmp/astra-run.jsonl", "utf8").split("\n");
const calls = [];
const shots = [];
let message = null;
let errors = [];
for (const l of lines) {
  if (!l.trim()) continue;
  let e; try { e = JSON.parse(l); } catch { continue; }
  const it = e.item;
  if (e.type !== "item.completed" || !it) continue;
  if (it.type === "agent_message") message = it.text;
  if (it.type === "error") errors.push(it.message);
  if (it.type !== "mcp_tool_call") continue;
  const arg = it.arguments ?? {};
  const detail = it.tool === "solari_click" ? `${arg.x},${arg.y}${arg.button && arg.button !== "left" ? " " + arg.button : ""}`
    : it.tool === "solari_type" ? JSON.stringify(String(arg.text ?? "").slice(0, 46))
    : it.tool === "solari_key" ? String(arg.key ?? arg.keys ?? "")
    : it.tool === "solari_open_app" ? `${arg.app ?? arg.name ?? ""} ${(arg.args ?? []).join(" ")}`.trim()
    : it.tool === "solari_list_files" ? String(arg.path ?? "")
    : "";
  calls.push({ tool: it.tool.replace("solari_", ""), detail, ok: it.status !== "failed" });
  const img = it.result?.content?.find?.((c) => c.type === "image");
  if (img) shots.push(img.data);
}

const keep = Number(process.argv[2] ?? 3);
shots.slice(-keep).forEach((b64, i) => {
  const n = shots.length - keep + i + 1;
  writeFileSync(`${OUT}/frame-${String(n).padStart(3, "0")}.png`, Buffer.from(b64, "base64"));
});

const counts = calls.reduce((m, c) => ({ ...m, [c.tool]: (m[c.tool] ?? 0) + 1 }), {});
console.log(`${calls.length} tool calls  |  ${shots.length} screenshots  |  ${calls.filter((c) => !c.ok).length} failed`);
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "));
console.log("\nlast 16 actions:");
for (const c of calls.slice(-16)) console.log(`  ${c.ok ? " " : "!"} ${c.tool.padEnd(12)} ${c.detail}`);
if (errors.length) console.log("\nerrors:", errors.slice(-2).map((e) => e.slice(0, 120)));
if (message) console.log("\nagent says:\n  " + message.replace(/\n/g, "\n  ").slice(0, 900));
console.log(`\nlatest frame: ${OUT}/frame-${String(shots.length).padStart(3, "0")}.png`);
