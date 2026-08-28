import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface BookingReceivedEmailProps {
  studentName: string;
  slotFormatted: string;
  transactionId: string;
  adminEmail: string;
}

export default function BookingReceivedEmail({
  studentName,
  slotFormatted,
  transactionId,
  adminEmail,
}: BookingReceivedEmailProps) {
  return (
    <EmailLayout previewText="We received your booking — SpeakMock">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        We received your booking
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        We&apos;ve received your booking request for{" "}
        <strong className="text-[#152430]">{slotFormatted}</strong>.
      </Text>
      <Text className="text-secondary">
        Transaction ID noted:{" "}
        <strong className="text-[#152430]">{transactionId}</strong>
      </Text>
      <Text className="text-secondary">
        We&apos;ll verify your payment and confirm your slot within a few
        hours. Check your Gmail for updates.
      </Text>
      <Text className="text-secondary">
        Questions? Reply to this email or contact {adminEmail}.
      </Text>
    </EmailLayout>
  );
}
