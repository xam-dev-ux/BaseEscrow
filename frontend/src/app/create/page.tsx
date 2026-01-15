'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Category, CATEGORY_LABELS } from '@/types/contracts';
import { useCreateTransaction, useProtocolFee } from '@/hooks/useEscrowContract';
import { validateEthereumAddress, validateAmount, formatETH } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value: parseInt(value),
  label,
}));

export default function CreateTransactionPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [seller, setSeller] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.Other);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: feePercentage } = useProtocolFee();
  const { createTransaction, isPending, isConfirming, isSuccess, hash, error } = useCreateTransaction();

  // Calculate fee and total
  const parsedAmount = amount ? parseFloat(amount) : 0;
  const feePercent = feePercentage ? Number(feePercentage) / 100 : 1.5;
  const feeAmount = parsedAmount * (feePercent / 100);
  const totalAmount = parsedAmount + feeAmount;

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success('Transaction created successfully!');
      router.push('/');
    }
  }, [isSuccess, hash, router]);

  useEffect(() => {
    if (error) {
      toast.error('Failed to create transaction');
    }
  }, [error]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!seller) {
      newErrors.seller = 'Seller address is required';
    } else if (!validateEthereumAddress(seller)) {
      newErrors.seller = 'Invalid Ethereum address';
    } else if (seller.toLowerCase() === address?.toLowerCase()) {
      newErrors.seller = 'Cannot create transaction with yourself';
    }

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (!validateAmount(amount)) {
      newErrors.amount = 'Invalid amount';
    } else if (parseFloat(amount) < 0.001) {
      newErrors.amount = 'Minimum amount is 0.001 ETH';
    }

    if (!description) {
      newErrors.description = 'Description is required';
    } else if (description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createTransaction(
        seller as `0x${string}`,
        description,
        category,
        totalAmount.toString()
      );
    } catch (err) {
      console.error('Transaction error:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-base-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-base-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-escrow-text-muted mb-6">
              Connect your wallet to create an escrow transaction
            </p>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Transaction</CardTitle>
          <CardDescription>
            Start a secure escrow transaction with a seller
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seller Address */}
            <Input
              label="Seller Address"
              placeholder="0x..."
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              error={errors.seller}
              hint="The wallet address of the seller"
            />

            {/* Amount */}
            <Input
              label="Amount (ETH)"
              type="number"
              step="0.001"
              min="0.001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              hint="Amount to send to the seller"
            />

            {/* Category */}
            <Select
              label="Category"
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(parseInt(e.target.value) as Category)}
            />

            {/* Description */}
            <TextArea
              label="Description"
              placeholder="Describe the item or service you're purchasing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              rows={4}
              maxLength={500}
              hint={`${description.length}/500 characters`}
            />

            {/* Fee Breakdown */}
            {parsedAmount > 0 && (
              <div className="p-4 bg-escrow-surface-light rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-escrow-text-muted">Amount</span>
                  <span>{parsedAmount.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-escrow-text-muted">
                    Protocol Fee ({feePercent}%)
                  </span>
                  <span>{feeAmount.toFixed(4)} ETH</span>
                </div>
                <div className="border-t border-escrow-border pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-base-blue">{totalAmount.toFixed(4)} ETH</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              isLoading={isPending || isConfirming}
              className="w-full"
              size="lg"
            >
              {isPending
                ? 'Confirm in wallet...'
                : isConfirming
                  ? 'Creating transaction...'
                  : 'Create & Deposit Funds'}
            </Button>

            <p className="text-xs text-escrow-text-muted text-center">
              Funds will be held in escrow until the transaction is completed or disputed.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
