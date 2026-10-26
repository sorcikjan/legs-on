export function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4v16l13-8z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-[3px] flex-none"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

/** Zástupná fotka, dokud tvůrci nedodají originál. */
export function PersonPlaceholder({ label, iconSize = 72 }: { label?: string; iconSize?: number }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3.5 bg-ink text-[13px] uppercase tracking-[1px] text-on-dark-subtle">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6E6A62"
        strokeWidth="1.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
      {label}
    </div>
  );
}
