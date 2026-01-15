'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dispute, DisputeStatus, DISPUTE_STATUS_LABELS, Vote } from '@/types/contracts';
import { formatETH, formatTimeRemaining, shortenAddress } from '@/lib/utils';
import { useArbitratorVote } from '@/hooks/useArbitrationContract';
import { useAccount } from 'wagmi';

interface DisputeCardProps {
  dispute: Dispute;
  disputeId: bigint;
}

function getDisputeStatusVariant(status: DisputeStatus) {
  const variants: Record<DisputeStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
    [DisputeStatus.Pending]: 'warning',
    [DisputeStatus.Voting]: 'info',
    [DisputeStatus.Resolved]: 'success',
    [DisputeStatus.Expired]: 'default',
  };
  return variants[status];
}

export function DisputeCard({ dispute, disputeId }: DisputeCardProps) {
  const { address } = useAccount();
  const { data: myVote } = useArbitratorVote(disputeId, address);

  const hasVoted = myVote !== undefined && myVote !== Vote.None;
  const isVotingOpen = dispute.status === DisputeStatus.Voting;

  return (
    <Card className="hover:border-base-blue/50 transition-colors">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-escrow-text-muted">
                Dispute #{disputeId.toString()}
              </span>
              <Badge variant={getDisputeStatusVariant(dispute.status)}>
                {DISPUTE_STATUS_LABELS[dispute.status]}
              </Badge>
              {hasVoted && (
                <Badge variant="purple">
                  Voted
                </Badge>
              )}
            </div>
            <p className="text-sm text-escrow-text-muted">
              Transaction #{dispute.transactionId.toString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-white">
              {formatETH(dispute.amount)} ETH
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-escrow-text-muted">Buyer: </span>
            <span className="text-white">{shortenAddress(dispute.buyer)}</span>
          </div>
          <div>
            <span className="text-escrow-text-muted">Seller: </span>
            <span className="text-white">{shortenAddress(dispute.seller)}</span>
          </div>
        </div>

        {/* Voting stats */}
        {isVotingOpen && (
          <div className="flex items-center gap-4 p-3 bg-escrow-surface-light rounded-lg">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-escrow-text-muted mb-1">
                <span>Buyer Votes</span>
                <span>Seller Votes</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-escrow-border">
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
              <div className="flex justify-between text-xs mt-1">
                <span className="text-blue-400">{dispute.buyerVotes.toString()}</span>
                <span className="text-yellow-400">{dispute.sellerVotes.toString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-escrow-border">
          {isVotingOpen && (
            <span className="text-xs text-escrow-text-muted">
              {formatTimeRemaining(dispute.votingDeadline)}
            </span>
          )}
          {dispute.status === DisputeStatus.Resolved && dispute.winner && (
            <span className="text-xs text-green-400">
              Winner: {dispute.winner === dispute.buyer ? 'Buyer' : 'Seller'}
            </span>
          )}
          <Link href={`/disputes/${disputeId.toString()}`} className="ml-auto">
            <Button variant="ghost" size="sm">
              {isVotingOpen && !hasVoted ? 'Vote Now' : 'View Details'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
