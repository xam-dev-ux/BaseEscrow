'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Card } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { useSubmitRating } from '@/hooks/useEscrowContract';

interface RatingFormProps {
  transactionId: bigint;
  otherPartyAddress: string;
  onSuccess?: () => void;
}

export function RatingForm({ transactionId, otherPartyAddress, onSuccess }: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { submitRating, isPending, isConfirming } = useSubmitRating();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      await submitRating(transactionId, rating, comment);
      toast.success('Rating submitted!');
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Rate Your Experience</h3>
        <p className="text-sm text-escrow-text-muted">
          How was your transaction with this party?
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-escrow-text-muted">
          Rating
        </label>
        <StarRating
          rating={rating}
          size="lg"
          editable
          onChange={setRating}
        />
      </div>

      <TextArea
        label="Comment (optional)"
        placeholder="Share your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={500}
      />

      <Button
        onClick={handleSubmit}
        isLoading={isPending || isConfirming}
        disabled={rating === 0}
        className="w-full"
      >
        Submit Rating
      </Button>
    </Card>
  );
}
