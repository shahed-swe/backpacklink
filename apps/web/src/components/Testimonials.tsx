// Customer testimonials + review screenshots.
//
// >>> REPLACE the sample entries below with real testimonials. To show a review
//     screenshot (App Store review, WhatsApp message, etc.), drop the image in
//     apps/web/public/testimonials/ and set `image: '/testimonials/your-file.jpg'`.
//     A card renders fine with or without a screenshot.
type Testimonial = {
  name: string;
  location: string;
  quote: string;
  rating?: number; // 1–5, defaults to 5
  image?: string; // optional screenshot under /public/testimonials/
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sarah M.',
    location: 'Japan trip',
    quote:
      'Landed at Narita, scanned the QR, and had data before I got off the plane. No SIM swapping, no airport kiosk queue. Exactly what I needed.',
  },
  {
    name: 'David R.',
    location: 'Europe, 3 countries',
    quote:
      'One plan covered France, Italy and Spain. Cheaper than a single day of my carrier’s roaming. I’m never going back.',
  },
  {
    name: 'Aisha K.',
    location: 'Thailand',
    quote:
      'Was nervous about eSIMs but the install guide made it dead simple. Speeds were great for maps and video calls home.',
  },
  {
    name: 'Marco P.',
    location: 'USA',
    quote:
      'Bought it the night before my flight. Instant delivery, worked the moment I landed in New York. Support answered my question in minutes.',
  },
  {
    name: 'Lena T.',
    location: 'UAE',
    quote:
      'Kept my normal number active for calls while using BackpackLink for data. Best of both worlds on a two-week trip.',
  },
  {
    name: 'James O.',
    location: 'Indonesia',
    quote:
      'Topped up right from the app when I ran low in Bali. Took two taps. Genuinely the easiest travel data I’ve used.',
  },
];

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

export function Testimonials() {
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
          {TESTIMONIALS.map((t) => (
            <figure key={t.name + t.location} className="card flex flex-col p-6">
              <Stars n={t.rating ?? 5} />

              {t.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.image}
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
                  <p className="text-xs text-ink/50">{t.location}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
