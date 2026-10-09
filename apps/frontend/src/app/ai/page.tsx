'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BookingModal } from '@/components/bookings/BookingModal';
import { useSidebar } from '@/hooks/use-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  recommendRooms,
  recommendationErrorMessage,
  extractionSourceMessage,
  RecommendationResult,
} from '@/features/ai/api';
import {
  ConstraintForm,
  NO_ROOMS_GUIDANCE,
  NO_ROOMS_MESSAGE,
  STALE_RESULTS_MESSAGE,
  buildConstraintPayload,
  clientConstraintIssue,
  constraintFingerprint,
  formFromExtracted,
  requirementsAreStale,
} from '@/features/ai/flow';
import { useCurrentUser } from '@/features/auth/hooks';

const emptyForm: ConstraintForm = {
  capacity: '',
  startLocal: '',
  endLocal: '',
  purpose: '',
  building: '',
  floor: '',
  equipment: '',
};

export default function AiRecommendPage() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState(
    'Book a room for 12 people tomorrow from 2 PM to 3 PM with a projector.',
  );
  const [form, setForm] = useState<ConstraintForm>(emptyForm);
  const [parseSource, setParseSource] = useState<RecommendationResult['extractionSource'] | null>(
    null,
  );
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [searchedFingerprint, setSearchedFingerprint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<'extract' | 'find' | null>(null);
  const [bookingRoomId, setBookingRoomId] = useState<string | undefined>(undefined);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (!currentUser && !isLoading) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const busy = busyKind !== null;
  const hasExtracted = parseSource !== null;
  const stale = requirementsAreStale(searchedFingerprint, constraintFingerprint(form));

  const patchForm = (patch: Partial<ConstraintForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const applySearchResult = (
    next: RecommendationResult,
    source: RecommendationResult['extractionSource'],
  ) => {
    const nextForm = formFromExtracted(next.extracted, form.purpose);
    setForm(nextForm);
    setParseSource(source);
    setResult(next);
    setSearchedFingerprint(constraintFingerprint(nextForm));
  };

  const onExtract = async () => {
    if (busy || query.trim().length === 0) {
      return;
    }
    setBusyKind('extract');
    setError(null);
    setResult(null);
    setSearchedFingerprint(null);
    try {
      const next = await recommendRooms(query);
      applySearchResult(next, next.extractionSource);
    } catch (err: unknown) {
      setError(recommendationErrorMessage(err));
    } finally {
      setBusyKind(null);
    }
  };

  const onFindRooms = async () => {
    if (busy || !hasExtracted) {
      return;
    }
    const issue = clientConstraintIssue(form);
    if (issue) {
      setError(issue);
      return;
    }
    setBusyKind('find');
    setError(null);
    try {
      const next = await recommendRooms(query, buildConstraintPayload(form));
      applySearchResult(next, parseSource ?? next.extractionSource);
    } catch (err: unknown) {
      setError(recommendationErrorMessage(err));
    } finally {
      setBusyKind(null);
    }
  };

  const onBookNow = (roomId: string) => {
    if (stale || busy) {
      return;
    }
    setBookingRoomId(roomId);
    setBookingOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={user.role} isCollapsed={isCollapsed} onToggle={toggleSidebar} className="hidden flex-col md:flex" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Room recommendations</h1>
            <p className="text-sm text-muted-foreground">
              Describe what you need, review the extracted requirements, then find rooms. Availability
              is verified by the booking calendar. Results are not reservations.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Natural language request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ai-query">What do you need?</Label>
                <Input
                  id="ai-query"
                  value={query}
                  maxLength={500}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={busy}
                  aria-label="Recommendation query"
                />
              </div>
              <Button onClick={onExtract} disabled={busy || query.trim().length === 0}>
                Extract constraints
              </Button>
              {busyKind === 'extract' && (
                <p className="text-sm text-muted-foreground" role="status">
                  Extracting constraints...
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
          {hasExtracted && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted requirements</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {result && (
                  <p className="md:col-span-2 text-sm text-muted-foreground">{result.explanation}</p>
                )}
                <p className="md:col-span-2 text-xs text-muted-foreground">
                  {extractionSourceMessage(parseSource)}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="ai-capacity">Capacity</Label>
                  <Input
                    id="ai-capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    disabled={busy}
                    onChange={(e) => patchForm({ capacity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-purpose">Purpose</Label>
                  <Input
                    id="ai-purpose"
                    value={form.purpose}
                    disabled={busy}
                    onChange={(e) => patchForm({ purpose: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-start">Start</Label>
                  <Input
                    id="ai-start"
                    type="datetime-local"
                    value={form.startLocal}
                    disabled={busy}
                    onChange={(e) => patchForm({ startLocal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-end">End</Label>
                  <Input
                    id="ai-end"
                    type="datetime-local"
                    value={form.endLocal}
                    disabled={busy}
                    onChange={(e) => patchForm({ endLocal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-building">Building</Label>
                  <Input
                    id="ai-building"
                    value={form.building}
                    disabled={busy}
                    onChange={(e) => patchForm({ building: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-floor">Floor</Label>
                  <Input
                    id="ai-floor"
                    type="number"
                    value={form.floor}
                    disabled={busy}
                    onChange={(e) => patchForm({ floor: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ai-equipment">Equipment</Label>
                  <Input
                    id="ai-equipment"
                    value={form.equipment}
                    disabled={busy}
                    onChange={(e) => patchForm({ equipment: e.target.value })}
                    placeholder="Comma-separated, for example Projector, Whiteboard"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Button onClick={onFindRooms} disabled={busy}>
                    Find rooms
                  </Button>
                  {busyKind === 'find' && (
                    <p className="text-sm text-muted-foreground" role="status">
                      Finding rooms...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {hasExtracted && stale && (
            <p className="text-sm text-muted-foreground" role="status">
              {STALE_RESULTS_MESSAGE}
            </p>
          )}
          {result && !stale && (
            <Card>
              <CardHeader>
                <CardTitle>Verified rooms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.rooms.length === 0 && (
                  <div className="space-y-1">
                    <p>{NO_ROOMS_MESSAGE}</p>
                    <p className="text-sm text-muted-foreground">{NO_ROOMS_GUIDANCE}</p>
                  </div>
                )}
                {result.rooms.map((room) => (
                  <div key={room.roomId} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {room.building} · Floor {room.floor} · {room.capacity} seats ·{' '}
                        {room.equipments.join(', ') || 'no equipment'}
                      </p>
                    </div>
                    <Button onClick={() => onBookNow(room.roomId)} disabled={busy}>
                      Book now
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        defaultRoomId={bookingRoomId}
        defaultStartTime={form.startLocal}
        defaultEndTime={form.endLocal}
        defaultPurpose={form.purpose}
        onBooked={() => router.push('/bookings')}
      />
    </div>
  );
}
