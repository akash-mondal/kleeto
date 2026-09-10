/**
 * Watch a Codex run on the VM: what it called, what it said, and what the meter is doing.
 * Pulls the JSONL over SSH rather than parsing it there, so the summary logic lives in one
 * place and can be improved without redeploying anything.
 */
import { execFileSync } from "node:child_process";
const name = process.argv[2] ?? "engineering";
const KEY = `${process.env.HOME}/.ssh/kleeto_azure_ed25519`;
const ssh = (cmd) => {
  try { return execFileSync("ssh", ["-i", KEY, "-o", "BatchMode=yes", "kleeto@20.10.136.97", cmd],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); } catch (e) { return e.stdout ?? ""; }
};
const raw = ssh(`sudo cat /home/codex/run-${name}.jsonl 2>/dev/null`);
const lines = raw.split("\n").filter((l) => l.trim().startsWith("{"));
const calls = [];
let last = null, live = null, tx = null, done = false;
for (const l of lines) {
  let e; try { e = JSON.parse(l); } catch { continue; }
  const it = e.item;
  if (e.type === "item.completed" && it?.type === "mcp_tool_call") {
    const a = it.arguments ?? {};
    calls.push(`${it.tool.replace("kleeto_", "")}${a.action ? ":" + a.action : ""}`);
  }
  if (e.type === "item.completed" && it?.type === "agent_message") {
    last = it.text;
    const m = /https:\/\/[^\s"]*\/live\/[A-Za-z0-9_-]+/.exec(it.text); if (m) live = m[0];
    const t = /0\.0\.\d+@\d+\.\d+/.exec(it.text); if (t) tx = t[0];
  }
  if (e.type === "turn.completed" || e.type === "thread.completed") done = true;
}
const counts = calls.reduce((m, c) => ({ ...m, [c]: (m[c] ?? 0) + 1 }), {});
console.log(`${calls.length} tool calls${done ? "  ·  RUN FINISHED" : "  ·  running"}`);
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ") || "(none yet)");
if (live) console.log(`\nlive: ${live}`);
if (tx) console.log(`settlement: ${tx}`);
if (last) console.log(`\nlatest message:\n  ${last.replace(/\n/g, "\n  ").slice(0, 1200)}`);
const err = ssh(`sudo tail -3 /home/codex/run-${name}.err 2>/dev/null`);
if (err.trim()) console.log(`\nstderr: ${err.trim().slice(0, 300)}`);
