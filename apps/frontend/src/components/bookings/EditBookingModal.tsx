'use client';

import { useEffect } from 'react';
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
import { useUpdateBooking } from '@/features/bookings/hooks';
import { useRoom } from '@/features/rooms/hooks';
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
}

export function EditBookingModal({
  open,
  onOpenChange,
  booking,
}: EditBookingModalProps) {
  const updateBooking = useUpdateBooking();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditBookingFormValues>({
    resolver: zodResolver(editBookingSchema),
  });

  // Reset form when booking changes
  useEffect(() => {
    if (booking) {
      reset({
        startTime: booking.startTime.slice(0, 16),
        endTime: booking.endTime.slice(0, 16),
        purpose: booking.purpose,
      });
    }
  }, [booking, reset]);

  const onSubmit = async (data: EditBookingFormValues) => {
    if (!booking) return;
    try {
      // Convert datetime-local strings to ISO-8601 with timezone offset
      const formatDateTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return '';
        const date = new Date(dateTimeStr);
        // Get timezone offset in minutes
        const offset = date.getTimezoneOffset();
        // Convert to hours and minutes
        const offsetHours = Math.abs(Math.floor(offset / 60));
        const offsetMinutes = Math.abs(offset % 60);
        const offsetSign = offset <= 0 ? '+' : '-';
        // Format: YYYY-MM-DDTHH:mm:ss+HH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`;
      };

      const payload = {
        ...data,
        startTime: formatDateTime(data.startTime),
        endTime: formatDateTime(data.endTime),
      };

      await updateBooking.mutateAsync({
        id: booking.bookingId,
        data: payload,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating booking:', err);
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
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
