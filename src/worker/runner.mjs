/**
 * The worker that actually runs a job.
 *
 * It claims one job at a time from the gateway and spawns Codex against it. One at a time on
 * purpose: the queue decides how many may run, and a worker that claimed two would defeat the
 * limit it exists to enforce. Run several of these to raise throughput, up to the queue's
 * concurrency and no further, because the queue stops handing out work past that.
 */
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const GATEWAY = process.env.KLEETO_GATEWAY ?? "http://127.0.0.1:8787";
const TOKEN = process.env.WORKER_TOKEN ?? "";
const NAME = process.env.WORKER_NAME ?? `worker-${process.pid}`;
const RUNS = process.env.RUN_DIR ?? "/home/codex/runs";
const POLL_MS = Number(process.env.POLL_MS ?? 4000);
mkdirSync(RUNS, { recursive: true });

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), NAME, ...a);
const post = (path, body) =>
  fetch(GATEWAY + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(TOKEN ? { "x-worker-token": TOKEN } : {}) },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json()).catch(() => null);

/**
 * The instructions every job gets. The prompt a person typed is the task; this is the part
 * that tells the agent it has a wallet and how to spend it.
 */
const preamble = (job) => `You have a Hedera wallet and no account with anyone. Kleeto rents real
computers by the second: you answer its 402 from your own wallet and it gives you a machine.
The kleeto_* tools are the only way you can reach a computer.

Do this:
1. kleeto_topup with tinybar 400000000 and asset "usdc". This is you paying, from your wallet.
2. kleeto_rent a machine that suits the job.${job.image ? ` Use image "${job.image}".` : ""}${job.lane ? ` Use lane "${job.lane}".` : ""}
   A desktop restores from a prepared image in about 45 seconds; screenshot until you see one.
3. Report the live view URL as soon as you have it. Someone is watching.
4. Do the work below, driving the applications through their own interfaces. Screenshot after
   anything that changes the screen; never assume a click landed.
5. When you are done: kleeto_receipt, then kleeto_return, then report what you produced, what
   fought you, and the settlement transaction.

If something is genuinely impossible, say so plainly rather than pretending it worked.

The task:

${job.prompt}
`;

/** Pull the live URL, lease and settlement out of the stream as they appear. */
function glean(line) {
  let e; try { e = JSON.parse(line); } catch { return null; }
  const it = e.item;
  if (e.type !== "item.completed" || it?.type !== "agent_message") return null;
  const out = {};
  const live = /https?:\/\/[^\s")]*\/live\/[A-Za-z0-9_-]+/.exec(it.text);
  const tx = /0\.0\.\d+@\d+\.\d+/.exec(it.text);
  const lease = /ls_[A-Za-z0-9_-]{8,}/.exec(it.text);
  if (live) out.liveUrl = live[0];
  if (tx) out.settlement = tx[0];
  if (lease) out.leaseId = lease[0];
  return Object.keys(out).length ? out : null;
}

async function run(job) {
  log(`claimed ${job.id}`);
  await post(`/v1/jobs/${job.id}/report`, { state: "running" });
  const file = `${RUNS}/${job.id}.jsonl`;

  await new Promise((resolve) => {
    const child = spawn("codex", [
      "exec", "--skip-git-repo-check", "--json",
      "-c", "model_reasoning_effort=high",
      preamble(job),
    ], { cwd: RUNS, stdio: ["ignore", "pipe", "pipe"] });

    let buf = "";
    const sent = {};
    child.stdout.on("data", (d) => {
      buf += d;
      writeFileSync(file, buf);
      for (const line of String(d).split("\n")) {
        const found = glean(line);
        if (!found) continue;
        const fresh = Object.fromEntries(Object.entries(found).filter(([k, v]) => sent[k] !== v));
        if (Object.keys(fresh).length) {
          Object.assign(sent, fresh);
          post(`/v1/jobs/${job.id}/report`, fresh);
        }
      }
    });
    child.stderr.on("data", () => {});
    child.on("close", async (code) => {
      const last = buf.split("\n").filter((l) => l.includes('"agent_message"')).slice(-1)[0];
      let summary = null;
      try { summary = JSON.parse(last).item.text.slice(0, 1500); } catch {}
      await post(`/v1/jobs/${job.id}/report`, {
        state: code === 0 ? "done" : "failed",
        result: summary ?? `codex exited ${code}`,
      });
      log(`${job.id} finished (${code === 0 ? "done" : "failed"})`);
      resolve();
    });
  });
}

log(`polling ${GATEWAY} every ${POLL_MS}ms`);
for (;;) {
  const r = await post("/v1/jobs/claim", { worker: NAME });
  if (r?.job) await run(r.job);
  else await new Promise((s) => setTimeout(s, POLL_MS));
}
