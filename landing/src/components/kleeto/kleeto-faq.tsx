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
    question: "Why Hedera, and why USDC?",
    answer:
      "Per-second billing needs fees that do not move and settlement that does not wait. Hedera's fees are quoted in USD from $0.0001 and transactions reach finality in seconds. Payment is in USDC so the agent holds dollars rather than a volatile balance, and the facilitator submits the transaction and covers the gas.",
  },
  {
    question: "Does my agent need a wallet?",
    answer:
      "It needs a funded Hedera account holding USDC. Fund it once and the agent answers each 402 itself. There is no Kleeto account, no API key and no card on file, the account is the identity and the funding at the same time.",
  },
  {
    question: "What exactly do I get for the money?",
    answer:
      "A computer of your own for as long as you keep it running: a Chromium browser on a CDP endpoint, a Linux machine with a shell and a stateful Python REPL, or a full Linux desktop with a screen you can watch. Up in about a second, and yours until you pause or stop it.",
  },
  {
    question: "What does it cost?",
    answer:
      "Between roughly 6 and 50 cents an hour depending on the lane; ten minutes on a desktop is about 2.5 cents. Prices are set in USD and converted at the ledger's own live HBAR rate at the moment you are quoted.",
  },
  {
    question: "What stops a runaway agent spending everything?",
    answer:
      "Every lease carries a credit cap and a maximum duration. When either is reached the machine pauses, bills nothing further, and the unused seconds are returned. A paused machine keeps its disk and memory at zero per second.",
  },
  {
    question: "How do I check the bill?",
    answer:
      "Every second is a hash-chained checkpoint written to a public Hedera Consensus Service topic, and every file the machine produced is hashed into the same receipt. You can recompute the total from Hedera's public mirror node with curl, no key, no account, nothing to ask us for.",
  },
  {
    question: "Which network does it run on?",
    answer:
      "hedera:testnet. Payment is USDC over x402, quoted per second in the 402 and settled through a facilitator, and every checkpoint is written to a public Hedera Consensus Service topic.",
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
