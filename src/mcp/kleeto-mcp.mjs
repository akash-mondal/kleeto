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
import { PrivateKey } from "@hiero-ledger/sdk";
import { createClientHederaSigner, ExactHederaScheme } from "@x402/hedera";
import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";

const GATEWAY = process.env.KLEETO_GATEWAY ?? "https://api.kleeto.fun";
const NETWORK = process.env.KLEETO_NETWORK ?? "hedera:testnet";

const signer = createClientHederaSigner(
  process.env.AGENT_ACCOUNT_ID,
  PrivateKey.fromStringDer(process.env.AGENT_PRIVATE_KEY),
);
const pay = wrapFetchWithPayment(fetch, new x402Client().register(NETWORK, new ExactHederaScheme(signer)));

const call = async (path, { method = "GET", body, paid = false } = {}) => {
  const f = paid ? pay : fetch;
  const r = await f(GATEWAY + path, {
    method, headers: { "Content-Type": "application/json" },
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
        asset: { type: "string", enum: ["usdc", "hbar"], description: "Which asset to pay in. Both are always accepted." },
      },
    },
    run: async ({ tinybar = 200_000_000, asset = "hbar" }) => {
      const id = await session();
      return call(`/v1/sessions/${id}/topup?prefer=${asset}`, { method: "POST", paid: true, body: { tinybar } });
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
};

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
        if (out?.image) {
          reply({ content: [{ type: "image", data: out.image, mimeType: out.mime ?? "image/png" }] });
        } else {
          reply({ content: [{ type: "text", text: JSON.stringify(out, null, 1) }] });
        }
      } catch (e) { fail(String(e.message).slice(0, 500)); }
    }
  }
});
