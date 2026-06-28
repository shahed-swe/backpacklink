import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-bp py-24 text-center">
      <p className="text-5xl">🗺️</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">Page not found</h1>
      <p className="mt-2 text-ink/60">This destination isn’t on our map.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/destinations" className="btn-primary">
          Browse destinations
        </Link>
        <Link href="/" className="btn-ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
