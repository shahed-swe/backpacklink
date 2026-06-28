import type { MetadataRoute } from 'next';
import { api, slugify } from '@/lib/api';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countries, continents] = await Promise.all([api.countries(), api.continents()]);

  const staticRoutes = ['', '/destinations', '/regions', '/global', '/how-it-works', '/faq'].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    }),
  );

  const countryRoutes = countries.map((c) => ({
    url: `${base}/esim/${slugify(c.name)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const regionRoutes = continents.map((c) => ({
    url: `${base}/regions/${slugify(c.name)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...countryRoutes, ...regionRoutes];
}
