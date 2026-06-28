// Clean, normalized types our frontend/app consume.
// The raw esimcard payloads are messy and inconsistent; we never expose them.

export type PackageType = 'DATA-ONLY' | 'DATA-VOICE-SMS';

export interface NetworkDTO {
  name: string;
  code: string | null;
  generations: string[]; // e.g. ["2G","3G","4G","5G"]
}

export interface CountryCoverageDTO {
  country: string;
  code: string | null; // ISO-2 (e.g. "us")
  iso: string | null; // ISO-3
  flag: string | null;
  networks: NetworkDTO[];
}

export interface PriceDTO {
  wholesale: number; // what esimcard charges our reseller balance
  retail: number; // what the customer pays (markup applied)
  currency: string;
}

export interface PackageDTO {
  id: string;
  name: string;
  type: PackageType;
  scope: string | null; // local | regional | global
  data: { quantity: number; unit: string; unlimited: boolean };
  voice: { quantity: number; unit: string };
  sms: { quantity: number };
  validity: { quantity: number; unit: string };
  price: PriceDTO;
  features: {
    tether: boolean;
    throttle: boolean;
    throttleSpeed: string | null;
    connectivity: string | null; // "2G,3G,4G"
    activationType: string | null; // PDP, etc.
    activationDescription: string | null;
    apn: string | null;
    canRenew: boolean;
  };
  coverage: CountryCoverageDTO[];
  banner: string | null;
}

export interface CountryDTO {
  id: number;
  name: string;
  flag: string | null;
}

export interface ContinentDTO {
  id: number;
  name: string;
  code: string | null;
  flag: string | null;
}

export interface PaginationDTO {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

export interface PaginatedPackages {
  items: PackageDTO[];
  pagination: PaginationDTO | null;
}

// ----- eSIM / purchase domain (used later by fulfillment & dashboard) -----

export interface EsimDTO {
  id: string;
  iccid: string;
  status: string;
  lastBundle: string | null;
  totalBundles: number;
  simApplied: boolean;
  apn: string | null;
  install: {
    qrCodeText: string | null; // LPA string -> render QR ourselves
    smdpAddress: string | null;
    matchingId: string | null;
    universalLinkIos: string | null;
    universalLinkAndroid: string | null;
    pukCode: string | null;
  };
  createdAt: string | null;
}

export interface UsageDTO {
  initialQuantity: number | 'Unlimited';
  initialUnit: string;
  remainingQuantity: number | 'Unlimited';
  remainingUnit: string;
}
