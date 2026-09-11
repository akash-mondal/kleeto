"use client";

import { StatefulTerminal, type TerminalLine, type TerminalState } from "@/components/showcase/terminal-loop";

import { BoxedWord, Container, DarkCard, Reveal, SectionHeading } from "./kleeto-primitives";
import { RailMark } from "./rail-marks";

/**
 * How the payment works, told as the four HTTP moves it actually is.
 *
 * The earlier version buried the rail in prose and put the steps in a plain numbered
 * list. This one leads with the 402 itself: each move is a card carrying the method and
 * status it corresponds to, and the marks for x402, HBAR and USDC sit on the moves they
 * belong to, so the exchange is legible before a word is read.
 */
type Move = {
  code: string;
  title: string;
  body: string;
  marks?: readonly ("x402" | "usdc" | "hbar" | "hedera")[];
};

const MOVES: readonly Move[] = [
  {
    code: "POST /v1/leases { lane: desktop-2 }",
    title: "The agent asks for a machine",
    body: "No account, no key, no card. Just a request for a lane.",
  },
  {
    code: "402 Payment Required",
    title: "Kleeto answers with a price",
    body: "The x402 challenge carries the rate per second, the assets it accepts and the network. One rate for that lane, fixed for the whole lease.",
    marks: ["x402"],
  },
  {
    code: "X-PAYMENT: <signed>",
    title: "The agent signs and asks again",
    body: "It pays in HBAR or USDC, whichever it holds, from its own funded account. The facilitator submits the transaction and covers the gas, so your agent holds only what it means to spend.",
    marks: ["usdc", "hbar"],
  },
  {
    code: "200 OK · lease open",
    title: "Hedera settles and the meter starts",
    body: "Final in seconds, at fees quoted in USD. The meter charges every second the machine is held, and stops the moment your agent hands it back.",
    marks: ["hedera"],
  },
];

const LINES: readonly TerminalLine[] = [
  { text: "$ kleeto rent desktop-2", tone: "prompt", phase: "running" },
  { text: "402 · 54,213 tinybar/s · HBAR or USDC · hedera:testnet", tone: "info", phase: "running" },
  { text: "signed · agent 0.0.10454764 · fee payer 0.0.7162784", tone: "info", phase: "running" },
  { text: "desktop up · meter running", tone: "ok", phase: "running" },
  { text: "balance at zero · meter paused", tone: "info", phase: "paused" },
  { text: "disk and processes kept", tone: "ok", phase: "paused" },
];

const STATES: readonly TerminalState[] = [
  { phase: "running", note: "Counting seconds" },
  { phase: "paused", note: "Credit spent, machine kept" },
  { phase: "resuming", note: "Top-up settled, meter back on" },
];

const LABELS = { running: "RUNNING", paused: "PAUSED", resuming: "RESUMED" } as const;

export function KleetoMeter() {
  return (
    <section id="meter" className="kl-section scroll-mt-20 py-24 md:py-32">
      <Container>
        <SectionHeading
          lede="Kleeto speaks the x402 payment standard. One HTTP exchange quotes a machine, pays for it and opens it, settled in HBAR or USDC on Hedera. Neither side needs an account."
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
                        <span className="flex items-center gap-2">
                          {move.marks?.map((m) => (
                            <RailMark key={m} name={m} className="h-[18px] opacity-90" />
                          ))}
                        </span>
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
