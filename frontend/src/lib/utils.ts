import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatEther, parseEther } from 'viem';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatETH(wei: bigint, decimals = 4): string {
  const eth = formatEther(wei);
  const num = parseFloat(eth);
  return num.toFixed(decimals);
}

export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return format(date, 'PPp');
}

export function formatRelativeTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getTimeRemaining(deadline: bigint): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(deadline) - now;

  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  return { days, hours, minutes, isExpired: false };
}

export function formatTimeRemaining(deadline: bigint): string {
  const { days, hours, minutes, isExpired } = getTimeRemaining(deadline);

  if (isExpired) {
    return 'Expired';
  }

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

export function calculateRating(ratingSum: bigint, totalRatings: bigint): number {
  if (totalRatings === 0n) return 0;
  return Number((ratingSum * 100n) / totalRatings) / 100;
}

export function getStatusColor(status: number): string {
  const colors: Record<number, string> = {
    0: 'text-gray-400', // Created
    1: 'text-blue-400', // Funded
    2: 'text-yellow-400', // ShipmentConfirmed
    3: 'text-green-400', // Completed
    4: 'text-red-400', // InDispute
    5: 'text-gray-500', // Cancelled
    6: 'text-orange-400', // Refunded
    7: 'text-purple-400', // DisputeResolved
  };
  return colors[status] || 'text-gray-400';
}

export function getStatusBgColor(status: number): string {
  const colors: Record<number, string> = {
    0: 'bg-gray-400/10 border-gray-400/30', // Created
    1: 'bg-blue-400/10 border-blue-400/30', // Funded
    2: 'bg-yellow-400/10 border-yellow-400/30', // ShipmentConfirmed
    3: 'bg-green-400/10 border-green-400/30', // Completed
    4: 'bg-red-400/10 border-red-400/30', // InDispute
    5: 'bg-gray-500/10 border-gray-500/30', // Cancelled
    6: 'bg-orange-400/10 border-orange-400/30', // Refunded
    7: 'bg-purple-400/10 border-purple-400/30', // DisputeResolved
  };
  return colors[status] || 'bg-gray-400/10 border-gray-400/30';
}

export function validateEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateAmount(amount: string): boolean {
  try {
    const parsed = parseEther(amount);
    return parsed > 0n;
  } catch {
    return false;
  }
}
