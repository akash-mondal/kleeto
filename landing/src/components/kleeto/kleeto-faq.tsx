"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

import { BoxedWord, Container, Reveal, SectionHeading } from "./kleeto-primitives";

type QA = { question: string; answer: string };

const ITEMS: readonly QA[] = [
  {
    question: "What is x402, and what does Kleeto do with it?",
    answer:
      "x402 is the HTTP payment standard: you ask for something, the server answers 402 Payment Required with a price, you sign a payment and ask again. Kleeto puts a per-second rate for the lane in that challenge. Your agent signs it, the machine opens, and the rate is fixed for the whole lease.",
  },
  {
    question: "Why Hedera, and which assets can my agent pay in?",
    answer:
      "Per-second billing needs fees that do not move and settlement that does not wait. Hedera's fees are quoted in USD from $0.0001 and transactions reach finality in seconds. A lease can be paid in HBAR or in USDC: the 402 quotes the rate for both, so an agent holding dollars and an agent holding the native asset can each answer it without swapping first. Either way the facilitator submits the transaction and covers the gas.",
  },
  {
    question: "Does my agent need a wallet?",
    answer:
      "It needs a funded Hedera account holding HBAR or USDC. Fund it once and the agent answers each 402 itself. There is no Kleeto account, no API key and no card on file, the account is the identity and the funding at the same time.",
  },
  {
    question: "What exactly do I get for the money?",
    answer:
      "A computer of your own for as long as you keep it running: a Chromium browser on a CDP endpoint, a Linux machine with a shell and files, or a full Linux desktop with applications installed and a screen you can watch. Browsers and machines come up in seconds, desktops in under a minute, and each one is yours until your agent hands it back.",
  },
  {
    question: "What does it cost?",
    answer:
      "From about 6 cents an hour for the smallest machine to 50 cents for the largest, 15 to 27 cents for a desktop, and $1.63 for the stealth browser. Ten minutes on a desktop is 2.5 to 4.5 cents. Prices are set in USD and converted at the ledger's own live HBAR rate at the moment you are quoted.",
  },
  {
    question: "What stops a runaway agent spending everything?",
    answer:
      "Your agent buys credit a few minutes at a time, and every lease has a maximum duration. When the credit runs out the machine pauses and bills nothing further, keeping its disk and processes, until the agent tops up or hands it back. Credit it did not use stays on its session for the next machine.",
  },
  {
    question: "How do I check the bill?",
    answer:
      "Every second is a hash-chained checkpoint, and the head of that chain is written to a public Hedera Consensus Service topic every minute and when the machine is handed back. Every file your agent takes off is recorded with its SHA-256. You can recompute the total from the proof and check it against Hedera's public mirror node with curl, no key, no account, nothing to ask us for.",
  },
  {
    question: "Which network does it run on?",
    answer:
      "hedera:testnet. Payment is HBAR or USDC over x402, quoted per second in the 402 and settled through a facilitator, and the meter's chain heads are written to public Hedera Consensus Service topic 0.0.10454763.",
  },
];

/**
 * Hairline accordion. One item open at a time; height animates through
 * `grid-template-rows: 0fr → 1fr`, so no measuring and no max-height guess.
 */
function FaqRow({
  item,
  open,
  onToggle,
  baseId,
}: {
  item: QA;
  open: boolean;
  onToggle: () => void;
  baseId: string;
}) {
  const panelId = `${baseId}-panel`;
  const buttonId = `${baseId}-button`;
  return (
    <div className="border-b border-kl-line">
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-6 py-5 text-left"
        >
          <span className="text-[15px] leading-[1.4] font-medium text-kl-fg md:text-[16px]">{item.question}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-kl-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open && "rotate-180",
              "motion-reduce:transition-none",
            )}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "[grid-template-rows:1fr]" : "[grid-template-rows:0fr]",
          "motion-reduce:transition-none",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="max-w-[60ch] pb-5 text-[14px] leading-[1.6] text-kl-muted md:text-[15px]">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export function KleetoFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="kl-section py-20 md:py-28">
      <Container>
        <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-x-12">
          <SectionHeading>
            About the rail. <BoxedWord>Plain answers.</BoxedWord>
          </SectionHeading>
          <Reveal delayMs={120}>
            <div className="border-t border-kl-line">
              {ITEMS.map((item, index) => (
                <FaqRow
                  key={item.question}
                  item={item}
                  baseId={`${baseId}-${index}`}
                  open={openIndex === index}
                  onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
