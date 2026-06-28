import type { Country, Continent, Package, PackageType } from './types';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

// Revalidate catalog data periodically (ISR-friendly). Backend also caches.
const REVALIDATE = 1800;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE } });
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
