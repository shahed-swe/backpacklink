import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/blog';

// "From the blog" strip for the homepage — latest three published articles.
export async function BlogTeaser() {
  const articles = (await api.articles()).slice(0, 3);
  if (articles.length === 0) return null;

  return (
    <section className="container-bp py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-coral-500">From the blog</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Travel smarter, stay connected
          </h2>
        </div>
        <Link href="/blog" className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
          All articles →
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-glow"
          >
            {a.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.coverImageUrl} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="h-36 w-full bg-gradient-to-br from-brand-600 to-ink" />
            )}
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs text-ink/40">
                {formatDate(a.createdAt)} · {a.readMins} min read
              </p>
              <h3 className="mt-1 font-display text-base font-bold text-ink group-hover:text-brand-700">
                {a.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-ink/60">{a.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
