/**
 * The public record: payments, the meter's chain heads, and closing receipts, on a Hedera
 * Consensus Service topic.
 *
 * A hash chain proves the seconds were not rewritten only if a copy of its head lives somewhere
 * the gateway cannot edit. That copy is a topic message: consensus orders and timestamps it, the
 * mirror node serves it to anyone for free, and the topic's submit key means only the gateway can
 * write to it. Payments go to the same topic, so one ordered stream reads as the whole account of
 * a lease: what was paid, the seconds it bought, and what it came to when it was handed back.
 *
 * Heads go out once a minute per open lease rather than once a second: a message per second
 * costs more in consensus fees than the cheapest machine does, and a head proves every second
 * beneath it anyway.
 */
import { AccountId, PrivateKey, TopicId, TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";
import { hashscanTopic, hashscanTx } from "../networks.mjs";

export class Anchors {
  constructor({ net, operatorId, operatorKey, topicId }) {
    this.net = net;
    this.topicId = TopicId.fromString(topicId);
    this.client = net.makeClient().setOperator(
      AccountId.fromString(operatorId),
      PrivateKey.fromStringECDSA(String(operatorKey).replace(/^0x/, "")),
    );
    this.tail = Promise.resolve();   // one write at a time, in the order they were produced
  }

  get topic() { return this.topicId.toString(); }
  get explorer() { return hashscanTopic(this.net, this.topic); }

  /**
   * A chain head, as a buyer finds it on the topic. The last one for a lease is its receipt and
   * also carries the total and the payments that funded it.
   */
  static message({ leaseId, lane, rateTinybar, seq, head, at, final, totalTinybar, payments }) {
    return {
      t: final ? "kleeto/receipt" : "kleeto/anchor", v: 1,
      lease: leaseId, lane, rate: rateTinybar, seq, head, at,
      ...(final ? { total: totalTinybar, payments: payments ?? [] } : {}),
    };
  }

  /** Publish one record. Resolves with where it landed, rejects if the network refused it. */
  publish(record) {
    const write = this.tail.then(async () => {
      const resp = await new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(JSON.stringify(record))
        .execute(this.client);
      const receipt = await resp.getReceipt(this.client);
      const transaction = resp.transactionId.toString();
      const n = receipt.topicSequenceNumber;
      return {
        topicSequence: typeof n?.toNumber === "function" ? n.toNumber() : Number(n),
        transaction, explorer: hashscanTx(this.net, transaction),
      };
    });
    this.tail = write.catch(() => {});   // a refused write must not hold up the ones behind it
    return write;
  }

  anchor(a) {
    return this.publish(Anchors.message(a))
      .then((landed) => ({ seq: a.seq, head: a.head, at: a.at, final: Boolean(a.final), ...landed }));
  }
}
