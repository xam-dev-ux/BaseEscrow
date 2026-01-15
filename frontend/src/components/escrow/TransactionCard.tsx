'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  EscrowTransaction,
  TransactionStatus,
  STATUS_LABELS,
  CATEGORY_LABELS
} from '@/types/contracts';
import { formatETH, formatRelativeTime, shortenAddress, getStatusColor } from '@/lib/utils';
import { useAccount } from 'wagmi';

interface TransactionCardProps {
  transaction: EscrowTransaction;
  compact?: boolean;
}

function getStatusBadgeVariant(status: TransactionStatus) {
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

export function TransactionCard({ transaction, compact = false }: TransactionCardProps) {
  const { address } = useAccount();
  const isBuyer = address?.toLowerCase() === transaction.buyer.toLowerCase();
  const isSeller = address?.toLowerCase() === transaction.seller.toLowerCase();
  const role = isBuyer ? 'Buyer' : isSeller ? 'Seller' : 'Viewer';

  return (
    <Card className="hover:border-base-blue/50 transition-colors">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-escrow-text-muted">
                #{transaction.id.toString()}
              </span>
              <Badge variant={getStatusBadgeVariant(transaction.status)}>
                {STATUS_LABELS[transaction.status]}
              </Badge>
            </div>
            <p className={`text-white ${compact ? 'text-sm truncate' : 'text-base'}`}>
              {transaction.description}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-white">
              {formatETH(transaction.amount)} ETH
            </p>
            <p className="text-xs text-escrow-text-muted">
              {CATEGORY_LABELS[transaction.category]}
            </p>
          </div>
        </div>

        {/* Participants */}
        {!compact && (
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-escrow-text-muted">Buyer: </span>
              <span className={isBuyer ? 'text-base-blue font-medium' : 'text-white'}>
                {isBuyer ? 'You' : shortenAddress(transaction.buyer)}
              </span>
            </div>
            <div>
              <span className="text-escrow-text-muted">Seller: </span>
              <span className={isSeller ? 'text-base-blue font-medium' : 'text-white'}>
                {isSeller ? 'You' : shortenAddress(transaction.seller)}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-escrow-border">
          <span className="text-xs text-escrow-text-muted">
            {formatRelativeTime(transaction.createdAt)}
          </span>
          <Link href={`/transaction/${transaction.id.toString()}`}>
            <Button variant="ghost" size="sm">
              View Details
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
