import { Resend } from "resend";
import type { AiTestBooking, Booking } from "@/lib/types";
import { formatSlotDateTime } from "@/lib/utils";
import BookingReceivedEmail from "@/emails/booking-received";
import NewBookingAlertEmail from "@/emails/new-booking-alert";
import BookingConfirmedEmail from "@/emails/booking-confirmed";
import BookingRejectedEmail from "@/emails/booking-rejected";
import Reminder24hEmail from "@/emails/reminder-24h";
import Reminder1hEmail from "@/emails/reminder-1h";
import ResultReadyEmail from "@/emails/result-ready";
import ResendLinkEmail from "@/emails/resend-link";
import AiTestReceivedEmail from "@/emails/ai-test-received";
import NewAiTestAlertEmail from "@/emails/new-ai-test-alert";
import AiTestApprovedEmail from "@/emails/ai-test-approved";
import AiTestRejectedEmail from "@/emails/ai-test-rejected";
import AiTestResultReadyEmail from "@/emails/ai-test-result-ready";

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

// --- AI Avatar Test emails ---

export async function sendAiTestReceivedEmail(booking: AiTestBooking) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.student_email,
    subject: "Payment received, verifying — SpeakMock AI Mock Test",
    react: AiTestReceivedEmail({
      studentName: booking.student_name,
      transactionId: booking.transaction_id,
      adminEmail: ADMIN_EMAIL,
    }),
  });
}

export async function sendNewAiTestAlertEmail(booking: AiTestBooking) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[Action Required] New AI Test Booking — ${booking.student_name}`,
    react: NewAiTestAlertEmail({
      studentName: booking.student_name,
      studentEmail: booking.student_email,
      transactionId: booking.transaction_id,
      reviewUrl: `${APP_URL}/admin/ai-test/${booking.id}`,
    }),
  });
}

export async function sendAiTestApprovedEmail(booking: AiTestBooking, token: string) {
  const avatarName = process.env.NEXT_PUBLIC_AVATAR_NAME ?? "Rami";
  await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.student_email,
    subject: "Your AI Mock Test is ready — SpeakMock",
    react: AiTestApprovedEmail({
      studentName: booking.student_name,
      roomUrl: `${APP_URL}/ai-test/room/${token}`,
      avatarName,
    }),
  });
}

export async function sendAiTestRejectedEmail(booking: AiTestBooking, reason: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.student_email,
    subject: "Update on your SpeakMock AI Mock Test booking",
    react: AiTestRejectedEmail({
      studentName: booking.student_name,
      reason,
      retryUrl: `${APP_URL}/ai-test/pay`,
    }),
  });
}

export async function sendAiTestResultReadyEmail(booking: AiTestBooking, token: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: booking.student_email,
    subject: "Your IELTS AI Mock Test result is ready — SpeakMock",
    react: AiTestResultReadyEmail({
      studentName: booking.student_name,
      resultUrl: `${APP_URL}/ai-test/result/${token}`,
    }),
  });
}
