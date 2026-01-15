'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { useUserProfile, useUserRatings, useAverageRating } from '@/hooks/useEscrowContract';
import { useArbitrator } from '@/hooks/useArbitrationContract';
import { shortenAddress, formatETH, formatRelativeTime, calculateRating } from '@/lib/utils';
import { Rating } from '@/types/contracts';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  const { data: profile, isLoading: isLoadingProfile } = useUserProfile(address);
  const { data: ratings, isLoading: isLoadingRatings } = useUserRatings(address);
  const { data: averageRating } = useAverageRating(address);
  const { data: arbitrator } = useArbitrator(address);

  const avgRating = averageRating ? Number(averageRating) / 100 : 0;

  const sortedRatings = useMemo(() => {
    if (!ratings) return [];
    return [...ratings].sort((a, b) => Number(b.timestamp - a.timestamp));
  }, [ratings]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-base-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-base-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-escrow-text-muted mb-6">
              Connect your wallet to view your profile
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingProfile || isLoadingRatings) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileSkeleton />
      </div>
    );
  }

  const totalTransactions = profile
    ? Number(profile.totalTransactionsAsBuyer + profile.totalTransactionsAsSeller)
    : 0;

  const completionRate = totalTransactions > 0 && profile
    ? Math.round((Number(profile.completedTransactions) / totalTransactions) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-base-blue to-purple-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {address?.slice(2, 4).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold font-mono">
                  {shortenAddress(address || '', 6)}
                </h1>
                {arbitrator?.isActive && (
                  <Badge variant="purple">Arbitrator</Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} size="sm" />
                  <span className="text-sm text-escrow-text-muted">
                    ({profile?.totalRatingsReceived.toString() || '0'} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Copy Address */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(address || '');
              }}
              className="text-escrow-text-muted hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{totalTransactions}</p>
            <p className="text-sm text-escrow-text-muted">Total Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {profile?.completedTransactions.toString() || '0'}
            </p>
            <p className="text-sm text-escrow-text-muted">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{avgRating.toFixed(1)}</p>
            <p className="text-sm text-escrow-text-muted">Avg Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{completionRate}%</p>
            <p className="text-sm text-escrow-text-muted">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-escrow-surface-light rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span>As Buyer</span>
              </div>
              <span className="text-xl font-semibold">
                {profile?.totalTransactionsAsBuyer.toString() || '0'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-escrow-surface-light rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span>As Seller</span>
              </div>
              <span className="text-xl font-semibold">
                {profile?.totalTransactionsAsSeller.toString() || '0'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-escrow-surface-light rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span>Disputed</span>
              </div>
              <span className="text-xl font-semibold text-red-400">
                {profile?.disputedTransactions.toString() || '0'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Arbitrator Stats (if applicable) */}
        {arbitrator?.isActive && (
          <Card>
            <CardHeader>
              <CardTitle>Arbitrator Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-escrow-surface-light rounded-lg">
                <span className="text-escrow-text-muted">Staked</span>
                <span className="font-semibold">{formatETH(arbitrator.stakedAmount)} ETH</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-escrow-surface-light rounded-lg">
                <span className="text-escrow-text-muted">Cases Assigned</span>
                <span className="font-semibold">{arbitrator.totalCasesAssigned.toString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-escrow-surface-light rounded-lg">
                <span className="text-escrow-text-muted">Cases Voted</span>
                <span className="font-semibold text-green-400">{arbitrator.totalCasesVoted.toString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-escrow-surface-light rounded-lg">
                <span className="text-escrow-text-muted">Reputation</span>
                <span className="font-semibold text-yellow-400">{arbitrator.reputation.toString()}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <Card className={arbitrator?.isActive ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedRatings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-escrow-surface-light rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-escrow-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-escrow-text-muted">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedRatings.slice(0, 5).map((rating, index) => (
                  <div
                    key={index}
                    className="p-4 bg-escrow-surface-light rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <StarRating rating={rating.score} size="sm" />
                      <span className="text-xs text-escrow-text-muted">
                        {formatRelativeTime(rating.timestamp)}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-escrow-text-muted">
                        {rating.comment}
                      </p>
                    )}
                    <p className="text-xs text-escrow-text-muted mt-2">
                      Transaction #{rating.transactionId.toString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
