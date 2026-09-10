/**
 * Associate the operator account with USDC so it can be paid in it.
 *
 * Hedera will not credit a token to an account that has not opted in, so a USDC transfer to an
 * unassociated account fails rather than arriving. The gateway is the payee for every lease,
 * which makes this a prerequisite for taking payment in anything but HBAR.
 *
 * Idempotent: an account that is already associated is left alone rather than re-associated.
 */
import {
  Client, PrivateKey, AccountId, AccountBalanceQuery,
  TokenAssociateTransaction, TokenId,
} from "@hiero-ledger/sdk";
import { resolveNetwork, hashscanTx } from "../src/networks.mjs";

const net = resolveNetwork(process.env.HEDERA_NETWORK === "mainnet" ? "hedera:mainnet" : "hedera:testnet");
const id = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
const key = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY.replace(/^0x/, ""));
const token = TokenId.fromString(net.usdc);

const client = net.makeClient().setOperator(id, key);

const before = await new AccountBalanceQuery().setAccountId(id).execute(client);
const already = before.tokens?._map?.has(token.toString());
console.log(`account   ${id}  on ${net.short}`);
console.log(`hbar      ${before.hbars.toString()}`);
console.log(`usdc      ${net.usdc}  ${already ? "already associated" : "not associated"}`);

if (!already) {
  const tx = await new TokenAssociateTransaction()
    .setAccountId(id)
    .setTokenIds([token])
    .freezeWith(client)
    .sign(key);
  const resp = await tx.execute(client);
  const receipt = await resp.getReceipt(client);
  console.log(`\nassociate ${receipt.status.toString()}`);
  console.log(`tx        ${hashscanTx(net, resp.transactionId.toString())}`);
}

const after = await new AccountBalanceQuery().setAccountId(id).execute(client);
const bal = after.tokens?._map?.get(token.toString());
console.log(`\nusdc balance ${bal ?? 0} (6 decimals) · ready to receive`);
console.log(`send test USDC to ${id} on ${net.short}`);
client.close();
