'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  useArbitrator,
  useMinStake,
  useTotalArbitrators,
  useRegisterArbitrator,
  useIncreaseStake,
  useDeactivateArbitrator,
} from '@/hooks/useArbitrationContract';
import { formatETH } from '@/lib/utils';

export default function ArbitratorPage() {
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('0.05');
  const [additionalStake, setAdditionalStake] = useState('');

  const { data: arbitrator, refetch } = useArbitrator(address);
  const { data: minStake } = useMinStake();
  const { data: totalArbitrators } = useTotalArbitrators();

  const {
    registerArbitrator,
    isPending: isRegistering,
    isConfirming: isRegisterConfirming,
    isSuccess: registerSuccess,
  } = useRegisterArbitrator();

  const {
    increaseStake,
    isPending: isIncreasing,
    isConfirming: isIncreaseConfirming,
    isSuccess: increaseSuccess,
  } = useIncreaseStake();

  const {
    deactivateArbitrator,
    isPending: isDeactivating,
    isConfirming: isDeactivateConfirming,
    isSuccess: deactivateSuccess,
  } = useDeactivateArbitrator();

  useEffect(() => {
    if (registerSuccess) {
      toast.success('Successfully registered as an arbitrator!');
      refetch();
    }
  }, [registerSuccess, refetch]);

  useEffect(() => {
    if (increaseSuccess) {
      toast.success('Stake increased successfully!');
      refetch();
    }
  }, [increaseSuccess, refetch]);

  useEffect(() => {
    if (deactivateSuccess) {
      toast.success('Successfully deactivated and stake withdrawn!');
      refetch();
    }
  }, [deactivateSuccess, refetch]);

  const handleRegister = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) < 0.05) {
      toast.error('Minimum stake is 0.05 ETH');
      return;
    }
    try {
      await registerArbitrator(stakeAmount);
    } catch (error) {
      toast.error('Failed to register');
    }
  };

  const handleIncreaseStake = async () => {
    if (!additionalStake || parseFloat(additionalStake) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await increaseStake(additionalStake);
    } catch (error) {
      toast.error('Failed to increase stake');
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateArbitrator();
    } catch (error) {
      toast.error('Failed to deactivate. You may have pending disputes.');
    }
  };

  const minStakeValue = minStake ? formatEther(minStake) : '0.05';

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-base-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-base-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-escrow-text-muted mb-6">
              Connect your wallet to become an arbitrator
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already registered as arbitrator
  if (arbitrator?.isActive) {
    const accuracy = arbitrator.totalCasesVoted > 0n
      ? Number((arbitrator.correctVotes * 100n) / arbitrator.totalCasesVoted)
      : 0;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold">Arbitrator Dashboard</h1>
          <Badge variant="success">Active</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">
                    {formatETH(arbitrator.stakedAmount)} ETH
                  </p>
                  <p className="text-sm text-escrow-text-muted">Staked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">
                    {arbitrator.totalCasesAssigned.toString()}
                  </p>
                  <p className="text-sm text-escrow-text-muted">Cases</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {arbitrator.totalCasesVoted.toString()}
                  </p>
                  <p className="text-sm text-escrow-text-muted">Voted</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {arbitrator.reputation.toString()}
                  </p>
                  <p className="text-sm text-escrow-text-muted">Reputation</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-escrow-text-muted">Accuracy</span>
                    <span>{accuracy}%</span>
                  </div>
                  <div className="h-2 bg-escrow-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-escrow-text-muted">Correct Votes</span>
                  <span>{arbitrator.correctVotes.toString()} / {arbitrator.totalCasesVoted.toString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle>How Arbitration Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-escrow-text-muted">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-base-blue/20 text-base-blue flex items-center justify-center flex-shrink-0">1</span>
                    <span>When a dispute is initiated, 5 arbitrators are randomly selected</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-base-blue/20 text-base-blue flex items-center justify-center flex-shrink-0">2</span>
                    <span>Review the evidence from both buyer and seller</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-base-blue/20 text-base-blue flex items-center justify-center flex-shrink-0">3</span>
                    <span>Cast your vote within the 3-day voting period</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-base-blue/20 text-base-blue flex items-center justify-center flex-shrink-0">4</span>
                    <span>If your vote matches the majority, you earn rewards</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Increase Stake */}
            <Card>
              <CardHeader>
                <CardTitle>Increase Stake</CardTitle>
                <CardDescription>
                  Higher stake increases your chances of being selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={additionalStake}
                  onChange={(e) => setAdditionalStake(e.target.value)}
                  hint="Amount in ETH"
                />
                <Button
                  onClick={handleIncreaseStake}
                  isLoading={isIncreasing || isIncreaseConfirming}
                  className="w-full"
                >
                  Add Stake
                </Button>
              </CardContent>
            </Card>

            {/* Deactivate */}
            <Card>
              <CardHeader>
                <CardTitle>Deactivate</CardTitle>
                <CardDescription>
                  Withdraw your stake and stop receiving disputes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDeactivate}
                  isLoading={isDeactivating || isDeactivateConfirming}
                  variant="danger"
                  className="w-full"
                >
                  Deactivate & Withdraw
                </Button>
                <p className="text-xs text-escrow-text-muted mt-2">
                  You cannot deactivate with pending disputes
                </p>
              </CardContent>
            </Card>

            {/* Link to Disputes */}
            <Card>
              <CardContent className="pt-6">
                <a
                  href="/disputes"
                  className="flex items-center justify-center gap-2 text-sm text-base-blue hover:text-base-blue-light transition-colors"
                >
                  View My Disputes
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Become an Arbitrator</CardTitle>
          <CardDescription>
            Help resolve disputes and earn rewards by becoming a community arbitrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-escrow-surface-light rounded-lg text-center">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Earn Rewards</p>
              <p className="text-xs text-escrow-text-muted">0.5% of dispute value</p>
            </div>
            <div className="p-4 bg-escrow-surface-light rounded-lg text-center">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Community</p>
              <p className="text-xs text-escrow-text-muted">{totalArbitrators?.toString() ?? '0'} arbitrators</p>
            </div>
            <div className="p-4 bg-escrow-surface-light rounded-lg text-center">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Build Reputation</p>
              <p className="text-xs text-escrow-text-muted">Accurate voting</p>
            </div>
          </div>

          {/* Stake Input */}
          <div>
            <Input
              label="Stake Amount (ETH)"
              type="number"
              step="0.01"
              min={minStakeValue}
              placeholder={minStakeValue}
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              hint={`Minimum stake: ${minStakeValue} ETH`}
            />
          </div>

          {/* Requirements */}
          <div className="p-4 bg-escrow-surface-light rounded-lg">
            <h4 className="font-medium mb-2">Requirements</h4>
            <ul className="space-y-1 text-sm text-escrow-text-muted">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Minimum stake of {minStakeValue} ETH
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Vote on assigned disputes within 3 days
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
                5% stake penalty for not voting
              </li>
            </ul>
          </div>

          {/* Register Button */}
          <Button
            onClick={handleRegister}
            isLoading={isRegistering || isRegisterConfirming}
            className="w-full"
            size="lg"
          >
            {isRegistering
              ? 'Confirm in wallet...'
              : isRegisterConfirming
                ? 'Registering...'
                : `Register & Stake ${stakeAmount} ETH`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
