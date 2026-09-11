/**
 * The worker that actually runs a job.
 *
 * It claims one job at a time from the gateway and spawns Codex against it. One at a time on
 * purpose: the queue decides how many may run, and a worker that claimed two would defeat the
 * limit it exists to enforce. Run several of these to raise throughput, up to the queue's
 * concurrency and no further, because the queue stops handing out work past that.
 */
import * as fsx from "node:fs";
import * as osx from "node:os";
import * as pathx from "node:path";
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

The person came here to use Kleeto's computers, not to meet a program. Never introduce yourself
by name, and never mention what you are running on: not Cline, not Codex, not a model name, not
"an AI assistant". Everything you say is about the computers and their task.

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

   If what they sent is a greeting, or a few words with no task in them, do not interrogate them
   and do not greet them back with who you are. Skip the paragraph from step 2 and send one
   kleeto_ask instead, about the services: what these computers can be used for with what you
   found — the kinds of computer, a couple of concrete jobs worth asking for, the sort of
   application already installed. Then who pays, which is the part people get wrong, so say it
   exactly this way round: the person pays nothing and needs nothing — no wallet, no account,
   no API key, no card. You pay. You answer Kleeto's 402 from your own Hedera wallet, the
   machines cost cents for the time you hold them, and the network fee on each payment is
   covered by the facilitator. Speak in the first person about paying ("I pay for the machine
   from my own wallet"), never "you answer a 402" or "from your own wallet" addressed to them.
   End by asking what they would like to use the computers for. Two short paragraphs in that
   one message, not a brochure and not a bulleted feature list.
4. kleeto_plan: the machine you will take, the image if it is a desktop, the steps, roughly how
   long, and what that will cost in money. It does not return until they approve it.

Rent nothing before kleeto_plan comes back approved. Not a browser, not a machine, not a
top-up. The plan is the only thing standing between this person and their own money.

Once approved:

5. kleeto_topup, then kleeto_rent what you said you would rent. If you have changed your mind
   about the machine, say so with kleeto_say before you take a different one.

   Buy credit three minutes at a time, not for the whole job: tinybar = 180 x the lane's
   tinybarPerSecond from kleeto_discover. Check kleeto_meter as you work and top up again
   whenever secondsRemaining falls under about sixty. Credit is not the bill — you are charged
   for the seconds you hold the machine either way — but topping up in small steps means the
   person watching sees each payment land instead of one number at the start, and an agent that
   loses its way costs them three minutes rather than ten.
6. kleeto_say the live view URL the moment you have it. Someone is watching an empty panel
   until you do.
7. Do the work, driving applications through their own interfaces. Screenshot after anything
   that changes the screen; never assume a click landed. A desktop takes about 45 seconds to
   restore from its image — screenshot until you see one.
8. Anything they are meant to keep: kleeto_deliver it before you hand the machine back. The
   machine goes back and everything on it goes with it — a file saved to /root on a returned
   desktop is a file nobody will ever open. Deliver the finished thing, not your working files.
9. Finish with kleeto_receipt, then kleeto_return, then say what you produced, what fought you,
   and the settlement transaction.

   When you mention a file you delivered, name it; do not paste its download link. The person has
   it in the run's files, one click away, and a long URL in the middle of a sentence is the worst
   place to hand someone something.

When something blocks you, escalate before you give up. You have more than one machine and you
are allowed to use them one after another in a single run:

  - A site shows a CAPTCHA, an "are you human" check, a login wall or a 403. That is what the
    stealth browser lane is for: hardened Chromium on a residential proxy with CAPTCHAs solved
    for you. Rent it, get the pages or the data you came for, return it, and carry on with the
    machine you already had. It costs more per second, so use it for the fetch and not for the
    afternoon.
  - An application on the desktop will not do what you need, but a shell would. Take a machine.
  - You cannot read a page in Chrome on the desktop. Take a browser instead.

kleeto_say what stopped you and what you are about to try, so nobody is watching an unexplained
pause, then do it. Ending the run with nothing because the first approach failed is the last
resort, not the second step — and if you do end that way, say exactly what you tried.

If something turns out to be genuinely impossible, say so plainly rather than pretending it
worked. If you find the machine you took was the wrong choice, say that too — it is cheaper to
be told.

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

/**
 * A Cline run's own settings, which is how the run's identity reaches the Kleeto tool server.
 *
 * Cline 3 starts tool servers from its hub rather than as children of the `cline` process, so
 * nothing set in that process's environment arrives: the tool server answered "nobody is
 * watching" and every question and message from a Cline model went nowhere. The one thing that
 * does arrive is the env block in the settings file. Each run gets a private copy of the
 * settings with KLEETO_JOB_ID written into that block, used through --data-dir.
 *
 * The copy holds the wallet key and the provider login, so it lives in a 0700 temp directory
 * and is deleted the moment the run ends.
 */
function clineDataDir(jobId) {
  const home = process.env.CLINE_DATA_DIR ?? pathx.join(osx.homedir(), ".cline", "data");
  const dir = fsx.mkdtempSync(pathx.join(osx.tmpdir(), `kleeto-cline-${NAME}-`));
  fsx.chmodSync(dir, 0o700);
  fsx.cpSync(pathx.join(home, "settings"), pathx.join(dir, "settings"), { recursive: true });
  const file = pathx.join(dir, "settings", "cline_mcp_settings.json");
  const cfg = JSON.parse(fsx.readFileSync(file, "utf8"));
  const kleeto = cfg.mcpServers?.kleeto;
  if (!kleeto) {
    fsx.rmSync(dir, { recursive: true, force: true });
    throw new Error(`no kleeto tool server in ${home}/settings/cline_mcp_settings.json`);
  }
  kleeto.env = { ...(kleeto.env ?? {}), KLEETO_JOB_ID: jobId };
  fsx.writeFileSync(file, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  return dir;
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
  let dataDir = null;
  if (spec.runner === "cline") {
    try { dataDir = clineDataDir(job.id); }
    catch (e) {
      await post(`/v1/jobs/${job.id}/report`, {
        state: "failed", result: `the ${spec.label} runner could not be prepared: ${String(e.message).slice(0, 160)}`,
      });
      log(`${job.id} could not prepare cline settings: ${e.message}`);
      return;
    }
  }
  const forget = () => { if (dataDir) fsx.rmSync(dataDir, { recursive: true, force: true }); };
  const [cmd, args] = spec.runner === "cline"
    ? ["cline", ["-P", "cline-pass", "-m", spec.model, "--json", "--data-dir", dataDir,
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
    /* KLEETO_JOB_ID is how the agent's questions find the right page and its payments the
       right ledger. Codex gets it through the -c override above and Cline through its per-run
       settings; the environment copy here is for anything that does inherit it. */
    const child = spawn(cmd, args, {
      cwd: RUNS,
      env: { ...process.env, KLEETO_JOB_ID: job.id },
      stdio: ["ignore", "pipe", "pipe"],
    });
    current = { job, child, forget };

    // A runner that is not installed must fail the job now. Without this the spawn error is
    // never handled, the job sits in "running" for its full stale window, and it holds a slot
    // someone else is queued for.
    child.on("error", async (err) => {
      forget();
      current = null;
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
      forget();
      current = null;
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

/**
 * Being stopped in the middle of a run.
 *
 * A deploy restarts the workers, and a run killed with its worker used to be left marked
 * "running" with a question on the page nobody would ever answer — holding one of the two
 * agents for the whole stale window, and leaving its settings copy, wallet key included, in
 * /tmp. Now the run is told it was interrupted and the copy is deleted before the process goes.
 */
let current = null;
process.on("SIGTERM", async () => {
  const c = current;
  if (c) {
    try { c.child.kill("SIGTERM"); } catch {}
    c.forget();
    await Promise.race([
      post(`/v1/jobs/${c.job.id}/report`, {
        state: "failed",
        result: "This run was interrupted when the service restarted, so it will not continue. Start a new one and it will pick up straight away.",
      }),
      new Promise((r) => setTimeout(r, 5000)),
    ]).catch(() => {});
    log(`${c.job.id} interrupted by shutdown`);
  }
  process.exit(0);
});

/* Anything under this worker's prefix at startup belongs to a run whose process is gone. */
for (const name of fsx.readdirSync(osx.tmpdir())) {
  if (name.startsWith(`kleeto-cline-${NAME}-`)) {
    fsx.rmSync(pathx.join(osx.tmpdir(), name), { recursive: true, force: true });
    log(`removed a settings copy left by an earlier run: ${name}`);
  }
}

log(`polling ${GATEWAY} every ${POLL_MS}ms`);
for (;;) {
  const r = await post("/v1/jobs/claim", { worker: NAME });
  if (r?.job) await run(r.job);
  else await new Promise((s) => setTimeout(s, POLL_MS));
}
