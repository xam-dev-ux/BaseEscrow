'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { EscrowTransaction, TransactionStatus } from '@/types/contracts';
import { getTimeRemaining } from '@/lib/utils';
import {
  useConfirmShipment,
  useConfirmReceipt,
  useCancelTransaction,
  useInitiateDispute,
  useClaimAfterBuyerTimeout,
  useClaimAfterSellerTimeout,
} from '@/hooks/useEscrowContract';

interface TransactionActionsProps {
  transaction: EscrowTransaction;
  onSuccess?: () => void;
}

export function TransactionActions({ transaction, onSuccess }: TransactionActionsProps) {
  const { address } = useAccount();
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const isBuyer = address?.toLowerCase() === transaction.buyer.toLowerCase();
  const isSeller = address?.toLowerCase() === transaction.seller.toLowerCase();

  const { confirmShipment, isPending: isConfirmingShipment } = useConfirmShipment();
  const { confirmReceipt, isPending: isConfirmingReceipt } = useConfirmReceipt();
  const { cancelTransaction, isPending: isCancelling } = useCancelTransaction();
  const { initiateDispute, isPending: isInitiatingDispute } = useInitiateDispute();
  const { claimAfterBuyerTimeout, isPending: isClaimingBuyerTimeout } = useClaimAfterBuyerTimeout();
  const { claimAfterSellerTimeout, isPending: isClaimingSellerTimeout } = useClaimAfterSellerTimeout();

  const buyerTimeout = getTimeRemaining(transaction.buyerTimeout);
  const sellerTimeout = getTimeRemaining(transaction.sellerTimeout);

  const handleConfirmShipment = async () => {
    try {
      await confirmShipment(transaction.id);
      toast.success('Shipment confirmed!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to confirm shipment');
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      await confirmReceipt(transaction.id);
      toast.success('Receipt confirmed! Funds released to seller.');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to confirm receipt');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelTransaction(transaction.id);
      toast.success('Transaction cancelled');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to cancel transaction');
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }
    try {
      await initiateDispute(transaction.id, disputeReason);
      toast.success('Dispute initiated');
      setShowDisputeForm(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to initiate dispute');
    }
  };

  const handleClaimBuyerTimeout = async () => {
    try {
      await claimAfterBuyerTimeout(transaction.id);
      toast.success('Funds claimed successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to claim funds');
    }
  };

  const handleClaimSellerTimeout = async () => {
    try {
      await claimAfterSellerTimeout(transaction.id);
      toast.success('Refund claimed successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to claim refund');
    }
  };

  // Funded status - Seller can confirm shipment, Buyer can cancel
  if (transaction.status === TransactionStatus.Funded) {
    return (
      <div className="space-y-4">
        {isSeller && (
          <div className="space-y-2">
            <Button
              onClick={handleConfirmShipment}
              isLoading={isConfirmingShipment}
              className="w-full"
            >
              Confirm Shipment
            </Button>
            {!sellerTimeout.isExpired && (
              <p className="text-xs text-escrow-text-muted text-center">
                You have {sellerTimeout.days}d {sellerTimeout.hours}h to ship
              </p>
            )}
          </div>
        )}

        {isBuyer && (
          <div className="space-y-2">
            <p className="text-sm text-escrow-text-muted">
              Waiting for seller to confirm shipment...
            </p>
            {sellerTimeout.isExpired && (
              <Button
                onClick={handleClaimSellerTimeout}
                isLoading={isClaimingSellerTimeout}
                variant="success"
                className="w-full"
              >
                Claim Refund (Seller Timeout)
              </Button>
            )}
          </div>
        )}

        {(isBuyer || isSeller) && (
          <Button
            onClick={handleCancel}
            isLoading={isCancelling}
            variant="secondary"
            className="w-full"
          >
            Cancel Transaction
          </Button>
        )}
      </div>
    );
  }

  // ShipmentConfirmed status - Buyer can confirm receipt or dispute
  if (transaction.status === TransactionStatus.ShipmentConfirmed) {
    return (
      <div className="space-y-4">
        {isBuyer && (
          <>
            <Button
              onClick={handleConfirmReceipt}
              isLoading={isConfirmingReceipt}
              variant="success"
              className="w-full"
            >
              Confirm Receipt & Release Funds
            </Button>
            <p className="text-xs text-escrow-text-muted text-center">
              {!buyerTimeout.isExpired
                ? `Confirm within ${buyerTimeout.days}d ${buyerTimeout.hours}h`
                : 'Timeout expired - seller can claim funds'}
            </p>
          </>
        )}

        {isSeller && (
          <div className="space-y-2">
            <p className="text-sm text-escrow-text-muted">
              Waiting for buyer to confirm receipt...
            </p>
            {buyerTimeout.isExpired && (
              <Button
                onClick={handleClaimBuyerTimeout}
                isLoading={isClaimingBuyerTimeout}
                variant="success"
                className="w-full"
              >
                Claim Funds (Buyer Timeout)
              </Button>
            )}
          </div>
        )}

        {(isBuyer || isSeller) && !showDisputeForm && (
          <Button
            onClick={() => setShowDisputeForm(true)}
            variant="danger"
            className="w-full"
          >
            Open Dispute
          </Button>
        )}

        {showDisputeForm && (
          <div className="space-y-3 p-4 bg-escrow-surface-light rounded-lg border border-escrow-border">
            <h4 className="font-medium">Initiate Dispute</h4>
            <TextArea
              placeholder="Describe the issue in detail..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleDispute}
                isLoading={isInitiatingDispute}
                variant="danger"
                className="flex-1"
              >
                Submit Dispute
              </Button>
              <Button
                onClick={() => setShowDisputeForm(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Completed or resolved - Show rating option
  if (
    transaction.status === TransactionStatus.Completed ||
    transaction.status === TransactionStatus.DisputeResolved
  ) {
    const canRate =
      (isBuyer && !transaction.buyerRated) ||
      (isSeller && !transaction.sellerRated);

    if (canRate) {
      return (
        <p className="text-sm text-escrow-text-muted">
          Don&apos;t forget to rate the other party!
        </p>
      );
    }

    return (
      <p className="text-sm text-green-400">
        Transaction completed successfully
      </p>
    );
  }

  // InDispute status
  if (transaction.status === TransactionStatus.InDispute) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400">
          This transaction is under dispute. Community arbitrators will review the case.
        </p>
      </div>
    );
  }

  return null;
}
