import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                primary: "#1F4A68",
                accent: "#C25C15",
                background: "#F7FAFC",
                border: "#E1E8ED",
                secondary: "#4B6373",
                muted: "#8098A8",
              },
            },
          },
        }}
      >
        <Body className="bg-background font-sans">
          <Container className="mx-auto my-8 max-w-[480px] rounded-xl border border-solid border-border bg-white p-8">
            <Text className="m-0 text-lg font-bold text-[#152430]">
              Speak<span className="text-primary">Mock</span>
            </Text>
            <Section className="mt-6">{children}</Section>
            <Section className="mt-8 border-t border-solid border-border pt-4">
              <Text className="m-0 text-xs text-muted">
                SpeakMock — IELTS Speaking Practice, Simplified
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
