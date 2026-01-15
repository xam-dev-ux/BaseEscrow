'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { DisputeCard } from '@/components/arbitration/DisputeCard';
import { useArbitratorDisputes, useDispute, useArbitrator } from '@/hooks/useArbitrationContract';
import { DisputeStatus, Dispute } from '@/types/contracts';

const filterOptions = [
  { value: 'all', label: 'All Disputes' },
  { value: 'voting', label: 'Awaiting Vote' },
  { value: 'resolved', label: 'Resolved' },
];

function useDisputeDetails(ids: readonly bigint[] | undefined) {
  const disputes: { dispute: Dispute; id: bigint }[] = [];

  const d1 = useDispute(ids?.[0] ?? 0n);
  const d2 = useDispute(ids?.[1] ?? 0n);
  const d3 = useDispute(ids?.[2] ?? 0n);
  const d4 = useDispute(ids?.[3] ?? 0n);
  const d5 = useDispute(ids?.[4] ?? 0n);

  const allDisputes = [d1, d2, d3, d4, d5];

  allDisputes.forEach((d, index) => {
    if (ids && index < ids.length && d.data) {
      disputes.push({
        dispute: {
          transactionId: d.data[0],
          buyer: d.data[1],
          seller: d.data[2],
          amount: d.data[3],
          buyerEvidence: d.data[4],
          sellerEvidence: d.data[5],
          status: d.data[6],
          buyerVotes: d.data[7],
          sellerVotes: d.data[8],
          votingDeadline: d.data[9],
          winner: d.data[10],
        } as Dispute,
        id: ids[index],
      });
    }
  });

  const isLoading = allDisputes.some((d, index) => ids && index < ids.length && d.isLoading);

  return { disputes, isLoading };
}

export default function DisputesPage() {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState('all');

  const { data: arbitrator } = useArbitrator(address);
  const { data: disputeIds, isLoading: isLoadingIds } = useArbitratorDisputes(address);

  const { disputes, isLoading: isLoadingDisputes } = useDisputeDetails(disputeIds);

  const filteredDisputes = useMemo(() => {
    return disputes.filter(({ dispute }) => {
      if (filter === 'all') return true;
      if (filter === 'voting') return dispute.status === DisputeStatus.Voting;
      if (filter === 'resolved') {
        return dispute.status === DisputeStatus.Resolved || dispute.status === DisputeStatus.Expired;
      }
      return true;
    });
  }, [disputes, filter]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-base-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-base-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-escrow-text-muted mb-6">
              Connect your wallet to view your assigned disputes
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!arbitrator?.isActive) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Not an Arbitrator</h2>
            <p className="text-escrow-text-muted mb-6">
              You need to register as an arbitrator to view and vote on disputes.
            </p>
            <a href="/arbitrator" className="inline-block">
              <button className="btn btn-primary">
                Become an Arbitrator
              </button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Disputes</h1>
          <p className="text-escrow-text-muted">
            Review and vote on assigned disputes
          </p>
        </div>
        <Select
          options={filterOptions}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">
              {arbitrator?.totalCasesAssigned.toString() ?? '0'}
            </p>
            <p className="text-sm text-escrow-text-muted">Assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {arbitrator?.totalCasesVoted.toString() ?? '0'}
            </p>
            <p className="text-sm text-escrow-text-muted">Voted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {arbitrator?.reputation.toString() ?? '100'}
            </p>
            <p className="text-sm text-escrow-text-muted">Reputation</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputes List */}
      <Card>
        <CardHeader>
          <CardTitle>Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingIds || isLoadingDisputes ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-escrow-surface-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-escrow-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-escrow-text-muted">
                {filter === 'all'
                  ? 'No disputes assigned yet'
                  : `No ${filter} disputes found`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDisputes.map(({ dispute, id }) => (
                <DisputeCard
                  key={id.toString()}
                  dispute={dispute}
                  disputeId={id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
