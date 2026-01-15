'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { ArbitrationSystemABI } from '@/config/abis';
import { CONTRACT_ADDRESSES } from '@/config/wagmi';
import { Vote } from '@/types/contracts';

export function useArbitrationAddress() {
  const chainId = useChainId();
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  return addresses?.arbitration || '0x0000000000000000000000000000000000000000';
}

export function useMinStake() {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'MIN_STAKE',
  });
}

export function useQuorumSize() {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'QUORUM_SIZE',
  });
}

export function useVotingPeriod() {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'VOTING_PERIOD',
  });
}

export function useTotalArbitrators() {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'totalArbitrators',
  });
}

export function useArbitrator(arbitratorAddress: `0x${string}` | undefined) {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'getArbitrator',
    args: arbitratorAddress ? [arbitratorAddress] : undefined,
    query: {
      enabled: !!arbitratorAddress,
    },
  });
}

export function useArbitratorDisputes(arbitratorAddress: `0x${string}` | undefined) {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'getArbitratorDisputes',
    args: arbitratorAddress ? [arbitratorAddress] : undefined,
    query: {
      enabled: !!arbitratorAddress,
    },
  });
}

export function useDispute(disputeId: bigint) {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'getDispute',
    args: [disputeId],
  });
}

export function useDisputeArbitrators(disputeId: bigint) {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'getDisputeArbitrators',
    args: [disputeId],
  });
}

export function useArbitratorVote(
  disputeId: bigint,
  arbitratorAddress: `0x${string}` | undefined
) {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'getArbitratorVote',
    args: arbitratorAddress ? [disputeId, arbitratorAddress] : undefined,
    query: {
      enabled: !!arbitratorAddress,
    },
  });
}

export function useIsAssignedArbitrator(
  disputeId: bigint,
  arbitratorAddress: `0x${string}` | undefined
) {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'isAssignedArbitrator',
    args: arbitratorAddress ? [disputeId, arbitratorAddress] : undefined,
    query: {
      enabled: !!arbitratorAddress,
    },
  });
}

export function useTransactionToDispute(transactionId: bigint) {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'transactionToDispute',
    args: [transactionId],
  });
}

export function useDisputeCounter() {
  const address = useArbitrationAddress();
  return useReadContract({
    address,
    abi: ArbitrationSystemABI,
    functionName: 'disputeCounter',
  });
}

// Write hooks
export function useRegisterArbitrator() {
  const address = useArbitrationAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerArbitrator = async (stakeAmount: string) => {
    writeContract({
      address,
      abi: ArbitrationSystemABI,
      functionName: 'registerArbitrator',
      value: parseEther(stakeAmount),
    });
  };

  return {
    registerArbitrator,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useIncreaseStake() {
  const address = useArbitrationAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const increaseStake = async (amount: string) => {
    writeContract({
      address,
      abi: ArbitrationSystemABI,
      functionName: 'increaseStake',
      value: parseEther(amount),
    });
  };

  return {
    increaseStake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useDeactivateArbitrator() {
  const address = useArbitrationAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deactivateArbitrator = async () => {
    writeContract({
      address,
      abi: ArbitrationSystemABI,
      functionName: 'deactivateArbitrator',
    });
  };

  return {
    deactivateArbitrator,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useSubmitEvidence() {
  const address = useArbitrationAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitEvidence = async (disputeId: bigint, evidence: string) => {
    writeContract({
      address,
      abi: ArbitrationSystemABI,
      functionName: 'submitEvidence',
      args: [disputeId, evidence],
    });
  };

  return {
    submitEvidence,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCastVote() {
  const address = useArbitrationAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const castVote = async (disputeId: bigint, vote: Vote) => {
    writeContract({
      address,
      abi: ArbitrationSystemABI,
      functionName: 'castVote',
      args: [disputeId, vote],
    });
  };

  return {
    castVote,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useFinalizeDispute() {
  const address = useArbitrationAddress();
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const finalizeDispute = async (disputeId: bigint) => {
    writeContract({
      address,
      abi: ArbitrationSystemABI,
      functionName: 'finalizeDispute',
      args: [disputeId],
    });
  };

  return {
    finalizeDispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
