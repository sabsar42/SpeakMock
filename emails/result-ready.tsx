import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface ResultReadyEmailProps {
  studentName: string;
  sessionUrl: string;
}

export default function ResultReadyEmail({
  studentName,
  sessionUrl,
}: ResultReadyEmailProps) {
  return (
    <EmailLayout previewText="Your IELTS result is ready — SpeakMock">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Your result is ready
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        Congratulations on completing your speaking session! Your examiner&apos;s
        feedback and band score are ready to download.
      </Text>
      <Button
        href={sessionUrl}
        className="mt-2 block w-full rounded-lg bg-accent px-5 py-3 text-center text-sm font-medium text-white"
      >
        Download Your Result
      </Button>
      <Text className="mt-4 text-xs text-muted">
        Your session page expires in 72 hours — download before then.
      </Text>
    </EmailLayout>
  );
}
