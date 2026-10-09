/**
 * Live production-readiness probe against running services.
 * Run: npx tsx scripts/live-workflows.ts
 */
import { io } from 'socket.io-client';

const API = process.env.API_URL || 'http://127.0.0.1:3001/api';
const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
const SOCKET = process.env.SOCKET_URL || 'http://127.0.0.1:3001';

type Row = {
  feature: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  evidence: string;
};

const results: Row[] = [];

function record(row: Row) {
  results.push(row);
  const mark = row.status === 'PASS' ? 'PASS' : row.status;
  console.log(`[${mark}] ${row.feature}: ${row.actual}`);
}

async function req(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<{ status: number; json: any; text: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json, text };
}

function futureSlot(hoursFromNow: number, durationHours = 1) {
  const start = new Date(Date.now() + hoursFromNow * 3600_000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + durationHours * 3600_000);
  const iso = (d: Date) => d.toISOString().replace('Z', '+00:00');
  return { startTime: iso(start), endTime: iso(end), start, end };
}

async function waitForEvent(url: string, event: string, timeoutMs = 4000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = io(url, { transports: ['websocket'], forceNew: true });
    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`timeout waiting for ${event}`));
    }, timeoutMs);
    socket.on(event, (payload) => {
      clearTimeout(timer);
      socket.disconnect();
      resolve(payload);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(err);
    });
  });
}

