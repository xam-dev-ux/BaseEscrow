'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dispute, Vote } from '@/types/contracts';
import { shortenAddress } from '@/lib/utils';
import { useCastVote, useArbitratorVote } from '@/hooks/useArbitrationContract';
import { useAccount } from 'wagmi';

interface VotingPanelProps {
  dispute: Dispute;
  disputeId: bigint;
  onSuccess?: () => void;
}

export function VotingPanel({ dispute, disputeId, onSuccess }: VotingPanelProps) {
  const { address } = useAccount();
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);

  const { data: currentVote } = useArbitratorVote(disputeId, address);
  const { castVote, isPending, isConfirming } = useCastVote();

  const hasVoted = currentVote !== undefined && currentVote !== Vote.None;

  const handleVote = async () => {
    if (!selectedVote) {
      toast.error('Please select a vote');
      return;
    }

    try {
      await castVote(disputeId, selectedVote);
      toast.success('Vote submitted!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit vote');
    }
  };

  if (hasVoted) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-green-400">Vote Submitted</p>
            <p className="text-sm text-escrow-text-muted">
              You voted for the {currentVote === Vote.Buyer ? 'Buyer' : 'Seller'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Cast Your Vote</h3>
        <p className="text-sm text-escrow-text-muted">
          Review the evidence from both parties and cast your vote.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Vote for Buyer */}
        <button
          onClick={() => setSelectedVote(Vote.Buyer)}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedVote === Vote.Buyer
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-escrow-border hover:border-blue-500/50'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              selectedVote === Vote.Buyer ? 'bg-blue-500' : 'bg-escrow-surface-light'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-medium">Buyer</span>
            <span className="text-xs text-escrow-text-muted">
              {shortenAddress(dispute.buyer)}
            </span>
          </div>
        </button>

        {/* Vote for Seller */}
        <button
          onClick={() => setSelectedVote(Vote.Seller)}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedVote === Vote.Seller
              ? 'border-yellow-500 bg-yellow-500/10'
              : 'border-escrow-border hover:border-yellow-500/50'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              selectedVote === Vote.Seller ? 'bg-yellow-500' : 'bg-escrow-surface-light'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-medium">Seller</span>
            <span className="text-xs text-escrow-text-muted">
              {shortenAddress(dispute.seller)}
            </span>
          </div>
        </button>
      </div>

      <Button
        onClick={handleVote}
        isLoading={isPending || isConfirming}
        disabled={!selectedVote}
        className="w-full"
      >
        Submit Vote
      </Button>

      <p className="text-xs text-escrow-text-muted text-center">
        Your vote is final and cannot be changed.
      </p>
    </Card>
  );
}
