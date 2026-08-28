"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResultUpload } from "@/components/result-upload";
import { formatSlotDateTime } from "@/lib/utils";
import type { Booking, Session } from "@/lib/types";

const badgeVariantByStatus: Record<
  Booking["booking_status"],
  "pending" | "confirmed" | "completed" | "rejected"
> = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  rejected: "rejected",
};

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [meetLink, setMeetLink] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");

  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadBooking = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load booking.");
      setBooking(data.booking);
      setSession(data.session);
      setNotes(data.booking.admin_notes ?? "");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load booking.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function saveNotes() {
    if (!booking || notes === (booking.admin_notes ?? "")) return;
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: notes }),
      });
    } catch {
      // Non-critical; notes will just be retried on next blur.
    }
  }

  async function handleConfirm() {
    setIsConfirming(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id, meet_link: meetLink }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not confirm booking.");
      await loadBooking();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not confirm booking.");
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleCompleteSession() {
    setIsCompleting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/complete-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not complete session.");
      await loadBooking();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not complete session.");
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id, rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reject booking.");
      await loadBooking();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not reject booking.");
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
          <h1 className="text-xl font-bold text-text-primary">
            Speak<span className="text-primary">Mock</span> Admin
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {isLoading && (
          <p className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading booking...
          </p>
        )}

        {!isLoading && loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
            {loadError}
          </div>
        )}

        {!isLoading && booking && (
          <>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>{booking.student_name}</CardTitle>
                <Badge variant={badgeVariantByStatus[booking.booking_status]}>
                  {booking.booking_status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      Gmail
                    </p>
                    <p className="mt-1 text-sm text-text-primary">{booking.student_email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      Phone
                    </p>
                    <p className="mt-1 text-sm text-text-primary">{booking.student_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      Slot
                    </p>
                    <p className="mt-1 text-sm text-text-primary">
                      {formatSlotDateTime(booking.slot_datetime)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Transaction ID
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-border bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-text-primary">
                      {booking.transaction_id}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(booking.transaction_id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={saveNotes}
                    placeholder="Private notes about this booking..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {actionError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-error">
                    {actionError}
                  </div>
                )}

                {booking.booking_status === "pending" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meet-link">Paste Google Meet link here</Label>
                      <Input
                        id="meet-link"
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                        value={meetLink}
                        onChange={(e) => setMeetLink(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        disabled={meetLink.trim() === "" || isConfirming}
                        onClick={handleConfirm}
                      >
                        {isConfirming ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          "Confirm Booking"
                        )}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setShowRejectForm((v) => !v)}
                      >
                        Reject Booking
                      </Button>
                    </div>
                    {showRejectForm && (
                      <div className="space-y-3 rounded-lg border border-red-100 bg-red-50/50 p-4">
                        <Label htmlFor="reason">Rejection Reason</Label>
                        <Textarea
                          id="reason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Why is this booking being rejected?"
                        />
                        <Button
                          variant="danger"
                          disabled={rejectionReason.trim() === "" || isRejecting}
                          onClick={handleReject}
                        >
                          {isRejecting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Rejection"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {booking.booking_status === "confirmed" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3.5 py-2.5 text-sm text-text-primary">
                      <Video className="h-4 w-4 text-text-secondary" />
                      {session?.meet_link ?? "No Meet link on file"}
                    </div>
                    <Button onClick={handleCompleteSession} disabled={isCompleting}>
                      {isCompleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        "Mark Session as Complete"
                      )}
                    </Button>
                    <p className="text-xs text-text-muted">
                      Clicking this will start the 72-hour expiry countdown for
                      the student&apos;s session page.
                    </p>
                  </div>
                )}

                {booking.booking_status === "completed" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                          Completed At
                        </p>
                        <p className="mt-1 text-sm text-text-primary">
                          {session?.session_completed_at
                            ? formatSlotDateTime(session.session_completed_at)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                          Expires At
                        </p>
                        <p className="mt-1 font-mono text-sm text-text-secondary">
                          {session?.expires_at
                            ? formatSlotDateTime(session.expires_at)
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <ResultUpload
                      bookingId={id}
                      existingFileName={
                        session?.result_file_path
                          ? session.result_file_path.split("/").pop() ?? null
                          : null
                      }
                      onUploaded={() => loadBooking()}
                    />
                  </div>
                )}

                {booking.booking_status === "rejected" && (
                  <p className="text-sm text-text-secondary">
                    This booking was rejected. Reason: {booking.rejection_reason}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
