import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface NewAiTestAlertEmailProps {
  studentName: string;
  studentEmail: string;
  transactionId: string;
  reviewUrl: string;
}

export default function NewAiTestAlertEmail({
  studentName,
  studentEmail,
  transactionId,
  reviewUrl,
}: NewAiTestAlertEmailProps) {
  return (
    <EmailLayout previewText={`New AI Test Booking — ${studentName}`}>
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Action Required: New AI Test Booking
      </Heading>
      <Section className="mt-4 rounded-lg border border-solid border-border bg-background p-4">
        <Text className="m-0 text-sm text-secondary">
          <strong className="text-[#152430]">Name:</strong> {studentName}
        </Text>
        <Text className="m-0 mt-2 text-sm text-secondary">
          <strong className="text-[#152430]">Gmail:</strong> {studentEmail}
        </Text>
        <Text className="m-0 mt-2 text-sm text-secondary">
          <strong className="text-[#152430]">Transaction ID:</strong>{" "}
          {transactionId}
        </Text>
      </Section>
      <Button
        href={reviewUrl}
        className="mt-6 rounded-lg bg-primary px-5 py-3 text-center text-sm font-medium text-white"
      >
        Review this booking
      </Button>
    </EmailLayout>
  );
}
