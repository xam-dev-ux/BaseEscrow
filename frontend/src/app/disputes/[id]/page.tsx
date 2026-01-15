'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { VotingPanel } from '@/components/arbitration/VotingPanel';
import {
  useDispute,
  useDisputeArbitrators,
  useIsAssignedArbitrator,
} from '@/hooks/useArbitrationContract';
import {
  DisputeStatus,
  DISPUTE_STATUS_LABELS,
  Dispute,
} from '@/types/contracts';
import {
  formatETH,
  formatTimeRemaining,
  shortenAddress,
} from '@/lib/utils';

function getStatusVariant(status: DisputeStatus) {
  const variants: Record<DisputeStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
    [DisputeStatus.Pending]: 'warning',
    [DisputeStatus.Voting]: 'info',
    [DisputeStatus.Resolved]: 'success',
    [DisputeStatus.Expired]: 'default',
  };
  return variants[status];
}

export default function DisputeDetailPage() {
  const params = useParams();
  const { address } = useAccount();
  const disputeId = BigInt(params.id as string);

  const { data: disputeData, isLoading, refetch } = useDispute(disputeId);
  const { data: arbitrators } = useDisputeArbitrators(disputeId);
  const { data: isAssigned } = useIsAssignedArbitrator(disputeId, address);

  const dispute: Dispute | undefined = disputeData ? {
    transactionId: disputeData[0],
    buyer: disputeData[1],
    seller: disputeData[2],
    amount: disputeData[3],
    buyerEvidence: disputeData[4],
    sellerEvidence: disputeData[5],
    status: disputeData[6],
    buyerVotes: disputeData[7],
    sellerVotes: disputeData[8],
    votingDeadline: disputeData[9],
    winner: disputeData[10],
  } : undefined;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!dispute || dispute.transactionId === 0n) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Dispute Not Found</h2>
            <p className="text-escrow-text-muted mb-6">
              This dispute does not exist.
            </p>
            <Link href="/disputes">
              <Button>Back to Disputes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isVotingOpen = dispute.status === DisputeStatus.Voting;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">Dispute #{disputeId.toString()}</h1>
            <Badge variant={getStatusVariant(dispute.status)}>
              {DISPUTE_STATUS_LABELS[dispute.status]}
            </Badge>
          </div>
          <p className="text-escrow-text-muted">
            Transaction #{dispute.transactionId.toString()}
          </p>
        </div>
        <Link href="/disputes">
          <Button variant="secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Info */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Amount */}
              <div>
                <label className="text-sm text-escrow-text-muted">Amount in Dispute</label>
                <p className="text-2xl font-bold mt-1">{formatETH(dispute.amount)} ETH</p>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-escrow-border">
                <div>
                  <label className="text-sm text-escrow-text-muted">Buyer</label>
                  <p className="mt-1 font-mono text-sm">{shortenAddress(dispute.buyer)}</p>
                </div>
                <div>
                  <label className="text-sm text-escrow-text-muted">Seller</label>
                  <p className="mt-1 font-mono text-sm">{shortenAddress(dispute.seller)}</p>
                </div>
              </div>

              {/* Voting Progress */}
              {isVotingOpen && (
                <div className="pt-4 border-t border-escrow-border">
                  <label className="text-sm text-escrow-text-muted mb-2 block">Voting Progress</label>
                  <div className="flex items-center gap-4 p-4 bg-escrow-surface-light rounded-lg">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-escrow-text-muted mb-1">
                        <span>Buyer ({dispute.buyerVotes.toString()})</span>
                        <span>Seller ({dispute.sellerVotes.toString()})</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-escrow-border">
                        <div
                          className="bg-blue-500 transition-all"
                          style={{
                            width: `${
                              dispute.buyerVotes + dispute.sellerVotes > 0n
                                ? Number((dispute.buyerVotes * 100n) / (dispute.buyerVotes + dispute.sellerVotes))
                                : 50
                            }%`,
                          }}
                        />
                        <div className="bg-yellow-500 flex-1" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-escrow-text-muted mt-2 text-center">
                    {formatTimeRemaining(dispute.votingDeadline)}
                  </p>
                </div>
              )}

              {/* Result */}
              {dispute.status === DisputeStatus.Resolved && dispute.winner !== '0x0000000000000000000000000000000000000000' && (
                <div className="pt-4 border-t border-escrow-border">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 font-medium">
                      Winner: {dispute.winner === dispute.buyer ? 'Buyer' : 'Seller'}
                    </p>
                    <p className="text-sm text-escrow-text-muted mt-1">
                      Funds have been transferred to {shortenAddress(dispute.winner)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buyer Evidence */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="font-medium">Buyer&apos;s Evidence</span>
                </div>
                <div className="p-4 bg-escrow-surface-light rounded-lg">
                  {dispute.buyerEvidence ? (
                    <p className="text-sm whitespace-pre-wrap">{dispute.buyerEvidence}</p>
                  ) : (
                    <p className="text-sm text-escrow-text-muted italic">No evidence submitted</p>
                  )}
                </div>
              </div>

              {/* Seller Evidence */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="font-medium">Seller&apos;s Evidence</span>
                </div>
                <div className="p-4 bg-escrow-surface-light rounded-lg">
                  {dispute.sellerEvidence ? (
                    <p className="text-sm whitespace-pre-wrap">{dispute.sellerEvidence}</p>
                  ) : (
                    <p className="text-sm text-escrow-text-muted italic">No evidence submitted</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Voting Panel */}
          {isAssigned && isVotingOpen && (
            <VotingPanel
              dispute={dispute}
              disputeId={disputeId}
              onSuccess={() => refetch()}
            />
          )}

          {/* Arbitrators */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Arbitrators</CardTitle>
            </CardHeader>
            <CardContent>
              {arbitrators && arbitrators.length > 0 ? (
                <div className="space-y-2">
                  {arbitrators.map((arb, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        arb.toLowerCase() === address?.toLowerCase()
                          ? 'bg-base-blue/10 border border-base-blue/30'
                          : 'bg-escrow-surface-light'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-escrow-border flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="font-mono text-sm">
                        {arb.toLowerCase() === address?.toLowerCase()
                          ? 'You'
                          : shortenAddress(arb)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-escrow-text-muted">
                  No arbitrators assigned yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Link to Transaction */}
          <Card>
            <CardContent className="pt-6">
              <Link
                href={`/transaction/${dispute.transactionId.toString()}`}
                className="flex items-center justify-center gap-2 text-sm text-escrow-text-muted hover:text-white transition-colors"
              >
                View Original Transaction
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
