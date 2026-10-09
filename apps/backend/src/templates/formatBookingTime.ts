export type BookingSchedule = {
  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  range: string;
};

export function formatBookingSchedule(
  start: Date,
  end: Date | undefined,
  timeZone: string,
): BookingSchedule {
  const dateFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const date = dateFmt.format(start);
  const startTime = timeFmt.format(start);
  const endTime = end ? timeFmt.format(end) : '—';
  return {
    date,
    startTime,
    endTime,
    timeZone,
    range: end ? `${date}, ${startTime}–${endTime} ${timeZone}` : `${date}, ${startTime} ${timeZone}`,
  };
}
