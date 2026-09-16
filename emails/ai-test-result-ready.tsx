import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface AiTestResultReadyEmailProps {
  studentName: string;
  resultUrl: string;
}

export default function AiTestResultReadyEmail({
  studentName,
  resultUrl,
}: AiTestResultReadyEmailProps) {
  return (
    <EmailLayout previewText="Your IELTS AI Mock Test result is ready — SpeakMock">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Your result is ready
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        Your AI Mock Test has been scored. View your band score, feedback,
        and download your PDF report.
      </Text>
      <Button
        href={resultUrl}
        className="mt-2 block w-full rounded-lg bg-primary px-5 py-3 text-center text-sm font-medium text-white"
      >
        View My Result
      </Button>
      <Text className="mt-4 text-xs text-muted">
        This link stays active for 72 hours.
      </Text>
    </EmailLayout>
  );
}
