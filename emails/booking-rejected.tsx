import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface BookingRejectedEmailProps {
  studentName: string;
  slotFormatted: string;
  reason: string;
  bookUrl: string;
}

export default function BookingRejectedEmail({
  studentName,
  slotFormatted,
  reason,
  bookUrl,
}: BookingRejectedEmailProps) {
  return (
    <EmailLayout previewText="Update on your SpeakMock booking">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Update on your booking
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        We were unable to confirm your booking for{" "}
        <strong className="text-[#152430]">{slotFormatted}</strong>.
      </Text>
      <Text className="text-secondary">
        <strong className="text-[#152430]">Reason:</strong> {reason}
      </Text>
      <Text className="text-secondary">You&apos;re welcome to book again.</Text>
      <Button
        href={bookUrl}
        className="mt-2 rounded-lg bg-primary px-5 py-3 text-center text-sm font-medium text-white"
      >
        Book Another Session
      </Button>
    </EmailLayout>
  );
}
