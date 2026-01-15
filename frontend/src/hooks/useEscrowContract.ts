'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { BaseEscrowABI } from '@/config/abis';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { Category, EscrowTransaction, UserProfile, Rating } from '@/types/contracts';

export function useEscrowAddress() {
  const chainId = useChainId();
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  return addresses?.escrow || '0x0000000000000000000000000000000000000000';
}

export function useProtocolFee() {
  const address = useEscrowAddress();
  return useReadContract({
    address,
    abi: BaseEscrowABI,
    functionName: 'protocolFeePercentage',
  });
}

export function useCalculateFee(amount: bigint) {
  const address = useEscrowAddress();
  return useReadContract({
    address,
    abi: BaseEscrowABI,
    functionName: 'calculateProtocolFee',
    args: [amount],
  });
}

export function useTransaction(transactionId: bigint) {
  const address = useEscrowAddress();
  return useReadContract({
    address,
    abi: BaseEscrowABI,
    functionName: 'getTransaction',
    args: [transactionId],
  });
}

export function useUserTransactions(userAddress: `0x${string}` | undefined) {
  const address = useEscrowAddress();
  return useReadContract({
    address,
    abi: BaseEscrowABI,
    functionName: 'getUserTransactions',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useUserProfile(userAddress: `0x${string}` | undefined) {
  const address = useEscrowAddress();
  return useReadContract({
    address,
    abi: BaseEscrowABI,
    functionName: 'getUserProfile',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useUserRatings(userAddress: `0x${string}` | undefined) {
  const address = useEscrowAddress();
  return useReadContract({
    address,
    abi: BaseEscrowABI,
    functionName: 'getUserRatings',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useAverageRating(userAddress: `0x${string}` | undefined) {
  const address = useEscrowAddress();
  return useReadContract({
    address,
    abi: BaseEscrowABI,
    functionName: 'getAverageRating',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useTransactionCounter() {
  const address = useEscrowAddress();
  return useReadContract({
    address,
    abi: BaseEscrowABI,
    functionName: 'transactionCounter',
  });
}

// Write hooks
export function useCreateTransaction() {
  const address = useEscrowAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createTransaction = async (
    seller: `0x${string}`,
    description: string,
    category: Category,
    amount: string
  ) => {
    writeContract({
      address,
      abi: BaseEscrowABI,
      functionName: 'createTransaction',
      args: [seller, description, category],
      value: parseEther(amount),
    });
  };

  return {
    createTransaction,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useConfirmShipment() {
  const address = useEscrowAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const confirmShipment = async (transactionId: bigint) => {
    writeContract({
      address,
      abi: BaseEscrowABI,
      functionName: 'confirmShipment',
      args: [transactionId],
    });
  };

  return {
    confirmShipment,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useConfirmReceipt() {
  const address = useEscrowAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const confirmReceipt = async (transactionId: bigint) => {
    writeContract({
      address,
      abi: BaseEscrowABI,
      functionName: 'confirmReceipt',
      args: [transactionId],
    });
  };

  return {
    confirmReceipt,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCancelTransaction() {
  const address = useEscrowAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelTransaction = async (transactionId: bigint) => {
    writeContract({
      address,
      abi: BaseEscrowABI,
      functionName: 'cancelTransaction',
      args: [transactionId],
    });
  };

  return {
    cancelTransaction,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useInitiateDispute() {
  const address = useEscrowAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const initiateDispute = async (transactionId: bigint, reason: string) => {
    writeContract({
      address,
      abi: BaseEscrowABI,
      functionName: 'initiateDispute',
      args: [transactionId, reason],
    });
  };

  return {
    initiateDispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimAfterBuyerTimeout() {
  const address = useEscrowAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimAfterBuyerTimeout = async (transactionId: bigint) => {
    writeContract({
      address,
      abi: BaseEscrowABI,
      functionName: 'claimAfterBuyerTimeout',
      args: [transactionId],
    });
  };

  return {
    claimAfterBuyerTimeout,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimAfterSellerTimeout() {
  const address = useEscrowAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimAfterSellerTimeout = async (transactionId: bigint) => {
    writeContract({
      address,
      abi: BaseEscrowABI,
      functionName: 'claimAfterSellerTimeout',
      args: [transactionId],
    });
  };

  return {
    claimAfterSellerTimeout,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useSubmitRating() {
  const address = useEscrowAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitRating = async (
    transactionId: bigint,
    score: number,
    comment: string
  ) => {
    writeContract({
      address,
      abi: BaseEscrowABI,
      functionName: 'submitRating',
      args: [transactionId, score, comment],
    });
  };

  return {
    submitRating,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
