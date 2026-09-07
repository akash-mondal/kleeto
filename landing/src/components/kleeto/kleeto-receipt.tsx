"use client";

import { BoxedWord, Container, Reveal, SectionHeading } from "./kleeto-primitives";
import { RailRow } from "./rail-marks";
import { ReceiptCard } from "./receipt-card";

const STEPS: readonly { title: string; body: string }[] = [
  {
    title: "Read the topic from the mirror node",
    body: "The receipt names the HCS topic. Hedera's mirror node serves its messages to anyone, with no key and no account.",
  },
  {
    title: "Add up the checkpoints",
    body: "One message per second the machine ran, each carrying the credits charged and the hash of the one before it.",
  },
  {
    title: "Hash the files it produced",
    body: "Recompute the merkle root over the artefacts and compare it to the root the receipt was signed over.",
  },
];

export function KleetoReceipt() {
  return (
    <section id="receipt" className="kl-ground py-20 md:py-28">
      <Container>
        <SectionHeading
          lede="Every second the machine runs is a hash-chained checkpoint on a public topic, and every file it produced is hashed into the same receipt. Anyone can recompute the bill from Hedera's mirror node. No key, no account, nothing to ask us for."
        >
          The bill is <BoxedWord>on a public ledger.</BoxedWord>
        </SectionHeading>

        {/* Three facts about the ledger side, before the artefacts themselves. */}
        <Reveal delayMs={60} className="mt-10">
          <dl className="grid gap-px overflow-hidden rounded-[18px] border border-kl-line bg-kl-line sm:grid-cols-3">
            {[
              ["written to", "HCS topic 0.0.7181234", "one message per checkpoint, $0.0001 each"],
              ["settled in", "HBAR or USDC", "on Hedera, final in seconds, fees quoted in USD"],
              ["signed with", "did:hedera · ES256K", "the receipt verifies without us"],
            ].map(([label, value, note]) => (
              <div key={label} className="bg-[var(--kl-ground)] px-6 py-5">
                <dt className="kl-num text-[11px] tracking-[0.16em] text-kl-muted uppercase">{label}</dt>
                <dd className="kl-num mt-2 text-[14px] text-kl-fg">{value}</dd>
                <dd className="mt-1 text-[13px] leading-[1.5] text-kl-muted">{note}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-x-14">
          <Reveal delayMs={120}>
            <ReceiptCard className="mx-auto w-full max-w-[420px] md:mx-0" />
          </Reveal>
          <Reveal delayMs={200} className="flex flex-col gap-8 md:pt-4">
            <div>
              <h3 className="kl-display text-[22px] leading-[1.15] font-medium text-kl-fg">
                Check it without asking us
              </h3>
              <ol className="mt-6 flex flex-col gap-5">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="kl-num mt-[3px] w-6 shrink-0 text-[12px] text-kl-amber-deep tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block text-[15px] leading-[1.4] text-kl-fg">{step.title}</span>
                      <span className="mt-1 block max-w-[46ch] text-[14px] leading-[1.55] text-kl-muted">
                        {step.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-kl-line pt-4">
              <p className="max-w-[40ch] text-[13px] leading-[1.6] text-kl-muted">
                The mirror node is public, and the receipt carries the topic it wrote to.
              </p>
              <RailRow className="shrink-0" />
            </div>
          </Reveal>
        </div>

      </Container>
    </section>
  );
}
