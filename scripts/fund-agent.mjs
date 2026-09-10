/**
 * Top the test agent up. Generously: a run that dies mid-workflow because the wallet ran dry
 * proves nothing about the workflow, and testnet HBAR costs nothing.
 */
import { PrivateKey, AccountId, AccountBalanceQuery, TransferTransaction, TokenId, Hbar } from "@hiero-ledger/sdk";
import { resolveNetwork } from "../src/networks.mjs";
import { readFileSync } from "node:fs";

const net = resolveNetwork("hedera:testnet");
const id = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
const key = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY.replace(/^0x/, ""));
const usdc = TokenId.fromString(net.usdc);
const client = net.makeClient().setOperator(id, key);
const cfg = JSON.parse(readFileSync("var/hedera.json", "utf8"));

const HBAR = Number(process.argv[2] ?? 300);
const USDC = Number(process.argv[3] ?? 8);

const bal = await new AccountBalanceQuery().setAccountId(id).execute(client);
console.log(`gateway holds ${bal.hbars.toString()} · ${bal.tokens?._map?.get(usdc.toString()) ?? 0} usdc units`);

const tx = await new TransferTransaction()
  .addHbarTransfer(id, new Hbar(-HBAR)).addHbarTransfer(cfg.agentId, new Hbar(HBAR))
  .addTokenTransfer(usdc, id, -Math.round(USDC * 1e6))
  .addTokenTransfer(usdc, cfg.agentId, Math.round(USDC * 1e6))
  .execute(client);
await tx.getReceipt(client);

const after = await new AccountBalanceQuery().setAccountId(cfg.agentId).execute(client);
console.log(`agent ${cfg.agentId} now holds ${after.hbars.toString()} · ${after.tokens?._map?.get(usdc.toString())} usdc units`);
client.close();
