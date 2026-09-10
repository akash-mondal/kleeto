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
import { AGENTS } from "../agents.mjs";

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
 * The instructions every job gets.
 *
 * What this used to say was "rent a desktop on the engineering image, use lane machine-1" —
 * the prompt made the decision and the agent only typed. That is wrong twice: the person
 * asking usually cannot tell whether their task needs a browser or a whole desktop, and an
 * agent that is told cannot notice that what it was told is wrong.
 *
 * So it is told nothing about the estate. It goes and looks, says what it found it could do,
 * asks what it needs to know, and proposes a plan. The machine is rented on the far side of
 * a person saying yes — which is also the first moment any money moves, so the approval and
 * the spend are the same gate.
 */
const preamble = (job) => `You have a Hedera wallet and no account with anyone. Kleeto rents real
computers by the second: you answer its 402 from your own wallet and it hands you a machine.
The kleeto_* tools are the only way you can reach a computer, and a person is watching this run.

Nobody has told you what Kleeto has. Go and find out, in this order:

1. kleeto_discover. This is the whole estate: browsers, headless machines, full desktops, what
   each one can be asked to do, what each costs a second, and which applications are already
   installed on each desktop image. Read it before you decide anything.
2. kleeto_say one short paragraph: what you could do for this task with what you just found,
   and which machine you are leaning towards and why. Plain language, no lists of specs.
3. kleeto_ask whatever you genuinely do not know. Ask about the task, not about infrastructure:
   the person knows what they want made, not which lane it needs. Ask as many times as you need
   to; it costs nothing and none of it is billed. Stop when you could not do the job better by
   asking again.
4. kleeto_plan: the machine you will take, the image if it is a desktop, the steps, roughly how
   long, and what that will cost in money. It does not return until they approve it.

Rent nothing before kleeto_plan comes back approved. Not a browser, not a machine, not a
top-up. The plan is the only thing standing between this person and their own money.

Once approved:

5. kleeto_topup, then kleeto_rent what you said you would rent. If you have changed your mind
   about the machine, say so with kleeto_say before you take a different one.
6. kleeto_say the live view URL the moment you have it. Someone is watching an empty panel
   until you do.
7. Do the work, driving applications through their own interfaces. Screenshot after anything
   that changes the screen; never assume a click landed. A desktop takes about 45 seconds to
   restore from its image — screenshot until you see one.
8. Finish with kleeto_receipt, then kleeto_return, then say what you produced, what fought you,
   and the settlement transaction.

If something turns out to be impossible, say so plainly rather than pretending it worked. If
you find the machine you took was the wrong choice, say that too — it is cheaper to be told.

What they asked for:

${job.prompt}
`;

/** Pull the live URL, lease and settlement out of the stream as they appear. */
function glean(line) {
  // Codex emits {type:"item.completed", item:{type:"agent_message", text}}; Cline emits
  // {type:"agent_event", event:{type:"content_end"|"done", text}}. Scan whatever text either
  // one produced rather than teaching this function two shapes.
  let e; try { e = JSON.parse(line); } catch { return null; }
  const text =
    (e.type === "item.completed" && e.item?.type === "agent_message" && e.item.text) ||
    (e.event && typeof e.event.text === "string" && e.event.text) ||
    (typeof e.text === "string" && e.text) || "";
  if (!text || text.length < 8) return null;
  const out = {};
  const live = /https?:\/\/[^\s")]*\/live\/[A-Za-z0-9_-]+/.exec(text);
  const tx = /0\.0\.\d+@\d+\.\d+/.exec(text);
  const lease = /ls_[A-Za-z0-9_-]{8,}/.exec(text);
  if (live) out.liveUrl = live[0];
  if (tx) out.settlement = tx[0];
  if (lease) out.leaseId = lease[0];
  return Object.keys(out).length ? out : null;
}

async function run(job) {
  log(`claimed ${job.id}`);
  await post(`/v1/jobs/${job.id}/report`, { state: "running" });
  const file = `${RUNS}/${job.id}.jsonl`;

  /**
   * Two runners, because the models live in two places. Codex hosts Astra; the ClinePass
   * models are reached through the Cline CLI. Both stream JSON events, so everything
   * downstream of the spawn is the same.
   */
  const spec = AGENTS[job.agent ?? "gpt-6-astra"] ?? AGENTS["gpt-6-astra"];
  const effort = job.effort ?? spec.defaultEffort;
  const [cmd, args] = spec.runner === "cline"
    ? ["cline", ["-P", "cline-pass", "-m", spec.model, "--json",
                 // MiniMax has a toggle rather than levels, so "off" means no thinking flag
                 ...(effort === "off" ? [] : ["--thinking", effort === "on" ? "high" : effort]),
                 "-t", "2400", "-c", RUNS, preamble(job)]]
    : ["codex", ["exec", "--skip-git-repo-check", "--json",
                 "-c", `model_reasoning_effort=${effort}`,
                 /* Codex starts its MCP servers with the env block from its own config and
                    nothing else, so the run's identity has to be pushed in as an override
                    rather than inherited. Without it the agent has no one to ask. */
                 "-c", `mcp_servers.kleeto.env.KLEETO_JOB_ID="${job.id}"`,
                 preamble(job)]];
  log(`${job.id} → ${spec.label} at ${effort}`);

  await new Promise((resolve) => {
    const budget = setTimeout(() => {
      try { child.kill("SIGTERM"); } catch {}
    }, Number(process.env.JOB_BUDGET_MS ?? 45 * 60_000));
    /* KLEETO_JOB_ID reaches the MCP server through codex/cline, which spawn it as a child:
       it is how the agent's questions find the right page and how its payments find the
       right ledger. */
    const child = spawn(cmd, args, {
      cwd: RUNS,
      env: { ...process.env, KLEETO_JOB_ID: job.id },
      stdio: ["ignore", "pipe", "pipe"],
    });

    // A runner that is not installed must fail the job now. Without this the spawn error is
    // never handled, the job sits in "running" for its full stale window, and it holds a slot
    // someone else is queued for.
    child.on("error", async (err) => {
      await post(`/v1/jobs/${job.id}/report`, {
        state: "failed",
        result: `the ${spec.label} runner could not start: ${String(err.message).slice(0, 160)}`,
      });
      log(`${job.id} could not start ${cmd}: ${err.message}`);
      resolve();
    });

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
      clearTimeout(budget);
      let summary = null;
      for (const l of buf.split("\n").reverse()) {
        try {
          const e = JSON.parse(l);
          const t = (e.item?.type === "agent_message" && e.item.text) ||
                    (e.event?.type === "done" && e.event.text) || null;
          if (t) { summary = String(t).slice(0, 1500); break; }
        } catch { /* not every line is an event */ }
      }
      await post(`/v1/jobs/${job.id}/report`, {
        state: code === 0 ? "done" : "failed",
        /* name the runner that actually ran: "codex exited" on a Cline job reads as a lie
           to anyone reading the board, and three of the four agents here are Cline. */
        result: summary ?? `${spec.label} (${spec.runner}) exited ${code ?? "on a signal"}`,
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
