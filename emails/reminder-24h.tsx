import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface Reminder24hEmailProps {
  studentName: string;
  slotFormatted: string;
  meetLink: string;
  sessionUrl: string;
}

export default function Reminder24hEmail({
  studentName,
  slotFormatted,
  meetLink,
  sessionUrl,
}: Reminder24hEmailProps) {
  return (
    <EmailLayout previewText="Your mock test is tomorrow — SpeakMock">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Your mock test is tomorrow
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        This is a reminder that your IELTS speaking mock test is scheduled
        for <strong className="text-[#152430]">{slotFormatted}</strong>.
      </Text>
      <Text className="text-secondary">A few things to prepare:</Text>
      <Text className="m-0 text-sm text-secondary">
        • Find a quiet room with stable internet
        <br />• Test your camera and microphone beforehand
        <br />• Have a valid ID ready if requested
      </Text>
      <Button
        href={meetLink}
        className="mt-4 block w-full rounded-lg bg-primary px-5 py-3 text-center text-sm font-medium text-white"
      >
        Join Google Meet
      </Button>
      <Text className="mt-4 text-xs text-muted">
        Session page:{" "}
        <a href={sessionUrl} className="text-primary">
          {sessionUrl}
        </a>
      </Text>
    </EmailLayout>
  );
}
