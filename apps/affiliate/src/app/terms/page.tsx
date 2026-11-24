'use client';

import { useApi } from '@/lib/use-api';
import type { Program } from '@/lib/types';

export default function Terms() {
  const { data } = useApi<{ data: Program }>('/api/affiliate/program');
  const p = data?.data;
  return (
    <div className="container-bp max-w-3xl py-12">
      <h1 className="font-display text-3xl font-extrabold text-ink">Affiliate terms</h1>
      <div className="mt-6 space-y-4 text-ink/70">
        <p>By joining the BackpackLink affiliate program you agree to the following:</p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>Commission is {p?.commissionPercent ?? 10}% of the amount the customer actually paid (after discounts), unless a different rate is agreed with you in writing.</li>
          <li>A sale is credited to you when the customer buys within {p?.cookieDays ?? 30} days of clicking your link, or uses your personal discount code. The most recent affiliate link clicked gets the credit.</li>
          <li>Commissions are held for {p?.holdDays ?? 14} days. Refunded, charged-back or fraudulent orders are not commissionable.</li>
          <li>Payouts are made once your payable balance reaches {p?.currency ?? 'USD'} {p?.minPayout ?? 20}, to the payout method in your profile.</li>
          <li>No commission on your own purchases. No bidding on “BackpackLink” brand keywords in paid search, no spam, no misleading claims and no coupon-site listing of your code without our permission.</li>
          <li>We may suspend an account and withhold unpaid commission for breach of these terms. We may change these terms with notice in your dashboard.</li>
        </ol>
      </div>
    </div>
  );
}
