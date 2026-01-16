import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Header, Footer } from '@/components/layout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://base-escrow-five.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'BaseEscrow - Secure P2P Transactions on Base',
  description: 'Decentralized escrow system for secure peer-to-peer transactions on Base. Buy and sell with confidence using community-powered dispute resolution.',
  keywords: ['escrow', 'P2P', 'Base', 'blockchain', 'secure transactions', 'cryptocurrency', 'DeFi'],
  authors: [{ name: 'BaseEscrow Team' }],
  creator: 'BaseEscrow',
  publisher: 'BaseEscrow',
  applicationName: 'BaseEscrow',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'BaseEscrow',
    title: 'BaseEscrow - Secure P2P Transactions on Base',
    description: 'Decentralized escrow system for secure peer-to-peer transactions on Base. Buy and sell with confidence using community-powered dispute resolution.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 800,
        alt: 'BaseEscrow - Secure P2P Transactions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BaseEscrow - Secure P2P Transactions on Base',
    description: 'Decentralized escrow for secure P2P transactions with community arbitration.',
    images: ['/og-image.png'],
  },
  other: {
    // Farcaster Mini App embed metadata (required for embeds)
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${APP_URL}/og-image.png`,
      button: {
        title: 'Open BaseEscrow',
        action: {
          type: 'launch_frame',
          url: APP_URL,
          name: 'BaseEscrow',
          splashImageUrl: `${APP_URL}/icons/splash-200x200.png`,
          splashBackgroundColor: '#0A0B0D'
        }
      }
    }),
    // Legacy Farcaster Frame v2 metadata
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/og-image.png`,
    'fc:frame:image:aspect_ratio': '3:2',
    'fc:frame:button:1': 'Open BaseEscrow',
    'fc:frame:button:1:action': 'launch_frame',
    'fc:frame:button:1:target': APP_URL,
    // Open Frames compatibility
    'of:version': 'vNext',
    'of:accepts:xmtp': '2024-02-01',
    'of:image': `${APP_URL}/og-image.png`,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0052FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
