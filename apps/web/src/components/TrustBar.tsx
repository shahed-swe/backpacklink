// Trust badges shown directly under the hero — the three reasons to buy.
const BADGES = [
  { icon: '⚡', title: 'Instant delivery', sub: 'Your QR code in seconds' },
  { icon: '🌍', title: 'Works in 200+ countries', sub: 'One store for every trip' },
  { icon: '🛡️', title: 'Money-back guarantee', sub: "Didn't connect? Full refund" },
];

export function TrustBar() {
  return (
    <div className="border-y border-brand-100 bg-white">
      <div className="container-bp grid grid-cols-1 gap-5 py-6 sm:grid-cols-3">
        {BADGES.map((b) => (
          <div key={b.title} className="flex items-center justify-center gap-3 sm:justify-start">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">
              {b.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{b.title}</p>
              <p className="text-xs text-ink/50">{b.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
