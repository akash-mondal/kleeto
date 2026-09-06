"use client";

import { Check, Copy } from "lucide-react";
import { Fragment, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CodeSample = {
  language: string;
  install: string;
  code: string;
};

const TOKEN =
  /(\/\/[^\n]*|#\s[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(const|let|var|new|await|async|import|from|export|return|function|class|interface|type|def|package|func|fn|mut|pub|use|include|namespace|auto|struct|std|main|impl)\b|\b(true|false|null|nil|None|True|False)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)(?=\s*:)/g;

const CLASS_BY_GROUP = [
  "text-[#5f6672] italic", // comment
  "text-[#c3e88d]", // string
  "text-[#c792ea]", // keyword
  "text-[#82aaff]", // literal
  "text-[#f78c6c]", // number
  "text-[#82aaff]", // call
  "text-[#82aaff]", // property
];

function highlight(line: string, lineKey: number): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  let i = 0;
  while ((match = TOKEN.exec(line)) !== null) {
    if (match.index > last) out.push(<Fragment key={`p${lineKey}-${i}`}>{line.slice(last, match.index)}</Fragment>);
    const groupIndex = match.slice(1).findIndex((g) => g !== undefined);
    out.push(
      <span key={`t${lineKey}-${i}`} className={CLASS_BY_GROUP[groupIndex]}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
    i += 1;
  }
  if (last < line.length) out.push(<Fragment key={`p${lineKey}-end`}>{line.slice(last)}</Fragment>);
  return out;
}

/**
 * The language-tabbed code panel. It appears beside the hero on /browsers and
 * /sandboxes and as a full-width section on /desktops.
 */
export function CodeTabs({
  samples,
  caption,
  clip = false,
  className,
}: {
  samples: readonly CodeSample[];
  caption: string;
  clip?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const sample = samples[active];

  async function copy() {
    try {
      await navigator.clipboard.writeText(sample.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-hidden rounded-[4px] border border-white/10 bg-[#080a0e]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0d1118] px-3 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {samples.map((s, index) => (
              <button
                key={s.language}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "shrink-0 rounded-[4px] border px-3 py-1.5 font-mono text-[12px] transition-colors",
                  index === active
                    ? "border-sol-accent/70 bg-sol-accent/10 text-sol-accent"
                    : "border-white/10 bg-white/[0.02] text-[#9395a1] hover:text-white",
                )}
              >
                {s.language}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy code"
            className="shrink-0 rounded-[4px] p-1.5 text-[#9395a1] transition-colors hover:text-white"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>

        <div className="border-b border-white/[0.07] px-4 py-3">
          <p className="font-mono text-[9px] tracking-[0.18em] text-[#5f6672] uppercase">Install</p>
          <p className="mt-1.5 font-mono text-[12px] text-[#bbc7c6]">{sample.install}</p>
        </div>

        <pre
          className={cn(
            "overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.85] text-[#bbc7c6]",
            clip && "max-h-[300px] overflow-y-hidden",
          )}
        >
          <code>
            {sample.code.split("\n").map((line, index) => (
              <span key={index} className="block whitespace-pre">
                {line === "" ? " " : highlight(line, index)}
              </span>
            ))}
          </code>
        </pre>
      </div>
      <p className="text-[11px] leading-[1.6] text-sol-muted">{caption}</p>
    </div>
  );
}
