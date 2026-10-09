'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, Loader2 } from 'lucide-react';
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
import { useCreateBooking } from '@/features/bookings/hooks';
import { useRooms } from '@/features/rooms/hooks';
import { bookingConflictMessage } from '@/features/bookings/errors';
import { handleApiError } from '@/lib/handle-api-error';
import { toOffsetIso } from '@/lib/datetime';

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Please select a room'),
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

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRoomId?: string;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultPurpose?: string;
  onBooked?: () => void;
}

export function BookingModal({
  open,
  onOpenChange,
  defaultRoomId,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  defaultPurpose,
  onBooked,
}: BookingModalProps) {
  const createBooking = useCreateBooking();
  const { data: rooms } = useRooms({ limit: 100, status: 'ACTIVE' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: Partial<BookingFormValues> = {
    roomId: defaultRoomId,
    startTime: defaultStartTime
      || (defaultDate ? defaultDate.toISOString().slice(0, 16) : ''),
    endTime: defaultEndTime
      || (defaultDate ? new Date(defaultDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : ''),
    purpose: defaultPurpose || '',
  };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    reset({
      roomId: defaultRoomId || '',
      startTime: defaultStartTime
        || (defaultDate ? defaultDate.toISOString().slice(0, 16) : ''),
      endTime: defaultEndTime
        || (defaultDate ? new Date(defaultDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : ''),
      purpose: defaultPurpose || '',
    });
    setErrorMessage(null);
  }, [open, defaultRoomId, defaultDate, defaultStartTime, defaultEndTime, defaultPurpose, reset]);

  const onSubmit = async (data: BookingFormValues) => {
    setErrorMessage(null);
    try {
      const payload = {
        ...data,
        startTime: toOffsetIso(new Date(data.startTime)),
        endTime: toOffsetIso(new Date(data.endTime)),
      };

      await createBooking.mutateAsync(payload);
      onOpenChange(false);
      reset();
      onBooked?.();
    } catch (err) {
      const conflict = bookingConflictMessage(err);
      if (conflict) {
        setErrorMessage(conflict);
        return;
      }
      handleApiError(err, setError, setErrorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book a Room</DialogTitle>
          <DialogDescription>
            Fill in the details to reserve a conference room
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {errorMessage && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{errorMessage}</div>
            )}
            {/* Room Selection */}
            <div className="space-y-2">
              <Label htmlFor="roomId">Room</Label>
              <select
                id="roomId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('roomId')}
              >
                <option value="">Select a room...</option>
                {rooms?.data?.map((room: any) => (
                  <option key={room.roomId} value={room.roomId}>
                    {room.name} ({room.capacity} seats)
                  </option>
                ))}
              </select>
              {errors.roomId && (
                <p className="text-xs text-destructive">{errors.roomId.message}</p>
              )}
            </div>

            {/* Date/Time Fields */}
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

            {/* Purpose */}
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
              disabled={createBooking.isPending}
            >
              {createBooking.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
