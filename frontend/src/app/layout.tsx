import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Header, Footer } from '@/components/layout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://baseescrow.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'BaseEscrow - Secure P2P Transactions on Base',
  description: 'Decentralized escrow system for secure peer-to-peer transactions on Base. Buy and sell with confidence using community-powered dispute resolution.',
  keywords: ['escrow', 'P2P', 'Base', 'blockchain', 'secure transactions', 'cryptocurrency', 'DeFi'],
  authors: [{ name: 'BaseEscrow Team' }],
  creator: 'BaseEscrow',
  publisher: 'BaseEscrow',
  applicationName: 'BaseEscrow',
  manifest: '/manifest.json',
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
        height: 630,
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
    'fc:frame': 'vNext',
    'fc:frame:image': `${APP_URL}/og-image.png`,
    'fc:frame:button:1': 'Open App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': APP_URL,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content={`${APP_URL}/og-image.png`} />
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
