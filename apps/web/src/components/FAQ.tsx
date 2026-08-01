import { api } from '@/lib/api';

// Homepage FAQ — admin-managed (see the admin panel → FAQ). Native <details> so
// it's accessible, needs no client JS, and answers stay in the DOM for SEO.
export async function FAQ() {
  const faqs = await api.faqs();
  if (faqs.length === 0) return null;

  return (
    <section className="container-bp py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-coral-500">Good to know</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-8 divide-y divide-brand-100 overflow-hidden rounded-3xl border border-brand-100 bg-white">
          {faqs.map((f) => (
            <details key={f.id} className="group px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.question}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="whitespace-pre-line pb-5 text-sm leading-relaxed text-ink/60">
                {f.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
