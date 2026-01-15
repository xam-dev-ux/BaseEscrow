'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { TransactionCardSkeleton } from '@/components/ui/Skeleton';
import { TransactionCard } from '@/components/escrow/TransactionCard';
import { useUserTransactions, useUserProfile, useTransaction, useTransactionCounter } from '@/hooks/useEscrowContract';
import { TransactionStatus, STATUS_LABELS, EscrowTransaction } from '@/types/contracts';
import { formatETH, calculateRating } from '@/lib/utils';

type FilterStatus = 'all' | 'active' | 'completed' | 'dispute';

const filterOptions = [
  { value: 'all', label: 'All Transactions' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dispute', label: 'In Dispute' },
];

function useTransactionDetails(ids: readonly bigint[] | undefined) {
  const transactions: EscrowTransaction[] = [];

  // This is a simplified approach - in production you'd use multicall
  const tx1 = useTransaction(ids?.[0] ?? 0n);
  const tx2 = useTransaction(ids?.[1] ?? 0n);
  const tx3 = useTransaction(ids?.[2] ?? 0n);
  const tx4 = useTransaction(ids?.[3] ?? 0n);
  const tx5 = useTransaction(ids?.[4] ?? 0n);
  const tx6 = useTransaction(ids?.[5] ?? 0n);
  const tx7 = useTransaction(ids?.[6] ?? 0n);
  const tx8 = useTransaction(ids?.[7] ?? 0n);
  const tx9 = useTransaction(ids?.[8] ?? 0n);
  const tx10 = useTransaction(ids?.[9] ?? 0n);

  const allTx = [tx1, tx2, tx3, tx4, tx5, tx6, tx7, tx8, tx9, tx10];

  allTx.forEach((tx, index) => {
    if (ids && index < ids.length && tx.data) {
      transactions.push(tx.data as EscrowTransaction);
    }
  });

  const isLoading = allTx.some((tx, index) => ids && index < ids.length && tx.isLoading);

  return { transactions, isLoading };
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const { data: userTxIds, isLoading: isLoadingIds } = useUserTransactions(address);
  const { data: profile } = useUserProfile(address);
  const { data: totalTransactions } = useTransactionCounter();

  // Get the last 10 transaction IDs (most recent first)
  const recentIds = useMemo(() => {
    if (!userTxIds) return [];
    return [...userTxIds].reverse().slice(0, 10);
  }, [userTxIds]);

  const { transactions, isLoading: isLoadingTx } = useTransactionDetails(recentIds);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filter === 'all') return true;
      if (filter === 'active') {
        return [
          TransactionStatus.Funded,
          TransactionStatus.ShipmentConfirmed,
        ].includes(tx.status);
      }
      if (filter === 'completed') {
        return [
          TransactionStatus.Completed,
          TransactionStatus.DisputeResolved,
        ].includes(tx.status);
      }
      if (filter === 'dispute') {
        return tx.status === TransactionStatus.InDispute;
      }
      return true;
    });
  }, [transactions, filter]);

  const averageRating = profile
    ? calculateRating(profile.ratingSum, profile.totalRatingsReceived)
    : 0;

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-20 h-20 bg-base-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-base-blue"
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
          <h1 className="text-4xl font-bold mb-4">
            Secure <span className="gradient-text">P2P Transactions</span>
          </h1>
          <p className="text-escrow-text-muted text-lg max-w-2xl mx-auto mb-8">
            BaseEscrow provides a decentralized escrow system for secure peer-to-peer
            transactions on Base. Buy and sell with confidence using community-powered
            dispute resolution.
          </p>
          <ConnectButton />

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Secure Escrow</h3>
                <p className="text-sm text-escrow-text-muted">
                  Funds are held securely until both parties confirm the transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Community Arbitration</h3>
                <p className="text-sm text-escrow-text-muted">
                  Disputes are resolved by trusted community arbitrators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Reputation System</h3>
                <p className="text-sm text-escrow-text-muted">
                  Build trust through transparent ratings and reviews
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-escrow-text-muted">
            Manage your escrow transactions
          </p>
        </div>
        <Link href="/create">
          <Button size="lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Transaction
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-escrow-text-muted mb-1">As Buyer</p>
            <p className="text-2xl font-bold">
              {profile?.totalTransactionsAsBuyer.toString() ?? '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-escrow-text-muted mb-1">As Seller</p>
            <p className="text-2xl font-bold">
              {profile?.totalTransactionsAsSeller.toString() ?? '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-escrow-text-muted mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-400">
              {profile?.completedTransactions.toString() ?? '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-escrow-text-muted mb-1">Rating</p>
            <p className="text-2xl font-bold text-yellow-400">
              {averageRating.toFixed(1)}/5
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Your Transactions</CardTitle>
            <Select
              options={filterOptions}
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterStatus)}
              className="w-full sm:w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingIds || isLoadingTx ? (
            <div className="space-y-4">
              <TransactionCardSkeleton />
              <TransactionCardSkeleton />
              <TransactionCardSkeleton />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-escrow-surface-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-escrow-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-escrow-text-muted mb-4">
                {filter === 'all'
                  ? "You don't have any transactions yet"
                  : `No ${filter} transactions found`}
              </p>
              {filter === 'all' && (
                <Link href="/create">
                  <Button>Create Your First Transaction</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((tx) => (
                <TransactionCard key={tx.id.toString()} transaction={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
