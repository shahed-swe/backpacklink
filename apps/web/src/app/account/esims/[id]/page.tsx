'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { QrCode } from '@/components/QrCode';
import { useApi } from '@/lib/use-api';

interface Esim {
  id: string;
  iccid: string;
  status: string;
  lastBundle: string | null;
  qrCodeText: string | null;
  smdpAddress: string | null;
  matchingId: string | null;
  universalLinkIos: string | null;
  universalLinkAndroid: string | null;
  apn: string | null;
}
interface Usage {
  initialQuantity: number | string;
  initialUnit: string;
  remainingQuantity: number | string;
  remainingUnit: string;
  mock?: boolean;
}

export default function EsimDetailPage() {
  return (
    <AuthGate>
      <EsimDetail />
    </AuthGate>
  );
}

function EsimDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useApi<{ data: { esim: Esim; usage: Usage | null } }>(
    `/api/me/esims/${id}`,
  );

  if (loading) return <div className="container-bp py-24 text-center text-ink/40">Loading…</div>;
  if (!data?.data) return <div className="container-bp py-24 text-center text-ink/50">eSIM not found.</div>;

  const { esim, usage } = data.data;

  return (
    <div className="container-bp py-10">
      <Link href="/account" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Back to account
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {esim.lastBundle ?? 'Your eSIM'}
        </h1>
        <span className="chip bg-brand-50 text-brand-700">{esim.status}</span>
      </div>
      <p className="mt-1 font-mono text-xs text-ink/50">ICCID {esim.iccid}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* install */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink">Install your eSIM</h2>
          {esim.qrCodeText ? (
            <div className="mt-4 flex flex-col items-center text-center">
              <QrCode value={esim.qrCodeText} size={200} />
              <p className="mt-3 text-sm text-ink/60">
                Scan this from another device, or use one-tap install on this phone:
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {esim.universalLinkIos && (
                  <a href={esim.universalLinkIos} className="btn-dark px-4 py-2 text-xs">
                     iOS install
                  </a>
                )}
                {esim.universalLinkAndroid && (
                  <a href={esim.universalLinkAndroid} className="btn-dark px-4 py-2 text-xs">
                    🤖 Android install
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/50">Install details are being prepared…</p>
          )}

          {/* manual */}
          <details className="mt-6 rounded-2xl bg-sand-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Install manually instead
            </summary>
            <div className="mt-3 space-y-2 text-sm">
              <Manual label="SM-DP+ Address" value={esim.smdpAddress} />
              <Manual label="Activation code" value={esim.matchingId} />
              <Manual label="APN" value={esim.apn} />
            </div>
          </details>
        </div>

        {/* usage */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink">Data usage</h2>
          {usage ? (
            <UsageMeter usage={usage} />
          ) : (
            <p className="mt-4 text-sm text-ink/50">Usage isn’t available yet for this eSIM.</p>
          )}
          {usage?.mock && (
            <p className="mt-3 text-xs text-ink/40">
              (Demo usage — live data shows once a real plan is active.)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageMeter({ usage }: { usage: Usage }) {
  const unlimited = usage.remainingQuantity === 'Unlimited';
  const init = Number(usage.initialQuantity) || 0;
  const rem = Number(usage.remainingQuantity) || 0;
  const used = Math.max(0, init - rem);
  const pct = unlimited || init === 0 ? 0 : Math.min(100, (used / init) * 100);

  return (
    <div className="mt-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-ink/40">Remaining</p>
          <p className="font-display text-3xl font-extrabold text-ink">
            {unlimited ? 'Unlimited' : `${rem} ${usage.remainingUnit}`}
          </p>
        </div>
        {!unlimited && (
          <p className="text-sm text-ink/50">
            of {init} {usage.initialUnit}
          </p>
        )}
      </div>
      {!unlimited && (
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-sand-100">
          <div className="h-full rounded-full bg-lagoon" style={{ width: `${100 - pct}%` }} />
        </div>
      )}
    </div>
  );
}

function Manual({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink/50">{label}</span>
      <span className="font-mono text-xs text-ink">{value}</span>
    </div>
  );
}
