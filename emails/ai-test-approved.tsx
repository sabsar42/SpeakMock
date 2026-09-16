import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface AiTestApprovedEmailProps {
  studentName: string;
  roomUrl: string;
  avatarName: string;
}

export default function AiTestApprovedEmail({
  studentName,
  roomUrl,
  avatarName,
}: AiTestApprovedEmailProps) {
  return (
    <EmailLayout previewText="Your AI Mock Test is ready — SpeakMock">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Your AI Mock Test is ready
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        Your payment has been verified. You can now start your AI mock
        speaking test with {avatarName}, your AI examiner.
      </Text>
      <Button
        href={roomUrl}
        className="mt-2 block w-full rounded-lg bg-primary px-5 py-3 text-center text-sm font-medium text-white"
      >
        Start My Test
      </Button>
      <Section className="mt-6 rounded-lg border border-solid border-border bg-background p-4">
        <Text className="m-0 text-sm text-secondary">
          Save this email — it contains your test link:
        </Text>
        <Text className="m-0 mt-2 break-all text-sm text-primary">
          {roomUrl}
        </Text>
      </Section>
      <Text className="mt-4 text-xs text-muted">
        Use Chrome or Edge on a quiet, well-lit space with a working
        microphone. The test takes about 15 minutes.
      </Text>
    </EmailLayout>
  );
}
