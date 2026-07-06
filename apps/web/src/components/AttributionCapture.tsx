'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';

// Mounted once site-wide; records first-touch ref/UTM/referrer on landing.
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
