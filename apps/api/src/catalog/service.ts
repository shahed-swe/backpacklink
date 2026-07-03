import { esimcard } from '../esimcard/service.js';
import {
  normalizePackage,
  normalizeCountry,
  normalizeContinent,
} from '../esimcard/normalize.js';
import type {
  PackageType,
  PackageDTO,
  CountryDTO,
  ContinentDTO,
  PaginatedPackages,
} from '../esimcard/types.js';
import { retailPrice, displayCurrency } from './pricing.js';
import { getOrSet, TTL } from '../lib/cache.js';

type Raw = Record<string, unknown>;

const toPackage = (raw: Raw): PackageDTO => normalizePackage(raw, retailPrice, displayCurrency);

/**
 * Catalog read layer. Pulls from esimcard on demand and caches in memory so we
 * never live-fetch the (huge, ~47s) full catalog per page view. Markup applied
 * on the way out.
 */
export const catalog = {
  async countries(): Promise<CountryDTO[]> {
    return getOrSet('countries', TTL.countries, async () => {
      const res = await esimcard.getCountries();
      return (res.data ?? []).map(normalizeCountry).sort((a, b) => a.name.localeCompare(b.name));
    });
  },

  async continents(): Promise<ContinentDTO[]> {
    return getOrSet('continents', TTL.countries, async () => {
      const res = await esimcard.getContinents();
      return (res.data ?? []).map(normalizeContinent);
    });
  },

  async countryPackages(id: number | string, type?: PackageType): Promise<PackageDTO[]> {
    return getOrSet(`country:${id}:${type ?? 'all'}`, TTL.packages, async () => {
      const res = await esimcard.getCountryPackages(id, type);
      return (res.data ?? []).map(toPackage);
    });
  },

  async continentPackages(id: number | string, type?: PackageType): Promise<PackageDTO[]> {
    return getOrSet(`continent:${id}:${type ?? 'all'}`, TTL.packages, async () => {
      const res = await esimcard.getContinentPackages(id, type);
      return (res.data ?? []).map(toPackage);
    });
  },

  async globalPackages(type: PackageType = 'DATA-ONLY'): Promise<PackageDTO[]> {
    return getOrSet(`global:${type}`, TTL.packages, async () => {
      const res = await esimcard.getGlobalPackages(type);
      return (res.data ?? []).map(toPackage);
    });
  },

  async packages(type: PackageType = 'DATA-ONLY', page = 1): Promise<PaginatedPackages> {
    return getOrSet(`packages:${type}:${page}`, TTL.packages, async () => {
      const res = await esimcard.getPackages(type, page);
      return {
        items: (res.data ?? []).map(toPackage),
        pagination: res.meta ?? null,
      };
    });
  },

  async packageDetail(id: string): Promise<PackageDTO | null> {
    return getOrSet(`detail:${id}`, TTL.detail, async () => {
      const res = await esimcard.getPackageDetail(id);
      return res.data ? toPackage(res.data) : null;
    });
  },

  // "Will it work here?" — aggregate the networks + speeds available in a
  // country across its data plans.
  async countryCoverage(
    id: number | string,
  ): Promise<{ networks: { name: string; generations: string[] }[] }> {
    return getOrSet(`coverage:${id}`, TTL.packages, async () => {
      const pkgs = await catalog.countryPackages(id, 'DATA-ONLY');
      const byNetwork = new Map<string, Set<string>>();
      for (const p of pkgs) {
        for (const c of p.coverage) {
          for (const n of c.networks) {
            if (!byNetwork.has(n.name)) byNetwork.set(n.name, new Set());
            for (const g of n.generations) byNetwork.get(n.name)!.add(g);
          }
        }
      }
      const order = ['2G', '3G', '4G', '5G'];
      const networks = [...byNetwork.entries()].map(([name, gens]) => ({
        name,
        generations: order.filter((g) => gens.has(g)),
      }));
      return { networks };
    });
  },
};
