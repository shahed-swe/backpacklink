import { esimcardRequest } from './client.js';
import type { PackageType } from './types.js';

// Raw response envelopes from esimcard (status + data/meta).
interface Envelope<T> {
  status: boolean;
  data: T;
  meta?: { total: number; perPage: number; currentPage: number; lastPage: number };
}

type Raw = Record<string, unknown>;

/**
 * Thin typed wrapper over the raw esimcard endpoints. Returns RAW shapes;
 * normalization + pricing happens in the catalog service layer.
 */
export const esimcard = {
  // --- account ---
  getBalance: () => esimcardRequest<{ status: boolean; balance: number }>('/balance'),

  // --- catalog ---
  getCountries: () => esimcardRequest<Envelope<Raw[]>>('/packages/country'),

  getContinents: () => esimcardRequest<Envelope<Raw[]>>('/packages/continent'),

  getCountryPackages: (countryId: number | string, type?: PackageType) =>
    esimcardRequest<Envelope<Raw[]>>(`/packages/country/${countryId}`, {
      query: { package_type: type },
    }),

  getContinentPackages: (continentId: number | string, type?: PackageType) =>
    esimcardRequest<Envelope<Raw[]>>(`/packages/continent/${continentId}`, {
      query: { package_type: type },
    }),

  getGlobalPackages: (type: PackageType = 'DATA-ONLY') =>
    esimcardRequest<Envelope<Raw[]>>(`/packages/global/${type}`),

  getPackages: (type: PackageType = 'DATA-ONLY', page = 1) =>
    esimcardRequest<Envelope<Raw[]>>('/packages', { query: { package_type: type, page } }),

  getPackageDetail: (id: string) =>
    esimcardRequest<Envelope<Raw>>(`/package/detail/${id}`),

  getNetworkCoverages: () => esimcardRequest<Envelope<Raw[]>>('/network-coverages'),

  // --- purchased eSIMs (used by fulfillment + dashboard) ---
  getMyEsims: () => esimcardRequest<Envelope<Raw[]>>('/my-esims'),
  getMyEsim: (id: string) => esimcardRequest<Envelope<Raw>>(`/my-esims/${id}`),
  getEsimUsage: (id: string) => esimcardRequest<Envelope<Raw>>(`/my-sim/${id}/usage`),
  getMyBundles: () => esimcardRequest<Envelope<Raw[]>>('/my-bundles'),
  getBundle: (id: string) => esimcardRequest<Envelope<Raw>>(`/bundles/${id}`),
  getOrder: (id: string | number) => esimcardRequest<Envelope<Raw>>(`/order/${id}`),

  // --- purchase / fulfillment (server-side only; spends reseller balance) ---
  canTopup: (iccid: string) =>
    esimcardRequest<Envelope<{ topup_available: boolean }>>('/can-topup-esim', {
      method: 'POST',
      body: { iccid },
    }),

  purchaseDataOnly: (packageTypeId: string, imei?: string) =>
    esimcardRequest<Envelope<Raw>>('/package/purchase', {
      method: 'POST',
      body: { package_type_id: packageTypeId, ...(imei ? { imei } : {}) },
    }),

  purchaseDataVoiceSms: (packageTypeId: string, imei?: string) =>
    esimcardRequest<Envelope<Raw>>('/package/date_voice_sms/purchase', {
      method: 'POST',
      body: { package_type_id: packageTypeId, ...(imei ? { imei } : {}) },
    }),
};

export type { Envelope };
