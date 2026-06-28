// Mirrors the backend's normalized DTOs (apps/api/src/esimcard/types.ts).
// Later we'll extract these into a shared package.

export type PackageType = 'DATA-ONLY' | 'DATA-VOICE-SMS';

export interface Network {
  name: string;
  code: string | null;
  generations: string[];
}

export interface CountryCoverage {
  country: string;
  code: string | null;
  iso: string | null;
  flag: string | null;
  networks: Network[];
}

export interface Price {
  wholesale: number;
  retail: number;
  currency: string;
}

export interface Package {
  id: string;
  name: string;
  type: PackageType;
  scope: string | null;
  data: { quantity: number; unit: string; unlimited: boolean };
  voice: { quantity: number; unit: string };
  sms: { quantity: number };
  validity: { quantity: number; unit: string };
  price: Price;
  features: {
    tether: boolean;
    throttle: boolean;
    throttleSpeed: string | null;
    connectivity: string | null;
    activationType: string | null;
    activationDescription: string | null;
    apn: string | null;
    canRenew: boolean;
  };
  coverage: CountryCoverage[];
  banner: string | null;
}

export interface Country {
  id: number;
  name: string;
  flag: string | null;
}

export interface Continent {
  id: number;
  name: string;
  code: string | null;
  flag: string | null;
}
