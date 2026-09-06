"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { Container, Eyebrow, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

type TokenKind = "plain" | "kw" | "ref" | "str" | "comment";
type Token = { t: string; k?: TokenKind };
type Line = readonly Token[];

const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "text-[#e7e7e2]",
  kw: "text-[#c792ea]",
  ref: "text-[#82aaff]",
  str: "text-[#f5c66a]",
  comment: "text-[#6b6f76] italic",
};

const kw = (t: string): Token => ({ t, k: "kw" });
const ref = (t: string): Token => ({ t, k: "ref" });
const str = (t: string): Token => ({ t, k: "str" });
const p = (t: string): Token => ({ t, k: "plain" });

type Snippet = { id: string; label: string; lines: readonly Line[] };

const CLIENT_LINE: Line = [
  kw("const"),
  p(" client = "),
  kw("new"),
  p(" "),
  ref("Solari"),
  p("({ "),
  ref("apiKey"),
  p(": process"),
  ref(".env"),
  str(".SOLARI_API_KEY"),
  p(" })"),
];

const SNIPPETS: readonly Snippet[] = [
  {
    id: "browser",
    label: "Browser",
    lines: [
      [kw("import"), p(" { "), ref("Solari"), p(" } "), kw("from"), p(" "), str('"@solarisdk/browser"')],
      [],
      CLIENT_LINE,
      [],
      [
        kw("const"),
        p(" browser = "),
        kw("await"),
        p(" client"),
        ref(".launch"),
        p("({ "),
        ref("stealth"),
        p(": "),
        kw("true"),
        p(", "),
        ref("proxy"),
        p(": "),
        str('"us"'),
        p(", "),
        ref("captcha"),
        p(": "),
        kw("true"),
        p(" })"),
      ],
      [{ t: "// Drive it with Playwright or any CDP client", k: "comment" }],
    ],
  },
  {
    id: "sandbox",
    label: "Sandbox",
    lines: [
      [kw("import"), p(" { "), ref("Solari"), p(" } "), kw("from"), p(" "), str('"@solarisdk/sandbox"')],
      [],
      CLIENT_LINE,
      [],
      [
        kw("const"),
        p(" sandbox = "),
        kw("await"),
        p(" client"),
        ref(".create"),
        p("({ "),
        ref("template"),
        p(": "),
        str('"base"'),
        p(", "),
        ref("timeout"),
        p(": "),
        kw("300"),
        p(" })"),
      ],
      [{ t: "// Run commands, install packages, stream stdout", k: "comment" }],
    ],
  },
  {
    id: "desktop",
    label: "Desktop",
    lines: [
      [kw("import"), p(" { "), ref("Solari"), p(" } "), kw("from"), p(" "), str('"@solarisdk/desktop"')],
      [],
      CLIENT_LINE,
      [],
      [
        kw("const"),
        p(" desktop = "),
        kw("await"),
        p(" client"),
        ref(".start"),
        p("({ "),
        ref("os"),
        p(": "),
        str('"ubuntu"'),
        p(", "),
        ref("resolution"),
        p(": "),
        str('"1280x800"'),
        p(" })"),
      ],
      [{ t: "// Click, type, and screenshot the live session", k: "comment" }],
    ],
  },
];

function lineToText(line: Line): string {
  return line.map((token) => token.t).join("");
}

export function CodeTabs() {
  const [active, setActive] = useState(SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);
  const snippet = SNIPPETS.find((s) => s.id === active) ?? SNIPPETS[0];

  async function copy() {
    const text = snippet.lines.map(lineToText).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="bg-sol-bg py-20 md:py-[120px]">
      <Container>
        <Reveal variant="heading">
          <Eyebrow>One platform</Eyebrow>
          <SectionHeading
            className="mt-5"
            lead="Learn one client."
            highlight="You know all three"
          />
        </Reveal>

        <Reveal
          variant="media"
          className="mt-9 overflow-hidden rounded-[4px] border border-white/10"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/8 bg-sol-panel px-3 py-3">
            <div role="tablist" aria-label="SDK" className="flex flex-wrap items-center gap-2">
              {SNIPPETS.map((s) => {
                const on = s.id === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setActive(s.id)}
                    className={`rounded-[4px] border px-3 py-1.5 font-mono text-[12px] transition-colors ${
                      on
                        ? "border-sol-accent text-sol-accent"
                        : "border-transparent bg-sol-card text-sol-muted hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy code"}
              className="rounded-[3px] p-1.5 text-sol-muted transition-colors hover:text-white"
            >
              <Copy className="size-4" />
            </button>
          </div>
          <pre className="overflow-x-auto bg-[#0a0a0c] p-5 font-mono text-[12px] leading-[2] md:p-6 md:text-[13px]">
            <code>
              {snippet.lines.map((line, i) => (
                <span key={i} className="block min-h-[1.55em] whitespace-pre">
                  {line.map((token, j) => (
                    <span key={j} className={TOKEN_CLASS[token.k ?? "plain"]}>
                      {token.t}
                    </span>
                  ))}
                </span>
              ))}
            </code>
          </pre>
        </Reveal>

        <Reveal variant="body">
            <p className="mt-9 max-w-[1080px] text-[16px] leading-[1.55] text-white md:text-[17px]">
            One API gives your agents access to browsers, sandboxes, and desktops. Use the same
            authentication, session management, and infrastructure across every environment. Start
            with one primitive today and and another as your agents grow.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
