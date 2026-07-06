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

/** Capture attribution on first landing; keeps the earliest touch (first-touch). */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as { ts?: number };
      if (parsed.ts && Date.now() - parsed.ts < MAX_AGE_MS) return; // keep first-touch
    }
    const params = new URLSearchParams(window.location.search);
    const host = referrerHost();
    const ref = params.get('ref') ?? undefined;
    const source = params.get('utm_source') ?? host; // untagged referrals still attributed by site
    const medium = params.get('utm_medium') ?? undefined;
    const campaign = params.get('utm_campaign') ?? undefined;

    if (!ref && !source && !medium && !campaign && !host) return; // nothing to attribute
    const data = { ref, source, medium, campaign, referrer: host, ts: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — ignore
  }
}

/** Read stored attribution to attach to a checkout request. */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const { ref, source, medium, campaign, referrer } = JSON.parse(raw) as Attribution;
    return { ref, source, medium, campaign, referrer };
  } catch {
    return {};
  }
}
