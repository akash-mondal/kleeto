import type { SVGProps } from "react";

/**
 * Line-art icons redrawn to match the runloop.ai card illustrations.
 * The originals are hosted SVG assets; these are hand-approximated at the
 * same 40px optical size, 1.2px stroke, single-colour (currentColor).
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 27a13.5 13.5 0 0 1 27 0" />
      <path d="M11 27a9 9 0 0 1 18 0" />
      <path d="m20 27 8.5-7" />
      <circle cx="20" cy="27" r="1.8" />
    </Icon>
  );
}

export function ToolboxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 8.5 31 14v12l-11 5.5L9 26V14z" />
      <path d="M9 14l11 5.5L31 14M20 19.5V31.5" />
      <path d="M16.5 12.5v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
    </Icon>
  );
}

export function RepoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="28" r="3" />
      <circle cx="28" cy="20" r="3" />
      <path d="M12 15v10M15 12h6a4 4 0 0 1 4 4v1M15 28h6a4 4 0 0 0 4-4v-1" />
    </Icon>
  );
}

export function TemplateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="11" y="9" width="18" height="22" rx="2" />
      <path d="M14 9V7h12v2M15 15h10M15 20h10M15 25h6" />
    </Icon>
  );
}

export function BranchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="20" cy="11" r="2.6" />
      <circle cx="11" cy="26" r="2.6" />
      <circle cx="29" cy="26" r="2.6" />
      <circle cx="20" cy="20" r="2.6" />
      <path d="M20 13.6v3.8M18 21.6 12.8 24.4M22 21.6l5.2 2.8" />
    </Icon>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="22" height="22" rx="3" />
      <path d="M16 24 24 16M24 16h-5M24 16v5" />
    </Icon>
  );
}

export function ObserveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 13h20M10 19h14M10 25h18M10 31h9" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="20" cy="20" r="11" />
      <ellipse cx="20" cy="20" rx="5" ry="11" />
      <path d="M9.4 16.5h21.2M9.4 23.5h21.2M20 9v22" />
    </Icon>
  );
}

export function FingerprintIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 22a9 9 0 0 1 18 0v3" />
      <path d="M15 23a5 5 0 0 1 10 0v6" />
      <path d="M20 23v8" />
      <path d="M11 29v-1M29 29v2" />
    </Icon>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 31h22" />
      <rect x="12" y="20" width="4" height="8" />
      <rect x="19" y="14" width="4" height="14" />
      <rect x="26" y="23" width="4" height="5" />
    </Icon>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 11h-2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h9" />
      <path d="M25 11h2a2 2 0 0 1 2 2v6" />
      <rect x="15" y="8" width="10" height="5" rx="1.5" />
      <path d="m28.5 22.5 3 3-5.5 5.5H23v-3z" />
    </Icon>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 14h18M11 20h18M11 26h18" />
      <circle cx="17" cy="14" r="2.4" />
      <circle cx="24" cy="20" r="2.4" />
      <circle cx="15" cy="26" r="2.4" />
    </Icon>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 8.5 31 14.5v11L20 31.5 9 25.5v-11z" />
      <path d="M9 14.5 20 20.5l11-6M20 20.5v11" />
    </Icon>
  );
}

export function NetworkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="20" cy="20" r="3" />
      <circle cx="11" cy="12" r="2.2" />
      <circle cx="29" cy="12" r="2.2" />
      <circle cx="11" cy="28" r="2.2" />
      <circle cx="29" cy="28" r="2.2" />
      <path d="m12.6 13.6 5 4.4M27.4 13.6l-5 4.4M12.6 26.4l5-4.4M27.4 26.4l-5-4.4" />
    </Icon>
  );
}

export function MemoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 10h12l4 4v16H12z" />
      <path d="M16 14h2M20 14h2M16 18h2M20 18h2" />
      <path d="M12 24h16" />
    </Icon>
  );
}

export function BrowserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8" y="10" width="24" height="18" rx="2" />
      <path d="M8 15h24M11.5 12.5h.01M14.5 12.5h.01" />
      <path d="m19 19 6 2.4-2.5 1 -1 2.6z" />
    </Icon>
  );
}

export function SuspendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="20" cy="20" r="11" />
      <path d="M17.5 16.5v7M22.5 16.5v7" />
      <path d="M29 11v4h-4" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 8.5 30 12v8c0 6-4.4 9.6-10 11.5C14.4 29.6 10 26 10 20v-8z" />
      <rect x="16.5" y="19" width="7" height="5.5" rx="1" />
      <path d="M18 19v-1.5a2 2 0 0 1 4 0V19" />
    </Icon>
  );
}

export function ChipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="12" y="12" width="16" height="16" rx="2" />
      <rect x="17" y="17" width="6" height="6" rx="1" />
      <path d="M16 12V9M20 12V9M24 12V9M16 31v-3M20 31v-3M24 31v-3M12 16H9M12 20H9M12 24H9M31 16h-3M31 20h-3M31 24h-3" />
    </Icon>
  );
}

export function DockerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 22h20a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" />
      <path d="M13 22v-4h4v4M18 22v-4h4v4M23 22v-4h4v4M18 18v-4h4v4" />
      <path d="M30 20c2 0 3-1 3-1" />
    </Icon>
  );
}

export function RunloopMark(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="11" r="6.4" stroke="currentColor" strokeWidth={2} />
      <path
        d="M12 17.5c0 2 1.6 3.2 3.4 3.2"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" strokeWidth={1.1} {...props}>
      <path d="M4.6 12h6.2a2.7 2.7 0 0 0 .3-5.4A3.6 3.6 0 0 0 4.4 6a2.9 2.9 0 0 0 .2 6z" />
    </Icon>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 3.5h6.5V10M12.5 3.5 4 12" />
    </svg>
  );
}
