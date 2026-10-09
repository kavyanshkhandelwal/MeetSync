'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleApiError } from '@/lib/handle-api-error';
import type { CreateRoomInput } from '@/features/rooms/types';

const roomSchema = z.object({
  name: z.string().trim().min(2, 'Room name must be at least 2 characters').max(100),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  floor: z.coerce.number().int(),
  building: z.string().trim().min(1, 'Building is required').max(100),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  equipmentsText: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormProps {
  defaultValues?: Partial<RoomFormValues>;
  submitLabel: string;
  onSubmit: (data: CreateRoomInput) => Promise<void>;
}

export function RoomForm({ defaultValues, submitLabel, onSubmit }: RoomFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      capacity: 1,
      floor: 1,
      building: '',
      description: '',
      equipmentsText: '',
      status: 'ACTIVE',
      ...defaultValues,
    },
  });

  const submit = async (values: RoomFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const payload: CreateRoomInput = {
      name: values.name,
      capacity: values.capacity,
      floor: values.floor,
      building: values.building,
      description: values.description || undefined,
      equipments: (values.equipmentsText || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      status: values.status,
    };

    try {
      await onSubmit(payload);
      setSuccessMessage('Saved successfully');
    } catch (err) {
      handleApiError(err, setError, setErrorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      {errorMessage && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{successMessage}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="building">Building</Label>
          <Input id="building" {...register('building')} />
          {errors.building && <p className="text-sm text-destructive">{errors.building.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="floor">Floor</Label>
          <Input id="floor" type="number" {...register('floor')} />
          {errors.floor && <p className="text-sm text-destructive">{errors.floor.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" type="number" min={1} {...register('capacity')} />
          {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('status')}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive (disabled)</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipmentsText">Equipment (comma-separated)</Label>
        <Input id="equipmentsText" placeholder="Projector, Whiteboard" {...register('equipmentsText')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...register('description')} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
