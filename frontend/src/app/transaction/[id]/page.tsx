'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TransactionTimeline } from '@/components/escrow/TransactionTimeline';
import { TransactionActions } from '@/components/escrow/TransactionActions';
import { RatingForm } from '@/components/escrow/RatingForm';
import { useTransaction } from '@/hooks/useEscrowContract';
import {
  TransactionStatus,
  STATUS_LABELS,
  CATEGORY_LABELS,
  EscrowTransaction,
} from '@/types/contracts';
import {
  formatETH,
  formatTimestamp,
  shortenAddress,
  formatTimeRemaining,
} from '@/lib/utils';

function getStatusVariant(status: TransactionStatus) {
  const variants: Record<TransactionStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
    [TransactionStatus.Created]: 'default',
    [TransactionStatus.Funded]: 'info',
    [TransactionStatus.ShipmentConfirmed]: 'warning',
    [TransactionStatus.Completed]: 'success',
    [TransactionStatus.InDispute]: 'danger',
    [TransactionStatus.Cancelled]: 'default',
    [TransactionStatus.Refunded]: 'warning',
    [TransactionStatus.DisputeResolved]: 'purple',
  };
  return variants[status];
}

export default function TransactionDetailPage() {
  const params = useParams();
  const { address } = useAccount();
  const transactionId = BigInt(params.id as string);

  const { data: transaction, isLoading, refetch } = useTransaction(transactionId);
  const tx = transaction as EscrowTransaction | undefined;

  const isBuyer = address?.toLowerCase() === tx?.buyer.toLowerCase();
  const isSeller = address?.toLowerCase() === tx?.seller.toLowerCase();
  const isParticipant = isBuyer || isSeller;

  const canRate = tx && (
    (tx.status === TransactionStatus.Completed || tx.status === TransactionStatus.DisputeResolved) &&
    ((isBuyer && !tx.buyerRated) || (isSeller && !tx.sellerRated))
  );

  const otherParty = isBuyer ? tx?.seller : tx?.buyer;

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

  if (!tx || tx.id === 0n) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Transaction Not Found</h2>
            <p className="text-escrow-text-muted mb-6">
              This transaction does not exist or has been removed.
            </p>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">Transaction #{tx.id.toString()}</h1>
            <Badge variant={getStatusVariant(tx.status)}>
              {STATUS_LABELS[tx.status]}
            </Badge>
          </div>
          <p className="text-escrow-text-muted">
            {CATEGORY_LABELS[tx.category]} &bull; Created {formatTimestamp(tx.createdAt)}
          </p>
        </div>
        <Link href="/">
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
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <label className="text-sm text-escrow-text-muted">Description</label>
                <p className="mt-1">{tx.description}</p>
              </div>

              {/* Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-escrow-text-muted">Amount</label>
                  <p className="text-2xl font-bold mt-1">{formatETH(tx.amount)} ETH</p>
                </div>
                <div>
                  <label className="text-sm text-escrow-text-muted">Protocol Fee</label>
                  <p className="text-lg mt-1">{formatETH(tx.protocolFee)} ETH</p>
                </div>
              </div>

              {/* Participants */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-escrow-border">
                <div>
                  <label className="text-sm text-escrow-text-muted">Buyer</label>
                  <p className={`mt-1 font-mono text-sm ${isBuyer ? 'text-base-blue' : ''}`}>
                    {isBuyer ? 'You' : shortenAddress(tx.buyer)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-escrow-text-muted">Seller</label>
                  <p className={`mt-1 font-mono text-sm ${isSeller ? 'text-base-blue' : ''}`}>
                    {isSeller ? 'You' : shortenAddress(tx.seller)}
                  </p>
                </div>
              </div>

              {/* Timeouts */}
              {(tx.status === TransactionStatus.Funded || tx.status === TransactionStatus.ShipmentConfirmed) && (
                <div className="pt-4 border-t border-escrow-border">
                  {tx.status === TransactionStatus.Funded && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-escrow-text-muted">Seller must ship by:</span>
                      <span className="text-sm">{formatTimeRemaining(tx.sellerTimeout)}</span>
                    </div>
                  )}
                  {tx.status === TransactionStatus.ShipmentConfirmed && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-escrow-text-muted">Buyer must confirm by:</span>
                      <span className="text-sm">{formatTimeRemaining(tx.buyerTimeout)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTimeline transaction={tx} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {isParticipant && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionActions transaction={tx} onSuccess={() => refetch()} />
              </CardContent>
            </Card>
          )}

          {/* Rating Form */}
          {canRate && otherParty && (
            <RatingForm
              transactionId={tx.id}
              otherPartyAddress={otherParty}
              onSuccess={() => refetch()}
            />
          )}

          {/* View on Explorer */}
          <Card>
            <CardContent className="pt-6">
              <a
                href={`https://basescan.org/address/${tx.buyer}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-escrow-text-muted hover:text-white transition-colors"
              >
                View on BaseScan
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
