'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container-bp py-24 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">Something went off-route</h1>
      <p className="mt-2 text-ink/60">An unexpected error occurred. Please try again.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
