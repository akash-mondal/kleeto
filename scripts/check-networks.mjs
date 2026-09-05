// Proves the "mainnet is just a flag" claim: the same code path resolves both networks
// with nothing hardcoded but the CAIP-2 id.
import { NETWORKS, resolveNetwork, resolveFeePayer, hbarUsd, hashscanTx, TESTNET } from "../src/networks.mjs";

const rows = [];
for (const caip2 of Object.keys(NETWORKS)) {
  const net = resolveNetwork(caip2);
  try {
    const [feePayer, rate] = await Promise.all([resolveFeePayer(net), hbarUsd(net)]);
    rows.push({ network: net.short, feePayer, hbarUsd: rate.toFixed(6), usdc: net.usdc, ok: "yes" });
  } catch (e) {
    rows.push({ network: net.short, feePayer: "-", hbarUsd: "-", usdc: net.usdc, ok: e.message.slice(0, 40) });
  }
}
console.table(rows);
console.log("hashscan tx link form:", hashscanTx(resolveNetwork(TESTNET), "0.0.1234@1788516675.999"));
