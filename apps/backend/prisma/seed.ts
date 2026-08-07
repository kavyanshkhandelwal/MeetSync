import { PrismaClient, Role, BookingStatus, ActionType, EntityType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Create users: 1 Admin, 5 Employees
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await prisma.user.createManyAndReturn({
    data: [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@company.com',
        passwordHash: hashedPassword,
        role: Role.ADMIN,
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        passwordHash: hashedPassword,
        role: Role.EMPLOYEE,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        passwordHash: hashedPassword, 
        role: Role.EMPLOYEE,
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@company.com',
        passwordHash: hashedPassword, 
        role: Role.EMPLOYEE,
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@company.com',
        passwordHash: hashedPassword, 
        role: Role.EMPLOYEE,
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@company.com',
        passwordHash: hashedPassword, 
        role: Role.EMPLOYEE,
      },
    ],
  });

  console.log(`Created ${users.length} users`);

  // 2. Create 10 Rooms
  const rooms = await prisma.room.createManyAndReturn({
    data: [
      {
        name: 'Executive Boardroom',
        capacity: 20,
        floor: 10,
        building: 'Main Tower',
        description: 'High-end conference room with video conferencing',
        equipments: ['Projector', 'Video Conference', 'Whiteboard', 'Coffee Machine'],
      },
      {
        name: 'Innovation Lab',
        capacity: 15,
        floor: 5,
        building: 'West Wing',
        description: 'Creative workspace for brainstorming',
        equipments: ['Whiteboard', 'TV', 'Speakers', 'Marker Set'],
      },
      {
        name: 'Small Meeting Room A',
        capacity: 6,
        floor: 3,
        building: 'Main Tower',
        description: 'Cozy space for small team meetings',
        equipments: ['TV', 'Whiteboard'],
      },
      {
        name: 'Small Meeting Room B',
        capacity: 6,
        floor: 3,
        building: 'Main Tower',
        description: 'Cozy space for small team meetings',
        equipments: ['TV', 'Whiteboard'],
      },
      {
        name: 'Training Room',
        capacity: 30,
        floor: 2,
        building: 'East Annex',
        description: 'Large training facility with seating',
        equipments: ['Projector', 'Sound System', 'Microphone', 'Whiteboard'],
      },
      {
        name: 'Quiet Room',
        capacity: 4,
        floor: 7,
        building: 'Main Tower',
        description: 'For focused work and 1-on-1s',
        equipments: ['WiFi', 'Power Outlets'],
      },
      {
        name: 'Sales Conference Room',
        capacity: 12,
        floor: 4,
        building: 'West Wing',
        description: 'Equipped for client presentations',
        equipments: ['Projector', 'Video Conference', 'Whiteboard'],
      },
      {
        name: 'Engineering Huddle',
        capacity: 8,
        floor: 8,
        building: 'Main Tower',
        description: 'Standup and technical discussion space',
        equipments: ['TV', 'Whiteboard'],
      },
      {
        name: 'Board Meeting Room',
        capacity: 18,
        floor: 9,
        building: 'Main Tower',
        description: 'Formal board meeting space',
        equipments: ['Projector', 'Video Conference', 'Whiteboard', 'Coffee Machine'],
      },
      {
        name: 'Lounge Area',
        capacity: 25,
        floor: 1,
        building: 'Main Tower',
        description: 'Casual meeting and collaboration space',
        equipments: ['TV', 'Speakers', 'Coffee Machine'],
      },
    ],
  });

  console.log(`Created ${rooms.length} rooms`);

  // 3. Create 20 Sample Bookings
  const today = new Date();
  const bookings = [];

  // Helper to add days
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Helper to set time
  const setTime = (date: Date, hours: number, minutes: number = 0) => {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };

  // Generate bookings for the next 7 days
  const bookingData = [
    { userIdx: 1, roomIdx: 0, day: 0, startHour: 9, endHour: 10, status: BookingStatus.CONFIRMED },
    { userIdx: 2, roomIdx: 2, day: 0, startHour: 10, endHour: 11, status: BookingStatus.CONFIRMED },
    { userIdx: 3, roomIdx: 4, day: 0, startHour: 13, endHour: 15, status: BookingStatus.CONFIRMED },
    { userIdx: 1, roomIdx: 1, day: 1, startHour: 9, endHour: 12, status: BookingStatus.PENDING },
    { userIdx: 4, roomIdx: 5, day: 1, startHour: 10, endHour: 11, status: BookingStatus.CONFIRMED },
    { userIdx: 5, roomIdx: 7, day: 1, startHour: 14, endHour: 15, status: BookingStatus.CONFIRMED },
    { userIdx: 2, roomIdx: 6, day: 2, startHour: 9, endHour: 10, status: BookingStatus.CANCELLED },
    { userIdx: 3, roomIdx: 3, day: 2, startHour: 11, endHour: 13, status: BookingStatus.CONFIRMED },
    { userIdx: 1, roomIdx: 8, day: 2, startHour: 14, endHour: 16, status: BookingStatus.CONFIRMED },
    { userIdx: 4, roomIdx: 9, day: 3, startHour: 10, endHour: 12, status: BookingStatus.PENDING },
    { userIdx: 5, roomIdx: 0, day: 3, startHour: 13, endHour: 14, status: BookingStatus.CONFIRMED },
    { userIdx: 2, roomIdx: 1, day: 3, startHour: 15, endHour: 17, status: BookingStatus.CONFIRMED },
    { userIdx: 3, roomIdx: 4, day: 4, startHour: 9, endHour: 11, status: BookingStatus.CONFIRMED },
    { userIdx: 1, roomIdx: 5, day: 4, startHour: 11, endHour: 12, status: BookingStatus.CONFIRMED },
    { userIdx: 4, roomIdx: 7, day: 4, startHour: 14, endHour: 15, status: BookingStatus.PENDING },
    { userIdx: 5, roomIdx: 2, day: 5, startHour: 9, endHour: 10, status: BookingStatus.CONFIRMED },
    { userIdx: 2, roomIdx: 6, day: 5, startHour: 10, endHour: 12, status: BookingStatus.CONFIRMED },
    { userIdx: 3, roomIdx: 8, day: 5, startHour: 14, endHour: 16, status: BookingStatus.CONFIRMED },
    { userIdx: 1, roomIdx: 9, day: 6, startHour: 9, endHour: 11, status: BookingStatus.PENDING },
    { userIdx: 4, roomIdx: 3, day: 6, startHour: 13, endHour: 14, status: BookingStatus.CONFIRMED },
  ];

  const purposes = [
    'Q4 Planning Meeting',
    'Client Presentation',
    'Team Standup',
    'Project Review',
    'Interview',
    'Training Session',
    'Brainstorming',
    'Budget Discussion',
    'Product Demo',
    'Strategy Meeting',
  ];

  for (const [i, data] of bookingData.entries()) {
    const bookingDate = addDays(today, data.day);
    const startTime = setTime(bookingDate, data.startHour);
    const endTime = setTime(bookingDate, data.endHour);

    const booking = await prisma.booking.create({
      data: {
        userId: users[data.userIdx].userId,
        roomId: rooms[data.roomIdx].roomId, 
        startTime: startTime,
        endTime: endTime,
        purpose: purposes[i % purposes.length],
        status: data.status,
      },
    });

    bookings.push(booking);
  }

  console.log(`Created ${bookings.length} bookings`);

  // 4. Create some sample Audit Logs
  const auditLogs = await prisma.auditLog.createMany({
    data: [
      {
        userId: users[0].userId,
        action: ActionType.ROOM_CREATED,
        entityType: EntityType.ROOM,
        entityId: rooms[0].roomId,
      },
      {
        userId: users[1].userId,
        action: ActionType.BOOKING_CREATED,
        entityType: EntityType.BOOKING,
        entityId: bookings[0].bookingId, 
      },
      {
        userId: users[0].userId,
        action: ActionType.BOOKING_UPDATED,
        entityType: EntityType.BOOKING,
        entityId: bookings[0].bookingId,
      },
    ],
  });

  console.log(`Created audit logs`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
