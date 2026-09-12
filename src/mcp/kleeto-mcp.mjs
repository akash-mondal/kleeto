/**
 * Kleeto as MCP tools.
 *
 * This is the whole product from an agent's side: rent a computer, pay for it out of your own
 * wallet, drive it, watch the meter, hand it back. The agent needs no Kleeto account and no
 * API key. It needs a Hedera account with money in it, and that is the point.
 *
 * The wallet lives here rather than in the model's context: the agent decides *to* pay, and
 * this decides *how*, which keeps a private key out of a transcript.
 */
import { readFileSync } from "node:fs";
import { PrivateKey } from "@hiero-ledger/sdk";
import { createClientHederaSigner, ExactHederaScheme } from "@x402/hedera";
import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";

const GATEWAY = process.env.KLEETO_GATEWAY ?? "https://api.kleeto.fun";
const NETWORK = process.env.KLEETO_NETWORK ?? "hedera:testnet";
/**
 * Which run this agent is working on, if a person is watching one.
 *
 * Codex and Cline both launch MCP servers with the env block from their own config, so the
 * worker has to write the variable there: a `-c` override for Codex, a per-run copy of the
 * settings for Cline, whose hub starts this server outside the CLI's process tree entirely.
 * Walking up the process tree stays as a fallback for a runner that does inherit it. Off
 * Linux there is no /proc and the answer is simply "nobody is watching", which is the right
 * answer for an agent running on someone's laptop.
 */
function resolveJob() {
  if (process.env.KLEETO_JOB_ID) return process.env.KLEETO_JOB_ID;
  let pid = process.ppid;
  for (let hop = 0; hop < 4 && pid > 1; hop++) {
    try {
      const env = readFileSync(`/proc/${pid}/environ`, "utf8");
      const hit = env.split("\0").find((l) => l.startsWith("KLEETO_JOB_ID="));
      if (hit) return hit.slice("KLEETO_JOB_ID=".length);
      const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
      pid = Number(stat.slice(stat.lastIndexOf(")") + 2).split(" ")[1]);
    } catch { return null; }
  }
  return null;
}
const JOB = resolveJob();

const signer = createClientHederaSigner(
  process.env.AGENT_ACCOUNT_ID,
  PrivateKey.fromStringDer(process.env.AGENT_PRIVATE_KEY),
);
/**
 * One paying fetch per asset, because the asset is chosen when the client is built.
 *
 * The selector picks the offer the run is paying in. Spend controls are off: they price a
 * payment in USD to enforce a cap and can only price the network's default asset, so with them
 * on the HBAR half of a two-asset offer is dropped and the wallet pays USDC whatever it asked
 * for. The cap that matters here is the credit the agent buys, which it chooses per top-up.
 */
const payers = new Map();
const payer = (asset) => {
  if (!payers.has(asset)) {
    const client = new x402Client(
      (_v, accepts) => accepts.find((a) => (a.extra?.symbol ?? "").toLowerCase() === asset) ?? accepts[0],
    ).register(NETWORK, new ExactHederaScheme(signer));
    client.setSpendControls(false);
    payers.set(asset, wrapFetchWithPayment(fetch, client));
  }
  return payers.get(asset);
};

/**
 * Which asset this run pays in.
 *
 * The person watching picked it when they submitted the job, so their choice wins over whatever
 * the model passes to the tool. Without a run there is nobody to have chosen, and the argument
 * stands.
 */
let runAsset;
async function assetFor(requested) {
  if (runAsset === undefined) {
    runAsset = null;
    if (JOB) {
      try { runAsset = (await call(`/v1/jobs/${JOB}`)).asset ?? null; } catch { /* fall back to the argument */ }
    }
  }
  return String(runAsset ?? requested ?? "usdc").toLowerCase();
}

