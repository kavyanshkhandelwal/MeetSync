import { Server } from 'socket.io';

class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  init(server: any): void { 
    if (this.io) {
      console.warn('Socket.IO is already initialized');
      return;
    }

    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    console.log('Socket.IO server initialized');

    this.io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
      });
    });
  }

  emit(event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.IO is not initialized');
      return;
    }
    this.io.emit(event, data);
    console.log(`Emitted event: ${event}`, data);
  }

  emitBookingCreated(data: any): void {
    this.emit('ROOM_BOOKED', data);
  }

  emitBookingUpdated(data: any): void {
    this.emit('BOOKING_UPDATED', data);
  }

  emitBookingCancelled(data: any): void {
    this.emit('ROOM_CANCELLED', data);
  }

  emitRoomUpdated(data: any): void {
    this.emit('ROOM_UPDATED', data);
  }
}

export default SocketService.getInstance();
