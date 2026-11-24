// First-touch attribution capture (client-side). On the first landing that
// carries a ref/UTM/referrer, we persist it for 30 days and attach it to the
// checkout request so sales can be traced to an influencer or a traffic source.

const KEY = 'bpl_attribution';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface Attribution {
  ref?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}

function referrerHost(): string | undefined {
  try {
    return document.referrer ? new URL(document.referrer).hostname : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Capture attribution on landing. UTM/referrer are first-touch (kept 30 days),
 * but an affiliate ?ref= link always wins (last affiliate click gets the
 * credit — the standard affiliate model) and is reported as a click.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const host = referrerHost();
    const ref = params.get('ref')?.trim() || undefined;

    if (ref) {
      const prev = readRaw();
      const data = {
        ...(prev ?? {}),
        ref,
        source: params.get('utm_source') ?? prev?.source ?? 'affiliate',
        medium: params.get('utm_medium') ?? prev?.medium ?? 'affiliate',
        campaign: params.get('utm_campaign') ?? prev?.campaign,
        referrer: host ?? prev?.referrer,
        ts: Date.now(),
      };
      window.localStorage.setItem(KEY, JSON.stringify(data));
      reportClick(ref, host);
      return;
    }

    const existing = readRaw();
    if (existing?.ts && Date.now() - existing.ts < MAX_AGE_MS) return; // keep first-touch
    const source = params.get('utm_source') ?? host; // untagged referrals still attributed by site
    const medium = params.get('utm_medium') ?? undefined;
    const campaign = params.get('utm_campaign') ?? undefined;

    if (!source && !medium && !campaign && !host) return; // nothing to attribute
    const data = { source, medium, campaign, referrer: host, ts: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — ignore
  }
}

function readRaw(): (Attribution & { ts?: number }) | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution & { ts?: number };
    // Expired attribution must not keep crediting an old ref.
    if (!parsed.ts || Date.now() - parsed.ts > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Count one click per ref per visitor per day (keeps affiliate stats honest).
function reportClick(ref: string, referrer?: string) {
  try {
    const dayKey = `bpl_click_${ref.toUpperCase()}_${new Date().toISOString().slice(0, 10)}`;
    if (window.localStorage.getItem(dayKey)) return;
    window.localStorage.setItem(dayKey, '1');
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    void fetch(`${base}/api/affiliate/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, path: window.location.pathname, referrer }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

/** Read stored attribution to attach to a checkout request. */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = readRaw();
    if (!parsed) return {};
    const { ref, source, medium, campaign, referrer } = parsed;
    return { ref, source, medium, campaign, referrer };
  } catch {
    return {};
  }
}
