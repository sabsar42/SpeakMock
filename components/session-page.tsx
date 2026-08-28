"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountdownTimer } from "@/components/countdown-timer";
import { formatSlotDateTime } from "@/lib/utils";
import type { PublicSessionData } from "@/lib/types";

const badgeVariantByStatus: Record<PublicSessionData["booking_status"], "pending" | "confirmed" | "completed" | "rejected"> = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  rejected: "rejected",
};

export function SessionPage({ session }: { session: PublicSessionData }) {
  const [bookAnotherHref] = useState(
    `/book?name=${encodeURIComponent(session.student_name)}&email=${encodeURIComponent(
      session.student_email
    )}`
  );

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              {session.student_name}
            </h1>
            <p className="text-sm text-text-secondary">{session.student_email}</p>
          </div>
          <Badge variant={badgeVariantByStatus[session.booking_status]}>
            {session.booking_status}
          </Badge>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Session Slot
          </p>
          <p className="mt-1 text-base font-medium text-text-primary">
            {formatSlotDateTime(session.slot_datetime)}
          </p>
        </div>

        {session.meet_link && (
          <div className="mt-6">
            <Button asChild size="lg" className="w-full">
              <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4" />
                Join Google Meet
              </a>
            </Button>
          </div>
        )}

        {session.result_file_url && (
          <div className="mt-4">
            <Button asChild variant="secondary" size="lg" className="w-full">
              <a href={session.result_file_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download Your Result
              </a>
            </Button>
          </div>
        )}

        {session.expires_at && session.session_completed_at && (
          <div className="mt-6 border-t border-border pt-4">
            <CountdownTimer expiresAt={session.expires_at} />
          </div>
        )}
      </Card>

      <div className="mt-8 text-center">
        <Button asChild variant="secondary">
          <Link href={bookAnotherHref}>Book Another Session</Link>
        </Button>
      </div>
    </div>
  );
}
