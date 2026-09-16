import { Resend } from "resend";
import type { Booking } from "@/lib/types";
import { formatSlotDateTime } from "@/lib/utils";
import BookingReceivedEmail from "@/emails/booking-received";
import NewBookingAlertEmail from "@/emails/new-booking-alert";
import BookingConfirmedEmail from "@/emails/booking-confirmed";
import BookingRejectedEmail from "@/emails/booking-rejected";
import Reminder24hEmail from "@/emails/reminder-24h";
import Reminder1hEmail from "@/emails/reminder-1h";
import ResultReadyEmail from "@/emails/result-ready";
import ResendLinkEmail from "@/emails/resend-link";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL!;
export const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL!;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendBookingReceivedEmail(booking: Booking) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.student_email,
    subject: "We received your booking — SpeakMock",
    react: BookingReceivedEmail({
      studentName: booking.student_name,
      slotFormatted: formatSlotDateTime(booking.slot_datetime),
      transactionId: booking.transaction_id,
      adminEmail: ADMIN_EMAIL,
    }),
  });
}

export async function sendAdminBookingAlertEmail(booking: Booking) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[Action Required] New Booking — ${booking.student_name} — ${formatSlotDateTime(
      booking.slot_datetime
    )}`,
    react: NewBookingAlertEmail({
      studentName: booking.student_name,
      studentEmail: booking.student_email,
      studentPhone: booking.student_phone,
      slotFormatted: formatSlotDateTime(booking.slot_datetime),
      transactionId: booking.transaction_id,
      reviewUrl: `${APP_URL}/admin/booking/${booking.id}`,
    }),
  });
}

export async function sendBookingConfirmedEmailOnly(
  booking: Booking,
  meetLink: string,
  sessionToken: string
) {
  const sessionUrl = `${APP_URL}/session/${sessionToken}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.student_email,
    subject: "Your booking is confirmed — SpeakMock",
    react: BookingConfirmedEmail({
      studentName: booking.student_name,
      slotFormatted: formatSlotDateTime(booking.slot_datetime),
      meetLink,
      sessionUrl,
    }),
  });
}

export async function sendBookingConfirmedEmail(
  booking: Booking,
  meetLink: string,
  sessionToken: string
) {
  await sendBookingConfirmedEmailOnly(booking, meetLink, sessionToken);
  const sessionUrl = `${APP_URL}/session/${sessionToken}`;

  const slotTime = new Date(booking.slot_datetime).getTime();
  const in24h = slotTime - 24 * 60 * 60 * 1000;
  const in1h = slotTime - 60 * 60 * 1000;
  const now = Date.now();

  if (in24h > now) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.student_email,
      subject: "Your mock test is tomorrow — SpeakMock",
      react: Reminder24hEmail({
        studentName: booking.student_name,
        slotFormatted: formatSlotDateTime(booking.slot_datetime),
        meetLink,
        sessionUrl,
      }),
      scheduledAt: new Date(in24h).toISOString(),
    });
  }

  if (in1h > now) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.student_email,
      subject: "Your session starts in 1 hour — SpeakMock",
      react: Reminder1hEmail({
        studentName: booking.student_name,
        slotFormatted: formatSlotDateTime(booking.slot_datetime),
        meetLink,
      }),
      scheduledAt: new Date(in1h).toISOString(),
    });
  }
}

export async function sendResultReadyEmail(booking: Booking, sessionToken: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.student_email,
    subject: "Your IELTS result is ready — SpeakMock",
    react: ResultReadyEmail({
      studentName: booking.student_name,
      sessionUrl: `${APP_URL}/session/${sessionToken}`,
    }),
  });
}

export async function sendBookingRejectedEmail(booking: Booking, reason: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.student_email,
    subject: "Update on your SpeakMock booking",
    react: BookingRejectedEmail({
      studentName: booking.student_name,
      slotFormatted: formatSlotDateTime(booking.slot_datetime),
      reason,
      bookUrl: `${APP_URL}/book`,
    }),
  });
}

export async function sendResendLinkEmail(studentEmail: string, sessionToken: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: studentEmail,
    subject: "Your SpeakMock session link",
    react: ResendLinkEmail({
      sessionUrl: `${APP_URL}/session/${sessionToken}`,
    }),
  });
}
