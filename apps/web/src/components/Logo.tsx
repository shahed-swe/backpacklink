import Link from 'next/link';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-lagoon text-white shadow-card transition-transform group-hover:-rotate-6">
        {/* simple backpack/signal mark */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c4.97 0 9 4.03 9 9M12 7c2.76 0 5 2.24 5 5M12 11a2 2 0 0 1 2 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="7" cy="17" r="2" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">
        Backpack<span className="text-brand-600">Link</span>
      </span>
    </Link>
  );
}
