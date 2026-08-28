import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface BookingConfirmedEmailProps {
  studentName: string;
  slotFormatted: string;
  meetLink: string;
  sessionUrl: string;
}

export default function BookingConfirmedEmail({
  studentName,
  slotFormatted,
  meetLink,
  sessionUrl,
}: BookingConfirmedEmailProps) {
  return (
    <EmailLayout previewText="Your booking is confirmed — SpeakMock">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Your booking is confirmed
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        Your session for{" "}
        <strong className="text-[#152430]">{slotFormatted}</strong> is
        confirmed.
      </Text>
      <Button
        href={meetLink}
        className="mt-2 block w-full rounded-lg bg-primary px-5 py-3 text-center text-sm font-medium text-white"
      >
        Join Google Meet
      </Button>
      <Section className="mt-6 rounded-lg border border-solid border-border bg-background p-4">
        <Text className="m-0 text-sm text-secondary">
          Save this email — it contains your session link:
        </Text>
        <Text className="m-0 mt-2 break-all text-sm text-primary">
          {sessionUrl}
        </Text>
      </Section>
      <Text className="mt-4 text-xs text-muted">
        Please be on time. No-shows are not eligible for a refund or
        automatic rescheduling.
      </Text>
    </EmailLayout>
  );
}
