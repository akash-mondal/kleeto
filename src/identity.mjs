/**
 * Who is who, on the ledger.
 *
 * Two agents take part in every paid run: the gateway that sells the computers and the hosted
 * agent that buys them. Each has a Hedera account, and each gets a Universal Agent ID (HCS-14)
 * and a profile (HCS-11) that its account memo points at, so another agent can find out who it
 * is dealing with from the ledger alone rather than from a web page.
 *
 * A UAID is a hash of a few stable facts, so the gateway computes its own at boot and nothing
 * has to be configured. The profiles live on HCS-1 topics that scripts/identity.mjs writes.
 */
import { createHash } from "node:crypto";
import { mirror } from "./networks.mjs";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58(bytes) {
  let n = BigInt(`0x${Buffer.from(bytes).toString("hex")}`), out = "";
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b === 0) out = `1${out}`; else break; }
  return out;
}

/**
 * HCS-14 `uaid:aid`: base58(sha384) over the six identity fields, then the routing parameters in
 * the standard's order. The key order is the one the reference SDK hashes, which is what makes
 * the id reproducible by anyone who resolves it.
 */
export function uaid({ name, version, protocol, nativeId, skills, registry = "self", uid = "0", domain }) {
  const canonical = {
    skills: [...skills].sort((a, b) => a - b),
    name: name.trim(),
    nativeId: nativeId.trim(),
    protocol: protocol.trim().toLowerCase(),
    registry: registry.trim().toLowerCase(),
    version: version.trim(),
  };
  const id = base58(createHash("sha384").update(JSON.stringify(canonical), "utf8").digest());
  const params = [`uid=${uid}`, `registry=${canonical.registry}`, `proto=${canonical.protocol}`,
                  `nativeId=${canonical.nativeId}`, ...(domain ? [`domain=${domain}`] : [])];
  return `uaid:aid:${id};${params.join(";")}`;
}

/** HCS-14 core skill numbers used here. */
const SKILL = { API_INTEGRATION: 17, WORKFLOW_AUTOMATION: 18, TOOL_PROVIDER: 21, WEB_ACCESS: 25, BLOCKCHAIN: 33 };
/** HCS-11 `aiAgent.capabilities` numbers used here. */
const CAPABILITY = { API_INTEGRATION: 17, WORKFLOW_AUTOMATION: 18 };

/** The gateway: an A2A-reachable service selling computers over x402. */
export function gatewayIdentity({ net, accountId, origin, auditTopic = null }) {
  const id = uaid({
    name: "Kleeto", version: "1.0.0", protocol: "a2a", nativeId: `hedera:${net.short}:${accountId}`,
    skills: [SKILL.API_INTEGRATION, SKILL.TOOL_PROVIDER, SKILL.BLOCKCHAIN], uid: accountId,
    domain: new URL(origin).host,
  });
  return {
    uaid: id, accountId,
    profile: {
      version: "1.0", type: 1, display_name: "Kleeto", alias: "kleeto", uaid: id,
      bio: "Rents AI agents real computers, a browser, a Linux machine or a full desktop, by the second, paid over x402 on Hedera.",
      properties: {
        website: "https://kleeto.fun", api: origin,
        agentCard: `${origin}/.well-known/agent-card.json`,
        x402Discovery: `${origin}/discovery/resources`,
        auditTopic,
      },
      aiAgent: { type: 1, capabilities: [CAPABILITY.API_INTEGRATION, CAPABILITY.WORKFLOW_AUTOMATION], model: "n/a", creator: "Akash Mondal" },
    },
  };
}

/** The hosted demo agent: the buyer, paying from this account through the Kleeto MCP tools. */
export function demoAgentIdentity({ net, accountId, origin }) {
  const id = uaid({
    name: "Kleeto demo agent", version: "1.0.0", protocol: "mcp", nativeId: `hedera:${net.short}:${accountId}`,
    skills: [SKILL.WORKFLOW_AUTOMATION, SKILL.WEB_ACCESS, SKILL.BLOCKCHAIN], uid: accountId,
  });
  return {
    uaid: id, accountId,
    profile: {
      version: "1.0", type: 1, display_name: "Kleeto demo agent", alias: "kleeto-demo", uaid: id,
      bio: "The hosted agent on kleeto.fun/demo. It rents computers from Kleeto and pays for them from this account over x402.",
      properties: { website: "https://kleeto.fun/demo", paysInto: origin },
      aiAgent: { type: 1, capabilities: [CAPABILITY.WORKFLOW_AUTOMATION, CAPABILITY.API_INTEGRATION], model: "gpt-6-astra", creator: "Akash Mondal" },
    },
  };
}

/** The profile an account's memo points at, when it has one: `hcs-11:hcs://1/<topic>`. */
export async function profilePointer(net, accountId) {
  const acct = await mirror(net, `/api/v1/accounts/${accountId}?limit=1`);
  const m = /^hcs-11:(hcs:\/\/1\/(\d+\.\d+\.\d+))$/.exec(acct?.memo ?? "");
  return m ? { memo: acct.memo, hrl: m[1], topicId: m[2] } : null;
}
