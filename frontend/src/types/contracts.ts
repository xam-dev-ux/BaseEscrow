export enum TransactionStatus {
  Created = 0,
  Funded = 1,
  ShipmentConfirmed = 2,
  Completed = 3,
  InDispute = 4,
  Cancelled = 5,
  Refunded = 6,
  DisputeResolved = 7,
}

export enum Category {
  SecondHand = 0,
  Freelancing = 1,
  Services = 2,
  Digital = 3,
  Other = 4,
}

export enum DisputeStatus {
  Pending = 0,
  Voting = 1,
  Resolved = 2,
  Expired = 3,
}

export enum Vote {
  None = 0,
  Buyer = 1,
  Seller = 2,
}

export interface EscrowTransaction {
  id: bigint;
  buyer: `0x${string}`;
  seller: `0x${string}`;
  amount: bigint;
  protocolFee: bigint;
  description: string;
  category: Category;
  status: TransactionStatus;
  createdAt: bigint;
  fundedAt: bigint;
  shipmentConfirmedAt: bigint;
  completedAt: bigint;
  buyerTimeout: bigint;
  sellerTimeout: bigint;
  buyerRated: boolean;
  sellerRated: boolean;
}

export interface Rating {
  score: number;
  comment: string;
  timestamp: bigint;
  transactionId: bigint;
}

export interface UserProfile {
  totalTransactionsAsBuyer: bigint;
  totalTransactionsAsSeller: bigint;
  completedTransactions: bigint;
  disputedTransactions: bigint;
  totalRatingsReceived: bigint;
  ratingSum: bigint;
  exists: boolean;
}

export interface Arbitrator {
  arbitratorAddress: `0x${string}`;
  stakedAmount: bigint;
  totalCasesAssigned: bigint;
  totalCasesVoted: bigint;
  correctVotes: bigint;
  reputation: bigint;
  isActive: boolean;
  registeredAt: bigint;
  lastActiveAt: bigint;
}

export interface Dispute {
  transactionId: bigint;
  buyer: `0x${string}`;
  seller: `0x${string}`;
  amount: bigint;
  buyerEvidence: string;
  sellerEvidence: string;
  status: DisputeStatus;
  buyerVotes: bigint;
  sellerVotes: bigint;
  votingDeadline: bigint;
  winner: `0x${string}`;
}

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.Created]: 'Created',
  [TransactionStatus.Funded]: 'Funded',
  [TransactionStatus.ShipmentConfirmed]: 'Shipped',
  [TransactionStatus.Completed]: 'Completed',
  [TransactionStatus.InDispute]: 'In Dispute',
  [TransactionStatus.Cancelled]: 'Cancelled',
  [TransactionStatus.Refunded]: 'Refunded',
  [TransactionStatus.DisputeResolved]: 'Dispute Resolved',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.SecondHand]: 'Second Hand',
  [Category.Freelancing]: 'Freelancing',
  [Category.Services]: 'Services',
  [Category.Digital]: 'Digital',
  [Category.Other]: 'Other',
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  [DisputeStatus.Pending]: 'Pending',
  [DisputeStatus.Voting]: 'Voting',
  [DisputeStatus.Resolved]: 'Resolved',
  [DisputeStatus.Expired]: 'Expired',
};
