import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PowerBillPeek - US Electricity Rates & Power Bill Calculator';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#92400e', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 16 }}>PowerBillPeek</div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>US Electricity Rates &amp; Power Bill Calculator</div>
        <div style={{ fontSize: 24, opacity: 0.7, marginTop: 12 }}>Compare rates across all 50 states</div>
      </div>
    ),
    { ...size }
  );
}
