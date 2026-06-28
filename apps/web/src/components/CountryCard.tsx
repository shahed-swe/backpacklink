import Link from 'next/link';
import type { Country } from '@/lib/types';
import { slugify } from '@/lib/api';

export function CountryCard({ country }: { country: Country }) {
  return (
    <Link
      href={`/esim/${slugify(country.name)}`}
      className="card group flex items-center gap-3 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
    >
      {country.flag ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={country.flag}
          alt={`${country.name} flag`}
          width={40}
          height={28}
          className="h-7 w-10 rounded-md object-cover shadow-sm"
          loading="lazy"
        />
      ) : (
        <span className="grid h-7 w-10 place-items-center rounded-md bg-brand-50 text-xs">🌍</span>
      )}
      <span className="flex-1 text-sm font-semibold text-ink group-hover:text-brand-700">
        {country.name}
      </span>
      <span className="text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600">
        →
      </span>
    </Link>
  );
}
