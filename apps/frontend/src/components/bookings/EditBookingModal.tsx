'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCancelBooking, useUpdateBooking } from '@/features/bookings/hooks';
import { handleApiError } from '@/lib/handle-api-error';
import { datetimeLocalFromIso, toOffsetIso } from '@/lib/datetime';
import type { Booking } from '@/types';

const editBookingSchema = z.object({
  startTime: z.string().min(1, 'Please select a start time'),
  endTime: z.string().min(1, 'Please select an end time'),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters'),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return diffMinutes >= 15;
}, {
  message: 'Booking must be at least 15 minutes',
  path: ['endTime'],
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return diffHours <= 8;
}, {
  message: 'Booking cannot be longer than 8 hours',
  path: ['endTime'],
}).refine((data) => new Date(data.startTime) > new Date(), {
  message: 'Start time cannot be in the past',
  path: ['startTime'],
});

type EditBookingFormValues = z.infer<typeof editBookingSchema>;

interface EditBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  allowCancel?: boolean;
  onCancelled?: () => void;
}

export function EditBookingModal({
  open,
  onOpenChange,
  booking,
  allowCancel = false,
  onCancelled,
}: EditBookingModalProps) {
  const updateBooking = useUpdateBooking();
  const cancelBooking = useCancelBooking();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditBookingFormValues>({
    resolver: zodResolver(editBookingSchema),
  });

  useEffect(() => {
    if (booking) {
      setErrorMessage(null);
      reset({
        startTime: datetimeLocalFromIso(booking.startTime),
        endTime: datetimeLocalFromIso(booking.endTime),
        purpose: booking.purpose,
      });
    }
  }, [booking, reset]);

  const onSubmit = async (data: EditBookingFormValues) => {
    if (!booking) return;
    setErrorMessage(null);
    try {
      const payload = {
        ...data,
        startTime: toOffsetIso(new Date(data.startTime)),
        endTime: toOffsetIso(new Date(data.endTime)),
      };

      await updateBooking.mutateAsync({
        id: booking.bookingId,
        data: payload,
      });
      onOpenChange(false);
    } catch (err) {
      handleApiError(err, setError, setErrorMessage);
    }
  };

  const onCancelBooking = async () => {
    if (!booking) return;
    if (!confirm('Cancel this booking?')) return;
    setErrorMessage(null);
    try {
      await cancelBooking.mutateAsync(booking.bookingId);
      onCancelled?.();
      onOpenChange(false);
    } catch (err) {
      handleApiError(err, setError, setErrorMessage);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Modify your booking details for {booking.room?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {errorMessage && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{errorMessage}</div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...register('startTime')}
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  {...register('endTime')}
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="Meeting purpose..."
                {...register('purpose')}
              />
              {errors.purpose && (
                <p className="text-xs text-destructive">{errors.purpose.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            {allowCancel && (
              <Button
                type="button"
                variant="destructive"
                onClick={onCancelBooking}
                disabled={cancelBooking.isPending}
              >
                Cancel booking
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={updateBooking.isPending}
            >
              {updateBooking.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
