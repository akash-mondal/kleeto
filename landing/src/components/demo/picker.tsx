"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * A dropdown that is one control instead of two.
 *
 * The native <select> put the hit target on the value alone, so "Reasoning medium" read as a
 * single control but only half of it answered a click. Here the whole pill opens the menu, and
 * the menu can carry a second line — which model costs what, what a reasoning level is for —
 * that an <option> cannot show.
 */
export type PickerOption = { value: string; label: string; note?: string };

export function Picker({
  label,
  value,
  options,
  onChange,
  disabled = false,
  dot = false,
  width,
}: {
  label?: string;
  value: string;
  options: PickerOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
  dot?: boolean;
  /** Fixed width, so the bar does not reflow every time a different model is chosen. */
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open, options, value]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Escape") return setOpen(false);
    if (
      !open &&
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
    ) {
      e.preventDefault();
      return setOpen(true);
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[active].value);
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`kl-num flex cursor-pointer items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 text-[11.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${width ?? ""} ${
          open
            ? "border-white/25 bg-white/[0.07]"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        {dot ? (
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-[var(--kl-amber)]"
          />
        ) : null}
        {label ? <span className="shrink-0 text-white/45">{label}</span> : null}
        <span className="truncate text-white/80">{current?.label ?? value}</span>
        <svg
          viewBox="0 0 10 6"
          aria-hidden
          className={`ml-auto w-[9px] shrink-0 text-white/35 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path
            d="M1 1.5 5 5l4-3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 z-50 min-w-[210px] overflow-hidden rounded-[10px] border border-white/12 bg-[oklch(0.17_0.01_85/0.97)] py-1 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o.value)}
                className={`flex w-full cursor-pointer items-start gap-2 px-3 py-1.5 text-left transition-colors ${
                  i === active ? "bg-white/[0.07]" : ""
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-[5px] size-1.5 shrink-0 rounded-full ${o.value === value ? "bg-[var(--kl-amber)]" : "bg-white/15"}`}
                />
                <span className="min-w-0">
                  <span className="kl-num block text-[12px] text-white/85">
                    {o.label}
                  </span>
                  {o.note ? (
                    <span className="mt-0.5 block text-[11px] leading-[1.45] text-white/35">
                      {o.note}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
