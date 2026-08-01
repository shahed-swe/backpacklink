// "Will it work on my phone?" — the top pre-purchase question for eSIM buyers.
const DEVICES: { brand: string; icon: string; models: string[] }[] = [
  {
    brand: 'iPhone',
    icon: '',
    models: ['iPhone XS, XR and newer', 'iPhone SE (2020) and newer', 'All iPhone 11–16 models'],
  },
  {
    brand: 'Samsung',
    icon: '📱',
    models: ['Galaxy S20 and newer', 'Galaxy Z Fold / Z Flip', 'Galaxy Note 20 and newer'],
  },
  {
    brand: 'Google Pixel',
    icon: '🔵',
    models: ['Pixel 3 and newer', 'Pixel Fold', '(Pixel 3 not supported in some regions)'],
  },
  {
    brand: 'Other',
    icon: '✨',
    models: ['Motorola Razr (2019+)', 'Rakuten, Oppo & more', 'Growing every year'],
  },
];

export function CompatibleDevices() {
  return (
    <section className="container-bp py-16">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-coral-500">
          Check before you buy
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
          Is your phone eSIM-ready?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink/60">
          Most phones released since 2018 support eSIM. Your device also needs to be
          carrier-unlocked. Here are the most common ones.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DEVICES.map((d) => (
          <div key={d.brand} className="card p-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{d.icon}</span>
              <h3 className="font-display text-lg font-bold text-ink">{d.brand}</h3>
            </div>
            <ul className="mt-4 space-y-2">
              {d.models.map((m) => (
                <li key={m} className="flex items-start gap-2 text-sm text-ink/60">
                  <span className="mt-0.5 text-brand-500">✓</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-xl text-center text-xs text-ink/40">
        Not sure? On most phones, dial <span className="font-mono text-ink/60">*#06#</span> — if you
        see an <span className="font-semibold">EID</span> number, your phone supports eSIM.
      </p>
    </section>
  );
}
