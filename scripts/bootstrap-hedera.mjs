/**
 * One-time setup on the ledger: the topic receipts are anchored to, and a funded agent
 * account to test payments with.
 *
 * The agent account exists because paying yourself proves nothing: a transfer where payer and
 * payee are the same account nets to zero and would pass a test that a real payment fails.
 */
import {
  PrivateKey, AccountId, AccountCreateTransaction, AccountBalanceQuery,
  TopicCreateTransaction, TransferTransaction, TokenAssociateTransaction,
  TokenId, Hbar,
} from "@hiero-ledger/sdk";
import { resolveNetwork, hashscanTopic, hashscanAccount } from "../src/networks.mjs";
import { writeFileSync, existsSync, readFileSync } from "node:fs";

const net = resolveNetwork("hedera:testnet");
const id = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
const key = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY.replace(/^0x/, ""));
const usdc = TokenId.fromString(net.usdc);
const client = net.makeClient().setOperator(id, key);
const out = existsSync("var/hedera.json") ? JSON.parse(readFileSync("var/hedera.json", "utf8")) : {};

/* ---- the topic every receipt anchors to ------------------------------------------ */
if (!out.topicId) {
  const submitKey = key;   // only the gateway writes checkpoints; anyone may read them
  const resp = await new TopicCreateTransaction()
    .setTopicMemo("kleeto: lease checkpoints")
    .setAdminKey(key.publicKey)
    .setSubmitKey(submitKey.publicKey)
    .execute(client);
  const receipt = await resp.getReceipt(client);
  out.topicId = receipt.topicId.toString();
  console.log(`topic     ${out.topicId}  ${hashscanTopic(net, out.topicId)}`);
} else {
  console.log(`topic     ${out.topicId} (already created)`);
}

/* ---- an agent account, so a test payment is a real transfer ---------------------- */
if (!out.agentId) {
  const agentKey = PrivateKey.generateECDSA();
  const resp = await new AccountCreateTransaction()
    .setKeyWithoutAlias(agentKey.publicKey)
    .setInitialBalance(new Hbar(200))
    .execute(client);
  const agentId = (await resp.getReceipt(client)).accountId.toString();
  out.agentId = agentId;
  out.agentKey = agentKey.toStringDer();
  console.log(`agent     ${agentId}  ${hashscanAccount(net, agentId)}  funded 200 HBAR`);

  // it needs to hold USDC too, which means opting in first
  const assoc = await new TokenAssociateTransaction()
    .setAccountId(agentId).setTokenIds([usdc])
    .freezeWith(client).sign(agentKey);
  await (await assoc.execute(client)).getReceipt(client);

  const send = await new TransferTransaction()
    .addTokenTransfer(usdc, id, -5_000_000)      // 5 USDC
    .addTokenTransfer(usdc, agentId, 5_000_000)
    .execute(client);
  await send.getReceipt(client);
  console.log(`          associated USDC and funded 5 USDC`);
} else {
  console.log(`agent     ${out.agentId} (already created)`);
}

writeFileSync("var/hedera.json", JSON.stringify(out, null, 1));

for (const [label, acct] of [["gateway", id.toString()], ["agent", out.agentId]]) {
  const b = await new AccountBalanceQuery().setAccountId(acct).execute(client);
  console.log(`${label.padEnd(9)} ${acct}  ${b.hbars.toString()}  usdc ${b.tokens?._map?.get(usdc.toString()) ?? 0}`);
}
client.close();