async function main() {
  try {
    const health = await req('GET', '/health');
    record({
      feature: 'Services — backend health',
      expected: 'GET /api/health returns healthy + connected DB',
      actual: `${health.status} ${JSON.stringify(health.json?.data ?? health.json)}`,
      status: health.status === 200 && health.json?.data?.database === 'connected' ? 'PASS' : 'FAIL',
      evidence: health.text.slice(0, 300),
    });
  } catch (err: any) {
    record({
      feature: 'Services — backend health',
      expected: 'Backend listening on :3001',
      actual: `Unreachable: ${err.message}`,
      status: 'BLOCKED',
      evidence: 'No HTTP response from backend',
    });
    print();
    process.exit(1);
  }

  try {
    const fe = await fetch(FRONTEND, { redirect: 'manual' });
    record({
      feature: 'Services — frontend',
      expected: 'Next.js responds on :3000',
      actual: `HTTP ${fe.status}`,
      status: fe.status < 500 ? 'PASS' : 'FAIL',
      evidence: `GET ${FRONTEND} → ${fe.status}`,
    });
  } catch (err: any) {
    record({
      feature: 'Services — frontend',
      expected: 'Frontend on :3000',
      actual: `Unreachable: ${err.message}`,
      status: 'FAIL',
      evidence: err.message,
    });
  }

  // Redis is not an HTTP service; probe via optional reminders endpoint later.

  // --- WORKFLOW 1 employee ---
  const email = `qa.emp.${Date.now()}@company.com`;
  const password = 'Secret123';
  const register = await req('POST', '/auth/register', {
    body: { firstName: 'QA', lastName: 'Employee', email, password },
  });
  const empToken = register.json?.data?.accessToken;
  record({
    feature: 'W1 Register',
    expected: '201 + accessToken + user without passwordHash',
    actual: `${register.status} token=${Boolean(empToken)} hash=${register.json?.data?.user?.passwordHash}`,
    status: register.status === 201 && empToken && !register.json?.data?.user?.passwordHash ? 'PASS' : 'FAIL',
    evidence: register.text.slice(0, 400),
  });

  const login = await req('POST', '/auth/login', { body: { email, password } });
  record({
    feature: 'W1 Login',
    expected: '200 + accessToken',
    actual: `${login.status} token=${Boolean(login.json?.data?.accessToken)}`,
    status: login.status === 200 && login.json?.data?.accessToken ? 'PASS' : 'FAIL',
    evidence: login.text.slice(0, 300),
  });

  const rooms = await req('GET', '/rooms?limit=10', { token: empToken });
  const roomList = rooms.json?.data?.data ?? [];
  const activeRoom = roomList.find((r: any) => r.status === 'ACTIVE') ?? roomList[0];
  record({
    feature: 'W1 View rooms',
    expected: '200 + paginated rooms',
    actual: `${rooms.status} count=${roomList.length}`,
    status: rooms.status === 200 && roomList.length > 0 ? 'PASS' : 'FAIL',
    evidence: `first=${activeRoom?.name} ${activeRoom?.roomId}`,
  });

  const search = await req('GET', `/rooms?search=${encodeURIComponent(activeRoom?.name?.slice(0, 4) || 'Room')}&limit=10`, {
    token: empToken,
  });
  record({
    feature: 'W1 Search/filter rooms',
    expected: 'Search returns matching rooms',
    actual: `${search.status} count=${search.json?.data?.data?.length ?? 0}`,
    status: search.status === 200 && (search.json?.data?.data?.length ?? 0) >= 1 ? 'PASS' : 'FAIL',
    evidence: (search.json?.data?.data ?? []).map((r: any) => r.name).join(', '),
  });

  const detail = await req('GET', `/rooms/${activeRoom?.roomId}`, { token: empToken });
  record({
    feature: 'W1 View availability (room detail)',
    expected: 'Room detail loads with status ACTIVE',
    actual: `${detail.status} status=${detail.json?.data?.status}`,
    status: detail.status === 200 && detail.json?.data?.status === 'ACTIVE' ? 'PASS' : 'FAIL',
    evidence: detail.text.slice(0, 300),
  });

  const slot = futureSlot(26);
  const created = await req('POST', '/bookings', {
    token: empToken,
    body: {
      roomId: activeRoom?.roomId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      purpose: 'QA employee workflow booking',
    },
  });
  const bookingId = created.json?.data?.bookingId;
  record({
    feature: 'W1 Create booking',
    expected: '201 PENDING booking',
    actual: `${created.status} id=${bookingId} status=${created.json?.data?.status}`,
    status: created.status === 201 && created.json?.data?.status === 'PENDING' ? 'PASS' : 'FAIL',
    evidence: created.text.slice(0, 400),
  });

  const conflict = await req('POST', '/bookings', {
    token: empToken,
    body: {
      roomId: activeRoom?.roomId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      purpose: 'QA should be rejected as overlap',
    },
  });
  record({
    feature: 'W1 Conflict prevention (sequential)',
    expected: '409 when same room/time is booked again',
    actual: `${conflict.status} ${conflict.json?.message || ''}`,
    status: conflict.status === 409 ? 'PASS' : 'FAIL',
    evidence: conflict.text.slice(0, 300),
  });

  const viewed = await req('GET', `/bookings/${bookingId}`, { token: empToken });
  record({
    feature: 'W1 View booking',
    expected: '200 owner can read booking',
    actual: `${viewed.status} purpose=${viewed.json?.data?.purpose}`,
    status: viewed.status === 200 && viewed.json?.data?.bookingId === bookingId ? 'PASS' : 'FAIL',
    evidence: viewed.text.slice(0, 300),
  });

  const newSlot = futureSlot(30);
  const updated = await req('PUT', `/bookings/${bookingId}`, {
    token: empToken,
    body: { purpose: 'QA employee modified purpose', startTime: newSlot.startTime, endTime: newSlot.endTime },
  });
  record({
    feature: 'W1 Modify booking',
    expected: '200 purpose/time updated',
    actual: `${updated.status} purpose=${updated.json?.data?.purpose}`,
    status: updated.status === 200 && updated.json?.data?.purpose?.includes('modified') ? 'PASS' : 'FAIL',
    evidence: updated.text.slice(0, 300),
  });

  const cancelled = await req('PATCH', `/bookings/${bookingId}/cancel`, { token: empToken });
  record({
    feature: 'W1 Cancel booking',
    expected: '200 status CANCELLED',
    actual: `${cancelled.status} status=${cancelled.json?.data?.status}`,
    status: cancelled.status === 200 && cancelled.json?.data?.status === 'CANCELLED' ? 'PASS' : 'FAIL',
    evidence: cancelled.text.slice(0, 300),
  });

  const reminderAfterCancel = await req('GET', `/reminders/${bookingId}`, { token: empToken });
  record({
    feature: 'W1 Verify reminder cancellation',
    expected: 'Reminder job removed or marked cancelled after cancel',
    actual: `${reminderAfterCancel.status} ${reminderAfterCancel.json?.message || JSON.stringify(reminderAfterCancel.json?.data)}`,
    status:
      reminderAfterCancel.status === 200 &&
      (reminderAfterCancel.json?.data?.exists === false ||
        reminderAfterCancel.json?.data?.state === 'cancelled')
        ? 'PASS'
        : 'FAIL',
    evidence: reminderAfterCancel.text.slice(0, 400),
  });

  // --- WORKFLOW 2 admin ---
  const adminLogin = await req('POST', '/auth/login', {
    body: { email: 'admin@company.com', password: 'password123' },
  });
  const adminToken = adminLogin.json?.data?.accessToken;
  record({
    feature: 'W2 Admin login',
    expected: '200 as ADMIN',
    actual: `${adminLogin.status} role=${adminLogin.json?.data?.user?.role}`,
    status: adminLogin.status === 200 && adminLogin.json?.data?.user?.role === 'ADMIN' ? 'PASS' : 'FAIL',
    evidence: adminLogin.text.slice(0, 250),
  });

  const newRoom = await req('POST', '/rooms', {
    token: adminToken,
    body: {
      name: `QA Lab ${Date.now()}`,
      capacity: 12,
      floor: 3,
      building: 'QA Wing',
      description: 'Created by production-readiness probe',
      equipments: ['Projector', 'Whiteboard'],
    },
  });
  const qaRoomId = newRoom.json?.data?.roomId;
  record({
    feature: 'W2 Create room',
    expected: '201 ACTIVE room',
    actual: `${newRoom.status} id=${qaRoomId} status=${newRoom.json?.data?.status}`,
    status: newRoom.status === 201 && newRoom.json?.data?.status === 'ACTIVE' ? 'PASS' : 'FAIL',
    evidence: newRoom.text.slice(0, 300),
  });

  const roomUpdate = await req('PUT', `/rooms/${qaRoomId}`, {
    token: adminToken,
    body: { description: 'Updated by QA probe', capacity: 14 },
  });
  record({
    feature: 'W2 Update room',
    expected: '200 capacity/description changed',
    actual: `${roomUpdate.status} capacity=${roomUpdate.json?.data?.capacity}`,
    status: roomUpdate.status === 200 && roomUpdate.json?.data?.capacity === 14 ? 'PASS' : 'FAIL',
    evidence: roomUpdate.text.slice(0, 300),
  });

  const disabled = await req('PUT', `/rooms/${qaRoomId}`, {
    token: adminToken,
    body: { status: 'INACTIVE' },
  });
  record({
    feature: 'W2 Disable room',
    expected: '200 status INACTIVE and booking that room is rejected',
    actual: `${disabled.status} status=${disabled.json?.data?.status}`,
    status: disabled.status === 200 && disabled.json?.data?.status === 'INACTIVE' ? 'PASS' : 'FAIL',
    evidence: disabled.text.slice(0, 250),
  });

  const bookDisabled = await req('POST', '/bookings', {
    token: empToken,
    body: {
      roomId: qaRoomId,
      startTime: futureSlot(40).startTime,
      endTime: futureSlot(40).endTime,
      purpose: 'Should fail against inactive room',
    },
  });
  record({
    feature: 'W2 Disabled room rejects booking',
    expected: '400 room not available',
    actual: `${bookDisabled.status} ${bookDisabled.json?.message || ''}`,
    status: bookDisabled.status === 400 ? 'PASS' : 'FAIL',
    evidence: bookDisabled.text.slice(0, 250),
  });

  const allBookings = await req('GET', '/bookings?limit=20', { token: adminToken });
  record({
    feature: 'W2 View all bookings',
    expected: 'Admin sees paginated bookings',
    actual: `${allBookings.status} total=${allBookings.json?.data?.meta?.total}`,
    status: allBookings.status === 200 && typeof allBookings.json?.data?.meta?.total === 'number' ? 'PASS' : 'FAIL',
    evidence: `total=${allBookings.json?.data?.meta?.total}`,
  });

  const analytics = await req('GET', '/analytics/dashboard', { token: adminToken });
  record({
    feature: 'W2 View analytics',
    expected: '200 dashboard payload',
    actual: `${analytics.status} keys=${Object.keys(analytics.json?.data ?? {}).join(',')}`,
    status: analytics.status === 200 && analytics.json?.data ? 'PASS' : 'FAIL',
    evidence: analytics.text.slice(0, 400),
  });

  const audit = await req('GET', '/audit-logs', { token: adminToken });
  record({
    feature: 'W2 View audit logs',
    expected: '200 list including recent BOOKING/ROOM actions',
    actual: `${audit.status} ${audit.json?.message || `count=${audit.json?.data?.length ?? 'n/a'}`}`,
    status: audit.status === 200 && Array.isArray(audit.json?.data) && audit.json.data.length > 0 ? 'PASS' : 'FAIL',
    evidence: audit.text.slice(0, 400),
  });

  // --- WORKFLOW 3 AI ---
  const ai = await req('POST', '/ai/recommend', {
    token: empToken,
    body: { query: 'Book a room for 12 people tomorrow from 2 PM to 3 PM with a projector.' },
  });
  const rec = ai.json?.data;
  record({
    feature: 'W3 AI extract + verify + list',
    expected: '200 extracted capacity 12, projector, verified rooms',
    actual: `${ai.status} ${ai.json?.message || JSON.stringify(rec?.extracted)}`,
    status:
      ai.status === 200 &&
      rec?.extracted?.capacity === 12 &&
      Array.isArray(rec?.rooms)
        ? 'PASS'
        : 'FAIL',
    evidence: ai.text.slice(0, 500),
  });

  if (ai.status === 200 && rec?.rooms?.[0]?.roomId) {
    const recSlot = rec.extracted?.startTime && rec.extracted?.endTime
      ? { startTime: rec.extracted.startTime, endTime: rec.extracted.endTime }
      : futureSlot(50);
    const bookedRec = await req('POST', '/bookings', {
      token: empToken,
      body: {
        roomId: rec.rooms[0].roomId,
        startTime: recSlot.startTime,
        endTime: recSlot.endTime,
        purpose: 'Booked from AI recommendation',
      },
    });
    record({
      feature: 'W3 Book recommended room',
      expected: '201 booking from recommendation',
      actual: `${bookedRec.status} id=${bookedRec.json?.data?.bookingId}`,
      status: bookedRec.status === 201 ? 'PASS' : 'FAIL',
      evidence: bookedRec.text.slice(0, 300),
    });
    const cal = await req('GET', '/bookings?limit=50', { token: empToken });
    const found = (cal.json?.data?.data ?? []).some(
      (b: any) => b.bookingId === bookedRec.json?.data?.bookingId,
    );
    record({
      feature: 'W3 Booking appears in calendar/list',
      expected: 'New booking visible in GET /bookings',
      actual: `found=${found}`,
      status: found ? 'PASS' : 'FAIL',
      evidence: `bookingId=${bookedRec.json?.data?.bookingId}`,
    });
  } else {
    record({
      feature: 'W3 Book recommended room',
      expected: 'Can book a recommended room',
      actual: 'Skipped — no recommendation payload',
      status: 'FAIL',
      evidence: ai.text.slice(0, 300),
    });
    record({
      feature: 'W3 Booking appears in calendar/list',
      expected: 'Booking visible after AI book',
      actual: 'Skipped — no recommendation payload',
      status: 'FAIL',
      evidence: 'AI route missing or empty',
    });
  }

  // --- WORKFLOW 4 concurrency ---
  const concRoom = await req('POST', '/rooms', {
    token: adminToken,
    body: {
      name: `Race Room ${Date.now()}`,
      capacity: 6,
      floor: 1,
      building: 'QA Wing',
      equipments: [],
    },
  });
  const raceRoomId = concRoom.json?.data?.roomId;
  const raceSlot = futureSlot(60);
  const payload = {
    roomId: raceRoomId,
    startTime: raceSlot.startTime,
    endTime: raceSlot.endTime,
    purpose: 'Concurrent race booking',
  };
  const [a, b] = await Promise.all([
    req('POST', '/bookings', { token: empToken, body: payload }),
    req('POST', '/bookings', { token: adminToken, body: payload }),
  ]);
  const statuses = [a.status, b.status].sort();
  const wins = [a, b].filter((r) => r.status === 201).length;
  record({
    feature: 'W4 Concurrent double-book',
    expected: 'Exactly one 201 and one 409',
    actual: `statuses=${a.status},${b.status} wins=${wins}`,
    status: wins === 1 && statuses.includes(409) ? 'PASS' : 'FAIL',
    evidence: `A=${a.text.slice(0, 180)} | B=${b.text.slice(0, 180)}`,
  });

  // --- WORKFLOW 5 email ---
  const mailSlot = futureSlot(70);
  const mailBooking = await req('POST', '/bookings', {
    token: empToken,
    body: {
      roomId: activeRoom?.roomId,
      startTime: mailSlot.startTime,
      endTime: mailSlot.endTime,
      purpose: 'Email reminder pipeline booking',
    },
  });
  const mailId = mailBooking.json?.data?.bookingId;
  const jobAfterCreate = await req('GET', `/reminders/${mailId}`, { token: empToken });
  record({
    feature: 'W5 Create booking → reminder job exists',
    expected: 'Reminder job present for the new booking',
    actual: `${jobAfterCreate.status} ${JSON.stringify(jobAfterCreate.json?.data ?? jobAfterCreate.json)}`,
    status:
      jobAfterCreate.status === 200 && jobAfterCreate.json?.data?.exists === true ? 'PASS' : 'FAIL',
    evidence: jobAfterCreate.text.slice(0, 400),
  });

  await req('PATCH', `/bookings/${mailId}/cancel`, { token: empToken });
  const jobAfterCancel = await req('GET', `/reminders/${mailId}`, { token: empToken });
  record({
    feature: 'W5 Cancel booking → reminder does not execute',
    expected: 'Job removed/cancelled so reminder will not fire',
    actual: `${jobAfterCancel.status} ${JSON.stringify(jobAfterCancel.json?.data ?? jobAfterCancel.json)}`,
    status:
      jobAfterCancel.status === 200 &&
      (jobAfterCancel.json?.data?.exists === false ||
        jobAfterCancel.json?.data?.state === 'cancelled')
        ? 'PASS'
        : 'FAIL',
    evidence: jobAfterCancel.text.slice(0, 400),
  });

  // --- WORKFLOW 6 realtime ---
  try {
    const liveSlot = futureSlot(80);
    const pending = waitForEvent(SOCKET, 'ROOM_BOOKED', 6000);
    const liveCreate = await req('POST', '/bookings', {
      token: empToken,
      body: {
        roomId: activeRoom?.roomId,
        startTime: liveSlot.startTime,
        endTime: liveSlot.endTime,
        purpose: 'Realtime client A booking',
      },
    });
    const bookedPayload = await pending;
    record({
      feature: 'W6 Client B receives ROOM_BOOKED without refresh',
      expected: 'Second socket client gets ROOM_BOOKED after create',
      actual: `create=${liveCreate.status} event.bookingId=${(bookedPayload as any)?.bookingId}`,
      status:
        liveCreate.status === 201 &&
        (bookedPayload as any)?.bookingId === liveCreate.json?.data?.bookingId
          ? 'PASS'
          : 'FAIL',
      evidence: JSON.stringify(bookedPayload).slice(0, 300),
    });

    const cancelPending = waitForEvent(SOCKET, 'ROOM_CANCELLED', 6000);
    const liveCancel = await req('PATCH', `/bookings/${liveCreate.json?.data?.bookingId}/cancel`, {
      token: empToken,
    });
    const cancelPayload = await cancelPending;
    record({
      feature: 'W6 Client B receives ROOM_CANCELLED without refresh',
      expected: 'Second socket client gets ROOM_CANCELLED after cancel',
      actual: `cancel=${liveCancel.status} event.status=${(cancelPayload as any)?.status}`,
      status: liveCancel.status === 200 && (cancelPayload as any)?.status === 'CANCELLED' ? 'PASS' : 'FAIL',
      evidence: JSON.stringify(cancelPayload).slice(0, 300),
    });
  } catch (err: any) {
    record({
      feature: 'W6 Real-time Socket.IO',
      expected: 'Second client updates on book and cancel',
      actual: `Socket failure: ${err.message}`,
      status: 'FAIL',
      evidence: err.stack?.split('\n').slice(0, 3).join(' | ') || err.message,
    });
  }

  print();
  const failed = results.filter((r) => r.status !== 'PASS').length;
  process.exit(failed ? 1 : 0);
}

function print() {
  console.log('\n=== FEATURE | EXPECTED | ACTUAL | STATUS | EVIDENCE ===\n');
  for (const r of results) {
    console.log(
      `${r.feature} | ${r.expected} | ${r.actual} | ${r.status} | ${r.evidence.replace(/\s+/g, ' ').slice(0, 180)}`,
    );
  }
  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const blocked = results.filter((r) => r.status === 'BLOCKED').length;
  console.log(`\nSUMMARY pass=${pass} fail=${fail} blocked=${blocked} total=${results.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
