import { api } from '@/lib/api';

function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < n ? 'text-yellow-400' : 'text-ink/15'}>
          ★
        </span>
      ))}
    </div>
  );
}

// Real customer testimonials — admin-managed (admin panel → Testimonials).
export async function Testimonials() {
  const testimonials = await api.testimonials();
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-sand-100 py-20">
      <div className="container-bp">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-coral-500">
            Loved by travelers
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Trusted on trips around the world
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.id} className="card flex flex-col p-6">
              <Stars n={t.rating} />

              {t.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.imageUrl}
                  alt={`Review from ${t.name}`}
                  className="mt-4 w-full rounded-xl border border-brand-100 object-cover"
                  loading="lazy"
                />
              )}

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink/70">
                “{t.quote}”
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                  {t.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">{t.name}</p>
                  {t.location && <p className="text-xs text-ink/50">{t.location}</p>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
