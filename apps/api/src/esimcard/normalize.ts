import type {
  PackageDTO,
  PackageType,
  CountryCoverageDTO,
  NetworkDTO,
  CountryDTO,
  ContinentDTO,
  EsimDTO,
  UsageDTO,
} from './types.js';

// The esimcard API uses inconsistent key names across endpoints
// (for-4G, fiv_5G, t_2G, th_3G vs four_G, five_G, two_g, three_g; price is
// sometimes a string, sometimes a number). Everything funnels through here.

const clean = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim();
const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  return undefined;
};

function generations(node: Record<string, unknown>): string[] {
  const supported = node['supported_networks_coverages'];
  if (Array.isArray(supported)) return supported.map(String);
  const out: string[] = [];
  if (pick(node, ['t_2G', 'two_g', 'two_G'])) out.push('2G');
  if (pick(node, ['th_3G', 'three_g', 'three_G'])) out.push('3G');
  if (pick(node, ['for-4G', 'four_G', 'four_g'])) out.push('4G');
  if (pick(node, ['fiv_5G', 'five_G', 'five_g'])) out.push('5G');
  return out;
}

// List endpoints: coverage is a flat array, one row per (country, network).
function coverageFromFlat(rows: Record<string, unknown>[]): CountryCoverageDTO[] {
  const byCountry = new Map<string, CountryCoverageDTO>();
  for (const row of rows) {
    const code = (row['code'] as string) ?? null;
    const name = clean(row['country_name'] ?? row['name']);
    const key = code || (row['iso'] as string) || name;
    if (!byCountry.has(key)) {
      byCountry.set(key, {
        country: name,
        code,
        iso: (row['iso'] as string) ?? null,
        flag: (row['country_image_url'] as string) ?? (row['image_url'] as string) ?? null,
        networks: [],
      });
    }
    const networkName = clean(row['network_name']);
    if (networkName) {
      byCountry.get(key)!.networks.push({
        name: networkName,
        code: (row['network_code'] as string) ?? null,
        generations: generations(row),
      });
    }
  }
  return [...byCountry.values()];
}

// Detail endpoint: countries[] each with nested network_coverage[].
function coverageFromNested(countries: Record<string, unknown>[]): CountryCoverageDTO[] {
  return countries.map((c) => {
    const nets = (c['network_coverage'] as Record<string, unknown>[]) ?? [];
    const networks: NetworkDTO[] = nets.map((n) => ({
      name: clean(n['network_name']),
      code: (n['network_code'] as string) ?? null,
      generations: generations(n),
    }));
    return {
      country: clean(c['name']),
      code: (c['code'] as string) ?? null,
      iso: (c['iso'] as string) ?? null,
      flag: (c['image_url'] as string) ?? null,
      networks,
    };
  });
}

function normalizeCoverage(raw: Record<string, unknown>): CountryCoverageDTO[] {
  if (Array.isArray(raw['coverage'])) return coverageFromFlat(raw['coverage'] as Record<string, unknown>[]);
  if (Array.isArray(raw['countries'])) return coverageFromNested(raw['countries'] as Record<string, unknown>[]);
  if (Array.isArray(raw['romaing_countries']))
    return coverageFromNested(raw['romaing_countries'] as Record<string, unknown>[]);
  return [];
}

export function normalizePackage(
  raw: Record<string, unknown>,
  retail: (wholesale: number) => number,
  currency: string,
): PackageDTO {
  const wholesale = toNum(raw['price']);
  return {
    id: String(raw['id']),
    name: clean(raw['name']),
    type: (raw['package_type'] as PackageType) ?? 'DATA-ONLY',
    scope: (raw['scope'] as string) ?? null,
    data: {
      quantity: toNum(raw['data_quantity']),
      unit: clean(raw['data_unit']) || 'GB',
      unlimited: Boolean(raw['unlimited']),
    },
    voice: {
      quantity: toNum(raw['voice_quantity']),
      unit: clean(raw['voice_unit']) || 'Minutes',
    },
    sms: { quantity: toNum(raw['sms_quantity']) },
    validity: {
      quantity: toNum(raw['package_validity']),
      unit: clean(raw['package_validity_unit']) || 'Day',
    },
    price: { wholesale, retail: retail(wholesale), currency },
    features: {
      tether: Boolean(raw['tether']),
      throttle: Boolean(raw['throttle']),
      throttleSpeed: (raw['throttle_speed'] as string) ?? null,
      connectivity: (raw['connectivity'] as string) ?? null,
      activationType: (raw['activation_type'] as string) ?? null,
      activationDescription: (raw['activation_type_description'] as string) ?? null,
      apn: (raw['apn'] as string) ?? null,
      canRenew: Boolean(raw['can_renew']),
    },
    coverage: normalizeCoverage(raw),
    banner: (raw['banner'] as string) ?? null,
  };
}

export function normalizeCountry(raw: Record<string, unknown>): CountryDTO {
  return {
    id: toNum(raw['id']),
    name: clean(raw['name']),
    flag: (raw['image_url'] as string) ?? null,
  };
}

export function normalizeContinent(raw: Record<string, unknown>): ContinentDTO {
  return {
    id: toNum(raw['id']),
    name: clean(raw['name']),
    code: (raw['code'] as string) ?? null,
    flag: (raw['image_url'] as string) ?? null,
  };
}

export function normalizeEsim(raw: Record<string, unknown>): EsimDTO {
  return {
    id: String(raw['id']),
    iccid: String(raw['iccid'] ?? ''),
    status: clean(raw['status']),
    lastBundle: raw['last_bundle'] ? clean(raw['last_bundle']) : null,
    totalBundles: toNum(raw['total_bundles']),
    simApplied: Boolean(raw['sim_applied']),
    apn: (raw['apn'] as string) ?? null,
    install: {
      qrCodeText: (raw['qr_code_text'] as string) ?? null,
      smdpAddress: (raw['smdp_address'] as string) ?? null,
      matchingId: (raw['matching_id'] as string) ?? null,
      universalLinkIos: (raw['universal_link'] as string) ?? null,
      universalLinkAndroid: (raw['android_universal_link'] as string) ?? null,
      pukCode: (raw['puk_code'] as string) ?? null,
    },
    createdAt: (raw['created_at'] as string) ?? null,
  };
}

export function normalizeUsage(raw: Record<string, unknown>): UsageDTO {
  const initQ = raw['initial_data_quantity'];
  const remQ = raw['rem_data_quantity'];
  return {
    initialQuantity: initQ === 'Unlimited' ? 'Unlimited' : toNum(initQ),
    initialUnit: clean(raw['initial_data_unit']) || 'GB',
    remainingQuantity: remQ === 'Unlimited' ? 'Unlimited' : toNum(remQ),
    remainingUnit: clean(raw['rem_data_unit']) || 'GB',
  };
}
