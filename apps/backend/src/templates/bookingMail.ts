export type BookingMailFields = {
  bookingId: string;
  purpose: string;
  roomName: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detailsTable(fields: BookingMailFields): string {
  const rows: Array<[string, string]> = [
    ['Room', fields.roomName],
    ['Date', fields.date],
    ['Start', `${fields.startTime} ${fields.timeZone}`],
    ['End', `${fields.endTime} ${fields.timeZone}`],
    ['Purpose', fields.purpose],
    ['Status', fields.status],
    ['Booking ID', fields.bookingId],
  ];
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:480px">
    ${rows
      .map(
        ([label, value]) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:140px">${escapeHtml(label)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827">${escapeHtml(value)}</td>
          </tr>`,
      )
      .join('')}
  </table>`;
}

function detailsText(fields: BookingMailFields): string {
  return [
    `Room: ${fields.roomName}`,
    `Date: ${fields.date}`,
    `Start: ${fields.startTime} ${fields.timeZone}`,
    `End: ${fields.endTime} ${fields.timeZone}`,
    `Purpose: ${fields.purpose}`,
    `Status: ${fields.status}`,
    `Booking ID: ${fields.bookingId}`,
  ].join('\n');
}

function wrapHtml(title: string, intro: string, fields: BookingMailFields): string {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#111827">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
          <p style="margin:0 0 20px;color:#374151">${escapeHtml(intro)}</p>
          ${detailsTable(fields)}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function bookingConfirmationMail(fields: BookingMailFields): { subject: string; text: string; html: string } {
  const title = `Booking confirmed: ${fields.roomName}`;
  const intro = 'Your conference room booking has been created.';
  return {
    subject: title,
    text: `${intro}\n\n${detailsText(fields)}`,
    html: wrapHtml(title, intro, fields),
  };
}

export function bookingReminderMail(fields: BookingMailFields): { subject: string; text: string; html: string } {
  const title = `Reminder: ${fields.roomName} starts soon`;
  const intro = 'This is a reminder that your conference room booking is about to start.';
  return {
    subject: title,
    text: `${intro}\n\n${detailsText(fields)}`,
    html: wrapHtml(title, intro, fields),
  };
}

export function bookingCancellationMail(fields: BookingMailFields): { subject: string; text: string; html: string } {
  const title = `Booking cancelled: ${fields.roomName}`;
  const intro = 'Your conference room booking has been cancelled. Any scheduled reminder will not be sent.';
  return {
    subject: title,
    text: `${intro}\n\n${detailsText(fields)}`,
    html: wrapHtml(title, intro, fields),
  };
}
