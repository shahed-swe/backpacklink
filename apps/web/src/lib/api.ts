import type { Country, Continent, Package, PackageType, Promotions } from './types';
import type { ArticleSummary, Article, Faq, Testimonial } from './blog';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

// Revalidate catalog data periodically (ISR-friendly). Backend also caches.
const REVALIDATE = 1800;

async function get<T>(path: string, revalidate = REVALIDATE): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return (await res.json()) as T;
}

// Tolerant wrapper: never crash a page render if the backend hiccups.
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const api = {
  countries: () =>
    safe(() => get<{ data: Country[] }>('/api/catalog/countries').then((r) => r.data), []),

  continents: () =>
    safe(() => get<{ data: Continent[] }>('/api/catalog/continents').then((r) => r.data), []),

  countryPackages: (id: number | string, type: PackageType = 'DATA-ONLY') =>
    safe(
      () =>
        get<{ data: Package[] }>(`/api/catalog/countries/${id}/packages?type=${type}`).then(
          (r) => r.data,
        ),
      [],
    ),

  continentPackages: (id: number | string, type: PackageType = 'DATA-ONLY') =>
    safe(
      () =>
        get<{ data: Package[] }>(`/api/catalog/continents/${id}/packages?type=${type}`).then(
          (r) => r.data,
        ),
      [],
    ),

  globalPackages: (type: PackageType = 'DATA-ONLY') =>
    safe(() => get<{ data: Package[] }>(`/api/catalog/global?type=${type}`).then((r) => r.data), []),

  packageDetail: (id: string) =>
    safe(() => get<{ data: Package }>(`/api/catalog/packages/${id}`).then((r) => r.data), null),

  // Admin-managed promo bar + campaign banners. Short revalidate so edits show fast.
  promotions: (placement: 'web' | 'mobile' = 'web') =>
    safe(
      () =>
        get<{ data: Promotions }>(`/api/promotions?placement=${placement}`, 60).then((r) => r.data),
      { bar: null, banners: [] } as Promotions,
    ),

  // Platform version (shown in the footer).
  version: () => safe(() => get<{ version: string }>('/api/version', 300).then((r) => r.version), ''),

  // Admin-managed content. Short revalidate so edits appear quickly.
  faqs: () => safe(() => get<{ data: Faq[] }>('/api/faqs', 60).then((r) => r.data), []),

  articles: () =>
    safe(() => get<{ data: ArticleSummary[] }>('/api/articles', 60).then((r) => r.data), []),

  article: (slug: string) =>
    safe(() => get<{ data: Article }>(`/api/articles/${slug}`, 60).then((r) => r.data), null),

  testimonials: () =>
    safe(() => get<{ data: Testimonial[] }>('/api/testimonials', 60).then((r) => r.data), []),
};

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function findCountryBySlug(slug: string): Promise<Country | null> {
  const list = await api.countries();
  return list.find((c) => slugify(c.name) === slug) ?? null;
}

export async function findContinentBySlug(slug: string): Promise<Continent | null> {
  const list = await api.continents();
  return list.find((c) => slugify(c.name) === slug) ?? null;
}
