'use client';

import { QRCodeSVG } from 'qrcode.react';

export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div className="inline-block rounded-2xl bg-white p-4 shadow-card">
      <QRCodeSVG value={value} size={size} level="M" marginSize={2} />
    </div>
  );
}
