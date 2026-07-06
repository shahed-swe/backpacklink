'use client';

interface Point {
  date: string;
  revenue: number;
  profit: number;
}

// Dependency-free SVG area+line chart: revenue (teal, filled) vs profit (coral, dashed).
export function SalesChart({ series }: { series: Point[] }) {
  if (series.length === 0) {
    return <p className="py-8 text-center text-sm text-ink/40">No sales in this period.</p>;
  }

  const W = 720;
  const H = 220;
  const P = 10;
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const n = series.length;
  const x = (i: number) => (n === 1 ? W / 2 : P + (i / (n - 1)) * (W - 2 * P));
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const path = (key: 'revenue' | 'profit') =>
    series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(s[key]).toFixed(1)}`).join(' ');
  const area = `${path('revenue')} L ${x(n - 1).toFixed(1)} ${H - P} L ${x(0).toFixed(1)} ${H - P} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Revenue and profit over time">
        <defs>
          <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0bb7a8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0bb7a8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#rev-fill)" />
        <path d={path('revenue')} fill="none" stroke="#039389" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={path('profit')} fill="none" stroke="#ff5a36" strokeWidth={2} strokeDasharray="5 3" strokeLinejoin="round" />
      </svg>
      <div className="mt-2 flex gap-5 text-xs font-semibold text-ink/50">
        <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-brand-600" /> Revenue</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-coral-500" /> Profit</span>
      </div>
    </div>
  );
}
