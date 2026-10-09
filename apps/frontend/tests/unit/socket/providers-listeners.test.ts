import { createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (...args: unknown[]) => void;

const listeners = new Map<string, Set<Handler>>();

function emit(event: string, payload?: unknown) {
  listeners.get(event)?.forEach((handler) => handler(payload));
}

const socket = {
  on: vi.fn((event: string, handler: Handler) => {
    const set = listeners.get(event) ?? new Set<Handler>();
    set.add(handler);
    listeners.set(event, set);
  }),
  off: vi.fn((event: string, handler?: Handler) => {
    if (!handler) {
      listeners.delete(event);
      return;
    }
    listeners.get(event)?.delete(handler);
  }),
};

vi.mock('../../../src/lib/socket', () => ({
  initSocket: () => socket,
}));

import Providers from '../../../src/lib/react-query';

function mount(ui: ReactNode): { root: Root; container: HTMLDivElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { root, container };
}

describe('Providers socket listeners', () => {
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    listeners.clear();
    socket.on.mockClear();
    socket.off.mockClear();
    invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
  });

  afterEach(() => {
    invalidateSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('invalidates booking and availability queries on ROOM_BOOKED', () => {
    const { root } = mount(createElement(Providers, null, createElement('div')));
    emit('ROOM_BOOKED', { bookingId: 'b1' });

    const keys = invalidateSpy.mock.calls.map((call) => (call[0] as { queryKey: string[] }).queryKey);
    expect(keys).toEqual(expect.arrayContaining([['bookings'], ['room-availability']]));

    act(() => {
      root.unmount();
    });
  });

  it('invalidates rooms on ROOM_UPDATED and ROOM_DELETED', () => {
    const { root } = mount(createElement(Providers, null, createElement('div')));
    emit('ROOM_UPDATED', { roomId: 'r1' });
    emit('ROOM_DELETED', { roomId: 'r1', deleted: true });

    const keys = invalidateSpy.mock.calls.map((call) => (call[0] as { queryKey: string[] }).queryKey);
    expect(keys).toEqual(expect.arrayContaining([['rooms'], ['room'], ['room-availability']]));

    act(() => {
      root.unmount();
    });
  });

  it('removes listeners on unmount so remount does not stack handlers', () => {
    const first = mount(createElement(Providers, null, createElement('div')));
    expect(listeners.get('ROOM_BOOKED')?.size).toBe(1);

    act(() => {
      first.root.unmount();
    });
    expect(listeners.get('ROOM_BOOKED')?.size ?? 0).toBe(0);

    emit('ROOM_BOOKED', { bookingId: 'ignored' });
    const afterUnmount = invalidateSpy.mock.calls.length;

    const second = mount(createElement(Providers, null, createElement('div')));
    expect(listeners.get('ROOM_BOOKED')?.size).toBe(1);

    emit('ROOM_BOOKED', { bookingId: 'b2' });
    expect(invalidateSpy.mock.calls.length).toBe(afterUnmount + 2);

    act(() => {
      second.root.unmount();
    });
  });
});
