"use client";

import { StatefulTerminal, type TerminalLine, type TerminalState } from "@/components/solari-product/terminal-loop";

import { BoxedWord, Container, DarkCard, Reveal, SectionHeading } from "./kleeto-primitives";
import { RailMark } from "./rail-marks";

/**
 * How the payment works, told as the four HTTP moves it actually is.
 *
 * The earlier version buried the rail in prose and put the steps in a plain numbered
 * list. This one leads with the 402 itself: each move is a card carrying the method and
 * status it corresponds to, and the marks for x402, USDC and Hedera sit on the moves they
 * belong to, so the exchange is legible before a word is read.
 */
type Move = {
  code: string;
  title: string;
  body: string;
  mark?: "x402" | "usdc" | "hedera";
};

const MOVES: readonly Move[] = [
  {
    code: "GET /lease?lane=desktop-2",
    title: "The agent asks for a machine",
    body: "No account, no key, no card. Just a request for a lane.",
  },
  {
    code: "402 Payment Required",
    title: "Kleeto answers with a price",
    body: "The x402 challenge carries the rate per second, the asset and the network. One rate for that lane, fixed for the whole lease.",
    mark: "x402",
  },
  {
    code: "X-PAYMENT: <signed>",
    title: "The agent signs and asks again",
    body: "It pays in USDC from its own funded account. The facilitator submits the transaction and covers the gas, so your agent holds only what it means to spend.",
    mark: "usdc",
  },
  {
    code: "200 OK · lease open",
    title: "Hedera settles and the meter starts",
    body: "Final in seconds, at fees quoted in USD. The meter stops the moment your agent pauses, and the unused seconds come back.",
    mark: "hedera",
  },
];

const LINES: readonly TerminalLine[] = [
  { text: "$ kleeto lease desktop-2", tone: "prompt", phase: "running" },
  { text: "402 · 98,000 tinybar/s · USDC · hedera:testnet", tone: "info", phase: "running" },
  { text: "signed · agent 0.0.7162784 · fee payer 0.0.7162784", tone: "info", phase: "running" },
  { text: "up in 0.81 s · meter running", tone: "ok", phase: "running" },
  { text: "$ kleeto pause", tone: "prompt", phase: "paused" },
  { text: "meter stopped · 0 credits/s", tone: "info", phase: "paused" },
  { text: "unused seconds refunded", tone: "ok", phase: "paused" },
];

const STATES: readonly TerminalState[] = [
  { phase: "running", note: "Counting seconds" },
  { phase: "paused", note: "Meter stopped" },
  { phase: "resuming", note: "Unused seconds returned" },
];

const LABELS = { running: "RUNNING", paused: "PAUSED", resuming: "REFUNDED" } as const;

export function KleetoMeter() {
  return (
    <section id="meter" className="kl-section scroll-mt-20 py-24 md:py-32">
      <Container>
        <SectionHeading
          lede="Kleeto speaks the x402 payment standard. One HTTP exchange quotes a machine, pays for it and opens it, settled in USDC on Hedera. Neither side needs an account."
        >
          Four moves, and the machine <BoxedWord>is yours.</BoxedWord>
        </SectionHeading>

        <div className="mt-12 grid gap-4 md:mt-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ol className="grid gap-3 sm:grid-cols-2">
              {MOVES.map((move, index) => (
                <li key={move.code}>
                  <Reveal delayMs={index * 70} y={14} className="h-full">
                    <div className="flex h-full flex-col rounded-[16px] border border-kl-line bg-white/55 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="kl-num text-[11px] tracking-[0.14em] text-kl-muted uppercase">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {move.mark ? <RailMark name={move.mark} className="h-[18px] opacity-90" /> : null}
                      </div>
                      <p className="kl-num mt-4 text-[12.5px] leading-[1.4] text-kl-amber-deep">{move.code}</p>
                      <p className="mt-3 text-[15px] leading-[1.3] font-medium text-kl-fg">{move.title}</p>
                      <p className="mt-2 text-[13.5px] leading-[1.55] text-kl-muted">{move.body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>

          <Reveal delayMs={160} className="lg:col-span-5">
            <DarkCard className="h-full p-6">
              <StatefulTerminal title="kleeto · lease" lines={LINES} states={STATES} labels={LABELS} />
            </DarkCard>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
