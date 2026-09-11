/**
 * Give the gateway and the demo agent their identity on the ledger.
 *
 * For each account, its HCS-11 profile, which carries its HCS-14 UAID, is inscribed on a new
 * HCS-1 topic: brotli-compressed, base64, chunked, with a submit key the account holds and no
 * admin key, so nobody can delete it. The account memo is then pointed at it
 * (`hcs-11:hcs://1/<topic>`), and both are read back from the mirror node before this reports
 * success. Re-running writes a fresh profile topic and repoints the memo.
 *
 *   npm run identity          (the demo agent's key comes from AGENT_PRIVATE_KEY or var/hedera.json)
 */
import { createHash } from "node:crypto";
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  AccountId, AccountUpdateTransaction, PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";
import { resolveNetwork, hashscanTopic, hashscanTx, mirror } from "../src/networks.mjs";
import { gatewayIdentity, demoAgentIdentity } from "../src/identity.mjs";

const net = resolveNetwork(process.env.HEDERA_NETWORK === "mainnet" ? "hedera:mainnet" : "hedera:testnet");
const ORIGIN = process.env.PUBLIC_ORIGIN ?? "https://api.kleeto.fun";
const local = existsSync("var/hedera.json") ? JSON.parse(readFileSync("var/hedera.json", "utf8")) : {};
const CHUNK = 1000;   // characters of payload per message, leaving room for the {o, c} wrapper under 1024 bytes

const accounts = [
  {
    who: gatewayIdentity({ net, accountId: process.env.HEDERA_OPERATOR_ID, origin: ORIGIN,
                           auditTopic: process.env.HCS_TOPIC_ID ?? local.topicId ?? null }),
    key: PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY.replace(/^0x/, "")),
  },
  {
    who: demoAgentIdentity({ net, accountId: process.env.AGENT_ACCOUNT_ID ?? local.agentId, origin: ORIGIN }),
    key: PrivateKey.fromStringDer(process.env.AGENT_PRIVATE_KEY ?? local.agentKey),
  },
];

async function inscribe(client, key, json) {
  const file = Buffer.from(JSON.stringify(json), "utf8");
  const hash = createHash("sha256").update(file).digest("hex");
  const compressed = brotliCompressSync(file, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
  const payload = `data:application/json;base64,${compressed.toString("base64")}`;

  const created = await new TopicCreateTransaction()
    .setTopicMemo(`${hash}:brotli:base64`)
    .setSubmitKey(key.publicKey)
    .execute(client);
  const topicId = (await created.getReceipt(client)).topicId.toString();
  const messages = [];
  for (let o = 0; o * CHUNK < payload.length; o++) {
    const sent = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify({ o, c: payload.slice(o * CHUNK, (o + 1) * CHUNK) }))
      .execute(client);
    await sent.getReceipt(client);
    messages.push(sent.transactionId.toString());
  }
  return { topicId, hash, created: created.transactionId.toString(), messages };
}

/** Read an HCS-1 file back the way any resolver would, and check it against the topic memo. */
async function readBack(topicId) {
  const topic = await mirror(net, `/api/v1/topics/${topicId}`);
  const { messages } = await mirror(net, `/api/v1/topics/${topicId}/messages?limit=100&order=asc`);
  const joined = messages.map((m) => JSON.parse(Buffer.from(m.message, "base64").toString()))
    .sort((a, b) => a.o - b.o).map((m) => m.c).join("");
  const file = brotliDecompressSync(Buffer.from(joined.slice(joined.indexOf(",") + 1), "base64"));
  const [memoHash, algo, encoding] = topic.memo.split(":");
  return {
    json: JSON.parse(file.toString("utf8")),
    valid: createHash("sha256").update(file).digest("hex") === memoHash && algo === "brotli" && encoding === "base64"
      && !topic.admin_key && Boolean(topic.submit_key),
  };
}

const out = {};
for (const { who, key } of accounts) {
  const client = net.makeClient().setOperator(AccountId.fromString(who.accountId), key);
  const ins = await inscribe(client, key, who.profile);
  const memo = `hcs-11:hcs://1/${ins.topicId}`;
  const update = await new AccountUpdateTransaction().setAccountId(who.accountId).setAccountMemo(memo).execute(client);
  await update.getReceipt(client);
  client.close();

  await new Promise((r) => setTimeout(r, 7000));   // mirror node lag
  const back = await readBack(ins.topicId);
  const acct = await mirror(net, `/api/v1/accounts/${who.accountId}?limit=1`);
  const ok = back.valid && back.json.uaid === who.uaid && acct.memo === memo;

  out[who.accountId] = { uaid: who.uaid, profileTopic: ins.topicId, memo, hash: ins.hash,
                         transactions: { topic: ins.created, messages: ins.messages, memo: update.transactionId.toString() } };
  console.log(`${who.profile.display_name}  ${who.accountId}  ${ok ? "verified" : "NOT VERIFIED"}
  uaid      ${who.uaid}
  profile   ${hashscanTopic(net, ins.topicId)}  (HCS-1, ${ins.messages.length} chunk${ins.messages.length === 1 ? "" : "s"}, ${back.valid ? "hash matches memo" : "HASH MISMATCH"})
  memo      ${acct.memo}  ${hashscanTx(net, update.transactionId.toString())}
`);
  if (!ok) process.exitCode = 1;
}
mkdirSync("var", { recursive: true });
writeFileSync("var/identity.json", JSON.stringify(out, null, 1));
