'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRoomAvailability } from '@/features/rooms/hooks';
import { endOfLocalDay, startOfLocalDay, toOffsetIso } from '@/lib/datetime';
import type { OccupyingBooking } from '@/features/rooms/types';

function localDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildAvailableGaps(
  start: Date,
  end: Date,
  bookings: OccupyingBooking[],
): Array<{ start: Date; end: Date }> {
  const occupied = [...bookings]
    .map((booking) => ({
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const gaps: Array<{ start: Date; end: Date }> = [];
  let cursor = start;

  for (const slot of occupied) {
    if (slot.start > cursor) {
      gaps.push({ start: cursor, end: slot.start < end ? slot.start : end });
    }
    if (slot.end > cursor) {
      cursor = slot.end;
    }
  }

  if (cursor < end) {
    gaps.push({ start: cursor, end });
  }

  return gaps.filter((gap) => gap.end > gap.start);
}

function formatTime(date: Date): string {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AvailabilityPanel({
  roomId,
  roomStatus,
}: {
  roomId: string;
  roomStatus: string;
}) {
  const [selectedDate, setSelectedDate] = useState(() => localDateInput(new Date()));
  const range = useMemo(() => {
    const day = new Date(`${selectedDate}T00:00:00`);
    return {
      startDate: toOffsetIso(startOfLocalDay(day)),
      endDate: toOffsetIso(endOfLocalDay(day)),
    };
  }, [selectedDate]);

  const { data, isLoading, isError, error } = useRoomAvailability(roomId, range);
  const unavailable = roomStatus !== 'ACTIVE' || data?.bookable === false;
  const bookings = data?.bookings || [];
  const gaps = useMemo(() => {
    const day = new Date(`${selectedDate}T00:00:00`);
    return buildAvailableGaps(startOfLocalDay(day), endOfLocalDay(day), bookings);
  }, [selectedDate, bookings]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="availability-date">Date</Label>
        <Input
          id="availability-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {unavailable && (
        <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-900">
          This room is {roomStatus === 'MAINTENANCE' ? 'under maintenance' : 'disabled'} and cannot
          be booked.
        </p>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading availability...
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {(error as any)?.response?.data?.message || 'Could not load availability'}
        </p>
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Booked periods</p>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings on this date.</p>
            ) : (
              <ul className="space-y-2">
                {bookings.map((booking) => (
                  <li
                    key={booking.bookingId}
                    className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  >
                    {formatTime(new Date(booking.startTime))} – {formatTime(new Date(booking.endTime))}
                    <span className="ml-2 text-xs uppercase">{booking.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Available periods</p>
            {unavailable ? (
              <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-muted-foreground">
                No bookable times while the room is not active.
              </p>
            ) : gaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open time remains on this date.</p>
            ) : (
              <ul className="space-y-2">
                {gaps.map((gap) => (
                  <li
                    key={gap.start.toISOString()}
                    className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
                  >
                    {formatTime(gap.start)} – {formatTime(gap.end)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