const call = async (path, { method = "GET", body, paid = false, asset = "usdc" } = {}) => {
  const f = paid ? payer(asset) : fetch;
  const r = await f(GATEWAY + path, {
    method, headers: { "Content-Type": "application/json", ...(JOB ? { "x-kleeto-job": JOB } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let j; try { j = text ? JSON.parse(text) : {}; } catch { j = { raw: text.slice(0, 400) }; }
  if (!r.ok) throw new Error(`${path} ${r.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
};

/** One session per process. The agent tops it up; the meter draws it down. */
let sessionId = null;
async function session() {
  if (!sessionId) sessionId = (await call("/v1/sessions", { method: "POST" })).sessionId;
  return sessionId;
}

const TOOLS = {
  kleeto_discover: {
    description:
      "START HERE. Everything Kleeto has and what each thing costs: the three kinds of computer " +
      "(browser, headless machine, full desktop), every lane with its specs and price, every " +
      "desktop image with the applications on it, which assets are accepted, and the order money " +
      "moves in. Read this before you decide anything — you are not told which machine to take.",
    schema: { type: "object", properties: {} },
    run: async () => call("/v1/catalogue"),
  },
  kleeto_lanes: {
    description: "List the machines Kleeto rents and what each costs per second. Call this first.",
    schema: { type: "object", properties: {} },
    run: async () => call("/v1/lanes"),
  },
  kleeto_images: {
    description: "List the software images a desktop can boot with (base, studio, engineering, office) and which applications each carries.",
    schema: { type: "object", properties: {} },
    run: async () => call("/v1/images"),
  },
  kleeto_topup: {
    description: "Fund the session from your own Hedera wallet by answering Kleeto's 402. This is where the agent actually pays. Returns the settlement transaction.",
    schema: {
      type: "object",
      properties: {
        tinybar: { type: "number", description: "How much credit to buy, in tinybar. 100000000 is 1 HBAR." },
        asset: { type: "string", enum: ["usdc", "hbar"], description: "Which asset to pay in. Both are always accepted; on a watched run the asset the person picked is used instead." },
      },
    },
    run: async ({ tinybar = 200_000_000, asset }) => {
      const chosen = await assetFor(asset);
      const id = await session();
      return call(`/v1/sessions/${id}/topup?prefer=${chosen}`, { method: "POST", paid: true, asset: chosen, body: { tinybar } });
    },
  },
  kleeto_rent: {
    description: "Rent a machine. Spends the session balance a second at a time. Returns a lease id and a live view URL a human can watch.",
    schema: {
      type: "object",
      required: ["lane"],
      properties: {
        lane: { type: "string", description: "e.g. desktop-4, machine-2, browser-fast, browser-max" },
        image: { type: "string", description: "for desktops: base, studio, engineering or office" },
        seconds: { type: "number", description: "how long to reserve; the meter only charges what is used" },
      },
    },
    run: async ({ lane, image, seconds = 1800 }) =>
      call("/v1/leases", { method: "POST", body: { lane, image, seconds, sessionId: await session() } }),
  },
  kleeto_control: {
    description:
      "Drive a rented machine. Actions: exec, read, write, list, artifacts, preview, screenshot, " +
      "display, move, click, doubleClick, drag, scroll, type, press, hotkey, open. " +
      "Take a screenshot after anything that changes the screen; never assume a click landed.",
    schema: {
      type: "object",
      required: ["leaseId", "action"],
      properties: {
        leaseId: { type: "string" },
        action: { type: "string" },
        command: { type: "string" }, path: { type: "string" }, contents: { type: "string" },
        x: { type: "number" }, y: { type: "number" },
        fromX: { type: "number" }, fromY: { type: "number" }, toX: { type: "number" }, toY: { type: "number" },
        dx: { type: "number" }, dy: { type: "number" },
        text: { type: "string" }, keys: {}, key: { type: "string" },
        app: { type: "string" }, args: { type: "array", items: { type: "string" } },
        port: { type: "number" }, button: { type: "string" },
      },
    },
    run: async ({ leaseId, ...rest }) => call(`/v1/leases/${leaseId}/control`, { method: "POST", body: rest }),
  },
  kleeto_meter: {
    description: "How many seconds this lease has burned, what it has cost, and how much credit is left.",
    schema: { type: "object", required: ["leaseId"], properties: { leaseId: { type: "string" } } },
    run: async ({ leaseId }) => {
      const [lease, sess] = await Promise.all([
        call(`/v1/leases/${leaseId}`),
        call(`/v1/sessions/${await session()}`),
      ]);
      return { lease, balanceTinybar: sess.balanceTinybar, secondsRemaining: sess.secondsRemaining, spentTinybar: sess.spentTinybar };
    },
  },
  kleeto_receipt: {
    description: "The hash-chained proof of every second this lease was charged for. Anyone can recompute it.",
    schema: { type: "object", required: ["leaseId"], properties: { leaseId: { type: "string" } } },
    run: async ({ leaseId }) => {
      const p = await call(`/v1/leases/${leaseId}/proof`);
      return { seconds: p.seconds, totalTinybar: p.totalTinybar, genesis: p.genesis,
               chainHead: p.chainHead, selfCheck: p.selfCheck, howToVerify: p.howToVerify };
    },
  },
  kleeto_return: {
    description: "Hand the machine back. The meter stops and unused credit stays on the session.",
    schema: { type: "object", required: ["leaseId"], properties: { leaseId: { type: "string" } } },
    run: async ({ leaseId }) => call(`/v1/leases/${leaseId}/stop`, { method: "POST" }),
  },

  kleeto_deliver: {
    description:
      "Hand a finished file to the person watching. The machine goes back when you return it and " +
      "everything on it goes with it, so anything they are meant to keep has to be delivered " +
      "before then. Give the path on the machine; they get a download link. Deliver the finished " +
      "thing, not your working files.",
    schema: {
      type: "object",
      required: ["leaseId", "path"],
      properties: {
        leaseId: { type: "string" },
        path: { type: "string", description: "Where the file is on the rented machine." },
        as: { type: "string", description: "Optional: the name they should see it under." },
      },
    },
    run: async ({ leaseId, path, as }) =>
      call(`/v1/leases/${leaseId}/deliver`, { method: "POST", body: { path, as } }),
  },

  /* ------------------------------------------------------------- talking to a person ---- */

  kleeto_say: {
    description:
      "Tell the person watching something, without waiting for a reply. Use it when you have " +
      "learned something that changes what you are about to spend, or to report the live view " +
      "URL the moment you have one.",
    schema: { type: "object", required: ["text"], properties: { text: { type: "string" } } },
    run: async ({ text }) => {
      if (!JOB) return { delivered: false, why: "nobody is watching this run" };
      await call(`/v1/jobs/${JOB}/say`, { method: "POST", body: { text } });
      return { delivered: true };
    },
  },

  kleeto_ask: {
    description:
      "Ask the person a question and wait for their answer. Use this before renting anything, " +
      "as many times as you need, until you actually understand the task. Returns their reply. " +
      "If it returns answered:false they are still reading — call it again with the same text.",
    schema: {
      type: "object",
      required: ["text"],
      properties: {
        text: { type: "string", description: "One question, in plain language." },
        options: { type: "array", items: { type: "string" },
                   description: "Optional: two to six concrete choices, if the question has them." },
      },
    },
    run: async ({ text, options }) => converse({ text, options, kind: "question" }),
  },

  kleeto_plan: {
    description:
      "Propose what you are going to do and wait for the person to approve it. Say which machine " +
      "you will take, which image if any, roughly how long, and what it will cost. NOTHING may be " +
      "rented before this returns approved:true. If they reply with changes instead, fold them in " +
      "and propose again.",
    schema: {
      type: "object",
      required: ["text"],
      properties: {
        text: { type: "string", description: "The plan: the machine, the steps, the time, the cost." },
      },
    },
    run: async ({ text }) => converse({ text, kind: "plan" }),
  },
};

/**
 * Ask, then wait.
 *
 * The waiting is held on the gateway rather than looped here, so a person taking two minutes
 * to think does not become two minutes of "not yet" in the model's transcript. One tool call
 * in, one answer out, however long the person took.
 */
async function converse({ text, options, kind }) {
  if (!JOB) {
    return { asked: false,
             why: "nobody is watching this run, so there is no one to answer. Use your own judgement and continue.",
             ...(kind === "plan" ? { approved: true } : {}) };
  }
  const { qid } = await call(`/v1/jobs/${JOB}/ask`, { method: "POST", body: { text, options, kind } });
  /* Cline gives a tool call 300 seconds and Codex less, so this waits inside that budget and
     then hands the turn back rather than being killed mid-question. Asking again is cheap and
     the gateway remembers the question, so nothing is lost and nobody is asked twice. */
  const deadline = Date.now() + 200_000;
  for (;;) {
    const r = await call(`/v1/jobs/${JOB}/reply/${qid}?wait=25`);
    if (r.answered) {
      return kind === "plan"
        ? { approved: Boolean(r.approve), changes: r.text || null,
            ...(r.approve ? {} : { next: "they want something different — revise and call kleeto_plan again" }) }
        : { answered: true, reply: r.text };
    }
    if (Date.now() > deadline) {
      return { answered: false, stillWaiting: qid,
               hint: "they have not answered yet. Call this tool again with the same text to keep waiting — they will see the question you already asked, not a second copy." };
    }
  }
}

/* ------------------------------------------------------------------ MCP stdio ---- */
const send = (m) => process.stdout.write(JSON.stringify(m) + "\n");
let buf = "";
process.stdin.on("data", async (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    const reply = (result) => msg.id !== undefined && send({ jsonrpc: "2.0", id: msg.id, result });
    const fail = (message) => msg.id !== undefined &&
      send({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: message }], isError: true } });

    if (msg.method === "initialize") {
      reply({ protocolVersion: "2024-11-05", capabilities: { tools: {} },
              serverInfo: { name: "kleeto", version: "1.0.0" } });
    } else if (msg.method === "tools/list") {
      reply({ tools: Object.entries(TOOLS).map(([name, t]) => ({ name, description: t.description, inputSchema: t.schema })) });
    } else if (msg.method === "tools/call") {
      const tool = TOOLS[msg.params?.name];
      if (!tool) { fail(`no such tool ${msg.params?.name}`); continue; }
      try {
        const out = await tool.run(msg.params.arguments ?? {});
        // A screenshot comes back as an image so the model can actually look at the screen.
        // Keyed on `mime` rather than `image`, because a lease also carries an `image` field
        // naming its software image, and treating that as pixels sends the model a content
        // block whose data is the word "engineering".
        if (out?.image && out?.mime) {
          reply({ content: [{ type: "image", data: out.image, mimeType: out.mime ?? "image/png" }] });
        } else {
          reply({ content: [{ type: "text", text: JSON.stringify(out, null, 1) }] });
        }
      } catch (e) { fail(String(e.message).slice(0, 500)); }
    }
  }
});
