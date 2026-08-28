import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface ResendLinkEmailProps {
  sessionUrl: string;
}

export default function ResendLinkEmail({ sessionUrl }: ResendLinkEmailProps) {
  return (
    <EmailLayout previewText="Your SpeakMock session link">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Here&apos;s your session link
      </Heading>
      <Text className="text-secondary">
        As requested, here is the link to your SpeakMock session page:
      </Text>
      <Button
        href={sessionUrl}
        className="mt-2 block w-full rounded-lg bg-primary px-5 py-3 text-center text-sm font-medium text-white"
      >
        Go to My Session
      </Button>
      <Text className="mt-4 text-xs text-muted">
        Note: session pages expire 72 hours after your test is marked
        complete.
      </Text>
    </EmailLayout>
  );
}
