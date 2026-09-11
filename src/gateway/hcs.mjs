/**
 * The meter's chain heads, published to a Hedera Consensus Service topic.
 *
 * A hash chain proves the seconds were not rewritten only if a copy of its head lives somewhere
 * the gateway cannot edit. That copy is a topic message: consensus orders and timestamps it, the
 * mirror node serves it to anyone for free, and the topic's submit key means only the gateway can
 * write to it. A buyer recomputes the chain from /v1/leases/:id/proof and finds the same head, at
 * the same second, on the ledger.
 *
 * One message a minute per open lease, plus one when it is handed back, rather than one a second:
 * a message per second costs more in consensus fees than the cheapest machine does, and a head
 * proves every second beneath it anyway.
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
    this.tail = Promise.resolve();   // one write at a time, in the order the meter produced them
  }

  get topic() { return this.topicId.toString(); }
  get explorer() { return hashscanTopic(this.net, this.topic); }

  /** What a buyer finds on the topic. Flat and small, so it reads in any explorer. */
  static message({ leaseId, lane, rateTinybar, seq, head, at, final }) {
    return JSON.stringify({ t: "kleeto/anchor", v: 1, lease: leaseId, lane, rate: rateTinybar,
                            seq, head, at, ...(final ? { final: true } : {}) });
  }

  /** Publish one head. Resolves with where it landed, rejects if the network refused it. */
  anchor(a) {
    const write = this.tail.then(async () => {
      const resp = await new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(Anchors.message(a))
        .execute(this.client);
      const receipt = await resp.getReceipt(this.client);
      const transaction = resp.transactionId.toString();
      const n = receipt.topicSequenceNumber;
      return {
        seq: a.seq, head: a.head, at: a.at, final: Boolean(a.final),
        topicSequence: typeof n?.toNumber === "function" ? n.toNumber() : Number(n),
        transaction, explorer: hashscanTx(this.net, transaction),
      };
    });
    this.tail = write.catch(() => {});   // a refused write must not hold up the ones behind it
    return write;
  }
}
