import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface AiTestRejectedEmailProps {
  studentName: string;
  reason: string;
  retryUrl: string;
}

export default function AiTestRejectedEmail({
  studentName,
  reason,
  retryUrl,
}: AiTestRejectedEmailProps) {
  return (
    <EmailLayout previewText="Update on your SpeakMock AI Mock Test booking">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Update on your AI Mock Test booking
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        We were unable to verify your payment for the AI Mock Test.
      </Text>
      <Text className="text-secondary">
        <strong className="text-[#152430]">Reason:</strong> {reason}
      </Text>
      <Text className="text-secondary">You&apos;re welcome to try again.</Text>
      <Button
        href={retryUrl}
        className="mt-2 rounded-lg bg-primary px-5 py-3 text-center text-sm font-medium text-white"
      >
        Try Again
      </Button>
    </EmailLayout>
  );
}
