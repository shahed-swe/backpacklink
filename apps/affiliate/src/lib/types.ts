export interface Program {
  open: boolean;
  commissionPercent: number;
  customerDiscountPercent: number;
  holdDays: number;
  minPayout: number;
  cookieDays: number;
  currency: string;
}

export interface Affiliate {
  id: string;
  name: string;
  email: string | null;
  handle: string | null;
  platform: string | null;
  website: string | null;
  country: string | null;
  refCode: string;
  status: 'pending' | 'approved' | 'rejected';
  active: boolean;
  commissionType: 'percent' | 'fixed' | null;
  commissionValue: number | null;
  payoutMethod: string | null;
  payoutDetails: string | null;
  link: string;
  coupon: { code: string; discountType: string; discountValue: number } | null;
}
