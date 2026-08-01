import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { formatDate, parseBody } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await api.article(slug);
  if (!article) return { title: 'Article not found' };
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await api.article(slug);
  if (!article) notFound();

  const blocks = parseBody(article.body);
  const more = (await api.articles()).filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <article className="container-bp py-14">
      <div className="mx-auto max-w-2xl">
        <Link href="/blog" className="text-sm font-semibold text-brand-700 hover:underline">
          ← All articles
        </Link>

        {article.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImageUrl}
            alt=""
            className="mt-6 h-44 w-full rounded-3xl object-cover"
          />
        ) : (
          <div className="mt-6 grid h-44 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-7xl">
            {article.emoji}
          </div>
        )}

        <p className="mt-6 text-xs text-ink/40">
          {formatDate(article.createdAt)} · {article.readMins} min read
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
          {article.title}
        </h1>

        <div className="mt-8 space-y-4">
          {blocks.map((b, i) =>
            b.type === 'h' ? (
              <h2 key={i} className="pt-2 font-display text-xl font-bold text-ink">
                {b.text}
              </h2>
            ) : (
              <p key={i} className="leading-relaxed text-ink/70">
                {b.text}
              </p>
            ),
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-3xl bg-ink p-8 text-center text-white">
          <h3 className="font-display text-xl font-bold">Ready to try it?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
            Get an eSIM for your next destination and be online the moment you land.
          </p>
          <Link href="/destinations" className="btn-primary mt-5">
            Browse eSIM plans
          </Link>
        </div>

        {/* Related */}
        {more.length > 0 && (
          <div className="mt-14">
            <h3 className="font-display text-lg font-bold text-ink">Keep reading</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {more.map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="card group flex items-center gap-4 p-4"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">
                    {a.emoji}
                  </span>
                  <span className="text-sm font-bold text-ink group-hover:text-brand-700">
                    {a.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
