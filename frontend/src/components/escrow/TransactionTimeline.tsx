'use client';

import { cn } from '@/lib/utils';
import { EscrowTransaction, TransactionStatus } from '@/types/contracts';
import { formatTimestamp } from '@/lib/utils';

interface TransactionTimelineProps {
  transaction: EscrowTransaction;
}

interface TimelineStep {
  label: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  timestamp?: bigint;
}

export function TransactionTimeline({ transaction }: TransactionTimelineProps) {
  const getSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = [];
    const status = transaction.status;

    // Created/Funded
    steps.push({
      label: 'Transaction Created & Funded',
      status: 'completed',
      timestamp: transaction.fundedAt,
    });

    // Shipment
    if (status === TransactionStatus.Cancelled) {
      steps.push({
        label: 'Transaction Cancelled',
        status: 'error',
      });
      return steps;
    }

    if (status === TransactionStatus.Refunded) {
      steps.push({
        label: 'Refund Issued',
        status: 'error',
      });
      return steps;
    }

    const shipmentCompleted = [
      TransactionStatus.ShipmentConfirmed,
      TransactionStatus.Completed,
      TransactionStatus.InDispute,
      TransactionStatus.DisputeResolved,
    ].includes(status);

    steps.push({
      label: 'Shipment Confirmed',
      status: shipmentCompleted ? 'completed' : status === TransactionStatus.Funded ? 'current' : 'pending',
      timestamp: shipmentCompleted ? transaction.shipmentConfirmedAt : undefined,
    });

    // Dispute path
    if (status === TransactionStatus.InDispute) {
      steps.push({
        label: 'Dispute Initiated',
        status: 'error',
      });
      steps.push({
        label: 'Awaiting Resolution',
        status: 'current',
      });
      return steps;
    }

    if (status === TransactionStatus.DisputeResolved) {
      steps.push({
        label: 'Dispute Resolved',
        status: 'completed',
        timestamp: transaction.completedAt,
      });
      return steps;
    }

    // Normal completion path
    steps.push({
      label: 'Receipt Confirmed',
      status: status === TransactionStatus.Completed
        ? 'completed'
        : status === TransactionStatus.ShipmentConfirmed
          ? 'current'
          : 'pending',
      timestamp: status === TransactionStatus.Completed ? transaction.completedAt : undefined,
    });

    steps.push({
      label: 'Funds Released',
      status: status === TransactionStatus.Completed ? 'completed' : 'pending',
    });

    return steps;
  };

  const steps = getSteps();

  return (
    <div className="relative">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4 pb-6 last:pb-0">
          {/* Line connector */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2',
                step.status === 'completed' && 'bg-green-500 border-green-500',
                step.status === 'current' && 'bg-blue-500 border-blue-500',
                step.status === 'pending' && 'bg-transparent border-escrow-border',
                step.status === 'error' && 'bg-red-500 border-red-500'
              )}
            >
              {step.status === 'completed' && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {step.status === 'current' && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
              {step.status === 'error' && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-0.5 flex-1 mt-2',
                  step.status === 'completed' ? 'bg-green-500' : 'bg-escrow-border'
                )}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <p
              className={cn(
                'font-medium',
                step.status === 'completed' && 'text-green-400',
                step.status === 'current' && 'text-blue-400',
                step.status === 'pending' && 'text-escrow-text-muted',
                step.status === 'error' && 'text-red-400'
              )}
            >
              {step.label}
            </p>
            {step.timestamp && step.timestamp > 0n && (
              <p className="text-xs text-escrow-text-muted mt-0.5">
                {formatTimestamp(step.timestamp)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
