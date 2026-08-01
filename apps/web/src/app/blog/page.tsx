import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Travel eSIM guides & tips',
  description:
    'Guides on eSIMs, staying connected abroad, and getting the most from your travel data — from the BackpackLink team.',
};

export default async function BlogIndex() {
  const articles = await api.articles();

  return (
    <div className="container-bp py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-coral-500">The blog</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">
          Travel eSIM guides &amp; tips
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/60">
          Everything you need to stay connected on the road — plain-English guides to eSIMs, data,
          and travelling smarter.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="mt-16 text-center text-ink/50">No articles yet — check back soon.</p>
      ) : (
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              {a.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.coverImageUrl} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="grid h-40 place-items-center bg-gradient-to-br from-brand-500 to-brand-700 text-6xl">
                  {a.emoji}
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs text-ink/40">
                  {formatDate(a.createdAt)} · {a.readMins} min read
                </p>
                <h2 className="mt-2 font-display text-lg font-bold text-ink group-hover:text-brand-700">
                  {a.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-ink/60">{a.excerpt}</p>
                <span className="mt-4 text-sm font-semibold text-brand-700">Read article →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
