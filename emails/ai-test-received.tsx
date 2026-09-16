import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface AiTestReceivedEmailProps {
  studentName: string;
  transactionId: string;
  adminEmail: string;
}

export default function AiTestReceivedEmail({
  studentName,
  transactionId,
  adminEmail,
}: AiTestReceivedEmailProps) {
  return (
    <EmailLayout previewText="Payment received, verifying — SpeakMock AI Mock Test">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        We&apos;re verifying your payment
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        We&apos;ve received your AI Mock Test booking. Transaction ID noted:{" "}
        <strong className="text-[#152430]">{transactionId}</strong>
      </Text>
      <Text className="text-secondary">
        Once we verify your payment, your unique test room link will arrive at
        this Gmail address within a few hours.
      </Text>
      <Text className="text-secondary">
        Questions? Reply to this email or contact {adminEmail}.
      </Text>
    </EmailLayout>
  );
}
