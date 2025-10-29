export function MedalIcon({ className = "", title = "", }: { className?: string; title?: string }) {
  return (
    // Simple medal icon using currentColor for easy theming
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={title ? "false" : "true"}
      aria-label={title}
    >
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path
        d="M8.5 12.5 7 21l5-3 5 3-1.5-8.5"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  );
}
