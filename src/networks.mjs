// Every network-dependent fact in one table. Nothing anywhere else in the codebase may
// hardcode a mirror URL, a token id, a facilitator host, or call Client.forTestnet().
//
// This exists because the failure mode is well documented: a prior x402-on-Hedera project
// put `z.literal("hedera:testnet")` in its protocol schemas and `Client.forTestnet()` in its
// facilitator, which made mainnet impossible without a refactor. Mainnet must be a flag.
import { Client } from "@hiero-ledger/sdk";

/** CAIP-2 ids are the single switch used everywhere. */
export const TESTNET = "hedera:testnet";
export const MAINNET = "hedera:mainnet";

export const NETWORKS = {
  [TESTNET]: {
    caip2: TESTNET,
    short: "testnet",
    mirror: "https://testnet.mirrornode.hedera.com",
    facilitator: "https://api.testnet.blocky402.com",
    jsonRpc: "https://testnet.hashio.io/api",
    chainId: 296,
    usdc: "0.0.429274",
    hashscan: "https://hashscan.io/testnet",
    makeClient: () => Client.forTestnet(),
  },
  [MAINNET]: {
    caip2: MAINNET,
    short: "mainnet",
    mirror: "https://mainnet-public.mirrornode.hedera.com",
    facilitator: "https://api.blocky402.com",
    jsonRpc: "https://mainnet.hashio.io/api",
    chainId: 295,
    usdc: "0.0.456858",
    hashscan: "https://hashscan.io/mainnet",
    makeClient: () => Client.forMainnet(),
  },
};

/** HBAR is asset id 0.0.0 on both networks. */
export const HBAR_ASSET = "0.0.0";

export function resolveNetwork(caip2) {
  const net = NETWORKS[caip2];
  if (!net) {
    throw new Error(
      `unknown network ${caip2}; expected one of ${Object.keys(NETWORKS).join(", ")}`
    );
  }
  return net;
}

/**
 * Transaction ids come off the SDK as `0.0.1@2.3` but HashScan wants `0.0.1-2-3`.
 * Getting this wrong produces links that 404, which looks like a settlement failure.
 */
export function hashscanTx(net, txId) {
  return `${net.hashscan}/transaction/${String(txId).replace("@", "-").replace(/\.(\d+)$/, "-$1")}`;
}
export const hashscanTopic = (net, id) => `${net.hashscan}/topic/${id}`;
export const hashscanAccount = (net, id) => `${net.hashscan}/account/${id}`;

/**
 * The fee payer is never hardcoded. Both Blocky402 hosts advertise it under
 * `kinds[].extra.feePayer` for the matching scheme+network, and the two networks use
 * different accounts, so reading it is also what makes the mainnet flip free.
 */
export async function resolveFeePayer(net, { scheme = "exact", fetchImpl = fetch } = {}) {
  const r = await fetchImpl(`${net.facilitator}/supported`);
  if (!r.ok) throw new Error(`/supported ${r.status} from ${net.facilitator}`);
  const { kinds = [] } = await r.json();
  const kind = kinds.find((k) => k.network === net.caip2 && k.scheme === scheme);
  if (!kind) {
    throw new Error(`${net.facilitator} does not advertise ${scheme}/${net.caip2}`);
  }
  if (!kind.extra?.feePayer) {
    throw new Error(`${net.facilitator} advertises ${scheme}/${net.caip2} with no extra.feePayer`);
  }
  return kind.extra.feePayer;
}

/** Mirror node GET with a typed 404 so callers can distinguish lag from a real error. */
export async function mirror(net, path, { fetchImpl = fetch } = {}) {
  const r = await fetchImpl(`${net.mirror}${path}`);
  if (!r.ok) {
    const e = new Error(`mirror ${r.status} ${path}`);
    e.status = r.status;
    throw e;
  }
  return r.json();
}

/** The ledger's own HBAR/USD rate. Never a third-party price feed. */
export async function hbarUsd(net, opts) {
  const { current_rate } = await mirror(net, "/api/v1/network/exchangerate", opts);
  return current_rate.cent_equivalent / current_rate.hbar_equivalent / 100;
}
