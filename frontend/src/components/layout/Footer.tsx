'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-escrow-border bg-escrow-surface/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-base-blue rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold">BaseEscrow</span>
            </div>
            <p className="text-escrow-text-muted text-sm max-w-sm">
              Secure peer-to-peer transactions on Base. Buy and sell with confidence
              using decentralized escrow and community-powered dispute resolution.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-escrow-text-muted hover:text-white text-sm transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="text-escrow-text-muted hover:text-white text-sm transition-colors"
                >
                  Create Transaction
                </Link>
              </li>
              <li>
                <Link
                  href="/arbitrator"
                  className="text-escrow-text-muted hover:text-white text-sm transition-colors"
                >
                  Become Arbitrator
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://base.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-escrow-text-muted hover:text-white text-sm transition-colors"
                >
                  Base Network
                </a>
              </li>
              <li>
                <a
                  href="https://basescan.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-escrow-text-muted hover:text-white text-sm transition-colors"
                >
                  BaseScan
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-escrow-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-escrow-text-muted text-sm">
            Built on Base. Secured by community arbitration.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-escrow-text-muted text-xs">Powered by</span>
            <svg className="h-4" viewBox="0 0 111 20" fill="none">
              <path
                d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 16.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"
                fill="#0052FF"
              />
              <path
                d="M30 4h4.8c2.98 0 4.8 1.66 4.8 4.14 0 2.48-1.82 4.14-4.8 4.14h-2.16V16H30V4zm4.62 5.88c1.32 0 2.18-.68 2.18-1.74 0-1.06-.86-1.74-2.18-1.74h-1.98v3.48h1.98zM41 4h5.08c2.56 0 4.12 1.3 4.12 3.38 0 1.5-.82 2.62-2.12 3.06L51.02 16H48.1l-2.64-5.18h-1.82V16H41V4zm4.88 4.52c1.18 0 1.9-.56 1.9-1.5s-.72-1.5-1.9-1.5h-2.24v3h2.24zM58.26 4H61l4.5 12h-2.88l-.9-2.52h-4.68L56.14 16h-2.88l4.5-12zm1.38 2.6l-1.56 4.4h3.12l-1.56-4.4zM66 4h2.64v12H66V4zM71 4h2.82l4.72 7.52V4H81v12h-2.82l-4.72-7.52V16H71V4zM83 4h8.68v2.4h-6.04v2.48h5.4v2.4h-5.4V16H83V4zM93 4h2.64v9.6h5.36V16H93V4zM102 4h8.68v2.4h-6.04v2.48h5.4v2.4h-5.4V16H102V4z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
