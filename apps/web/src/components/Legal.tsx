import type { ReactNode } from 'react';

/** Shared shell for legal / policy pages — consistent title, "last updated", and prose column. */
export function Legal({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="container-bp py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: {updated}</p>
        {intro && <p className="mt-6 text-ink/70">{intro}</p>}
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="mt-2 space-y-3 text-ink/70">{children}</div>
    </section>
  );
}

/** A simple styled list for policy pages. */
export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-brand-400">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
