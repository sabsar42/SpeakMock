import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/layout";

interface Reminder1hEmailProps {
  studentName: string;
  slotFormatted: string;
  meetLink: string;
}

export default function Reminder1hEmail({
  studentName,
  slotFormatted,
  meetLink,
}: Reminder1hEmailProps) {
  return (
    <EmailLayout previewText="Your session starts in 1 hour — SpeakMock">
      <Heading className="m-0 text-xl font-bold text-[#152430]">
        Your session starts in 1 hour
      </Heading>
      <Text className="text-secondary">Hi {studentName},</Text>
      <Text className="text-secondary">
        Your IELTS speaking mock test at{" "}
        <strong className="text-[#152430]">{slotFormatted}</strong> starts
        soon.
      </Text>
      <Button
        href={meetLink}
        className="mt-2 block w-full rounded-lg bg-accent px-5 py-4 text-center text-base font-semibold text-white"
      >
        Join Google Meet Now
      </Button>
      <Text className="mt-4 text-sm text-secondary">Quick checklist:</Text>
      <Text className="m-0 text-sm text-secondary">
        • Good lighting so the examiner can see you clearly
        <br />• A quiet room, free of interruptions
        <br />• Stable internet connection
      </Text>
    </EmailLayout>
  );
}
