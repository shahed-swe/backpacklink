'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { GA_MEASUREMENT_ID, META_PIXEL_ID } from '@/lib/analytics-config';

/**
 * Injects the Meta Pixel and (when configured) Google Analytics 4, and fires a
 * page-view on every client-side route change. The initial page-view is sent by
 * the inline init scripts; this component handles subsequent SPA navigations.
 *
 * Purchase conversions are tracked separately from the order page via
 * `trackPurchase()` in lib/analytics.ts.
 */
export function Analytics() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false; // initial view already counted by the init scripts
      return;
    }
    window.fbq?.('track', 'PageView');
    if (GA_MEASUREMENT_ID) window.gtag?.('event', 'page_view', { page_path: pathname });
  }, [pathname]);

  return (
    <>
      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* Google Analytics 4 — only when a measurement ID is configured */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
