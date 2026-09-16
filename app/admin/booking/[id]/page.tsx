"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Mail, Video } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResultUpload } from "@/components/result-upload";
import { formatSlotDateTime } from "@/lib/utils";
import type { AdminActivityLogEntry, Booking, Session } from "@/lib/types";

const badgeVariantByStatus: Record<
  Booking["booking_status"],
  "pending" | "confirmed" | "completed" | "rejected"
> = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  rejected: "rejected",
};

const ACTION_LABELS: Record<string, string> = {
  submitted: "Booking submitted",
  confirmed: "Booking confirmed",
  rejected: "Booking rejected",
  completed: "Session marked complete",
  result_uploaded: "Result uploaded",
  confirmation_resent: "Confirmation email resent",
  rescheduled: "Rescheduled",
  rebook_allowed: "Rebooking allowed",
  result_email_resent: "Result email resent",
};

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activity, setActivity] = useState<AdminActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [meetLink, setMeetLink] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newSlotDatetime, setNewSlotDatetime] = useState("");

  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isAllowingRebook, setIsAllowingRebook] = useState(false);
  const [isResendingResult, setIsResendingResult] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);

  const loadBooking = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [bookingRes, activityRes] = await Promise.all([
        fetch(`/api/admin/bookings/${id}`),
        fetch(`/api/admin/activity/${id}`),
      ]);
      const data = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(data.error ?? "Could not load booking.");
      setBooking(data.booking);
      setSession(data.session);
      setNotes(data.booking.admin_notes ?? "");
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivity(activityData.entries ?? []);
      }
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

  async function runAction(
    setBusy: (v: boolean) => void,
    url: string,
    body: Record<string, unknown>,
    successMessage: string
  ) {
    setBusy(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed.");
      setActionSuccess(successMessage);
      await loadBooking();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Booking Detail">
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <AdminCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">{booking.student_name}</h2>
                <Badge variant={badgeVariantByStatus[booking.booking_status]}>
                  {booking.booking_status}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Gmail
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">{booking.student_email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Phone
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">{booking.student_phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Slot
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {formatSlotDateTime(booking.slot_datetime)}
                  </p>
                  {booking.rescheduled_from && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      Rescheduled from {formatSlotDateTime(booking.rescheduled_from)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Transaction ID
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-lg border border-border bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-text-secondary">
                    {booking.transaction_id}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(booking.transaction_id);
                      setCopiedTx(true);
                      setTimeout(() => setCopiedTx(false), 1500);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copiedTx && <p className="mt-1 text-xs text-success">Copied!</p>}
              </div>

              <div className="mt-4 space-y-2">
                <Label className="text-text-secondary">Admin Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Private notes about this booking..."
                  className="border-border bg-gray-50 text-text-primary placeholder:text-text-muted"
                />
              </div>
            </AdminCard>

            <AdminCard>
              <h2 className="mb-4 text-sm font-semibold text-text-primary">Actions</h2>

              {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-error">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-success">
                  {actionSuccess}
                </div>
              )}

              {booking.booking_status === "pending" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-text-secondary">Paste Google Meet link here</Label>
                    <Input
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      value={meetLink}
                      onChange={(e) => setMeetLink(e.target.value)}
                      className="border-border bg-gray-50 text-text-primary placeholder:text-text-muted"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={meetLink.trim() === "" || isConfirming}
                      onClick={() =>
                        runAction(
                          setIsConfirming,
                          "/api/admin/confirm",
                          { booking_id: id, meet_link: meetLink },
                          "Booking confirmed."
                        )
                      }
                    >
                      {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
                      Confirm Booking
                    </Button>
                    <Button variant="danger" onClick={() => setShowRejectForm((v) => !v)}>
                      Reject Booking
                    </Button>
                  </div>
                  {showRejectForm && (
                    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                      <Label className="text-text-secondary">Rejection Reason</Label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Why is this booking being rejected?"
                        className="border-border bg-gray-50 text-text-primary placeholder:text-text-muted"
                      />
                      <Button
                        variant="danger"
                        disabled={rejectionReason.trim() === "" || isRejecting}
                        onClick={() =>
                          runAction(
                            setIsRejecting,
                            "/api/admin/reject",
                            { booking_id: id, rejection_reason: rejectionReason },
                            "Rejection sent."
                          )
                        }
                      >
                        {isRejecting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Send Rejection
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {booking.booking_status === "confirmed" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3.5 py-2.5 text-sm text-text-secondary">
                    <Video className="h-4 w-4 text-text-muted" />
                    {session?.meet_link ?? "No Meet link on file"}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() =>
                        runAction(
                          setIsCompleting,
                          "/api/admin/complete-session",
                          { booking_id: id },
                          "Session marked complete."
                        )
                      }
                      disabled={isCompleting}
                    >
                      {isCompleting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Mark Session as Complete
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isResending}
                      onClick={() =>
                        runAction(
                          setIsResending,
                          "/api/admin/resend-confirmation",
                          { booking_id: id },
                          "Confirmation email resent."
                        )
                      }
                    >
                      {isResending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Resend Confirmation Email
                    </Button>
                    <Button variant="outline" onClick={() => setShowRescheduleForm((v) => !v)}>
                      Reschedule
                    </Button>
                  </div>

                  {showRescheduleForm && (
                    <div className="space-y-3 rounded-lg border border-border bg-gray-50 p-4">
                      <Label className="text-text-secondary">New Slot (must already exist as available)</Label>
                      <Input
                        type="datetime-local"
                        value={newSlotDatetime}
                        onChange={(e) => setNewSlotDatetime(e.target.value)}
                        className="border-border bg-white text-text-primary"
                      />
                      <Button
                        disabled={!newSlotDatetime || isRescheduling}
                        onClick={() =>
                          runAction(
                            setIsRescheduling,
                            "/api/admin/booking/reschedule",
                            {
                              booking_id: id,
                              new_slot_datetime: new Date(newSlotDatetime).toISOString(),
                            },
                            "Booking rescheduled."
                          )
                        }
                      >
                        {isRescheduling && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirm Reschedule
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-text-muted">
                    Marking complete starts the 72-hour expiry countdown for the student&apos;s
                    session page.
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
                      <p className="mt-1 text-sm text-text-secondary">
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
                        {session?.expires_at ? formatSlotDateTime(session.expires_at) : "—"}
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
                  {session?.result_file_path && (
                    <Button
                      variant="outline"
                      disabled={isResendingResult}
                      onClick={() =>
                        runAction(
                          setIsResendingResult,
                          "/api/admin/resend-result-email",
                          { booking_id: id },
                          "Result email resent."
                        )
                      }
                    >
                      {isResendingResult ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Send Result Ready Email Again
                    </Button>
                  )}
                </div>
              )}

              {booking.booking_status === "rejected" && (
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary">
                    This booking was rejected. Reason: {booking.rejection_reason}
                  </p>
                  <Button
                    variant="outline"
                    disabled={isAllowingRebook}
                    onClick={() =>
                      runAction(
                        setIsAllowingRebook,
                        "/api/admin/booking/allow-rebook",
                        { booking_id: id },
                        "Rebooking allowed."
                      )
                    }
                  >
                    {isAllowingRebook && <Loader2 className="h-4 w-4 animate-spin" />}
                    Allow Rebook
                  </Button>
                </div>
              )}
            </AdminCard>
          </div>

          <AdminCard>
            <h2 className="mb-4 text-sm font-semibold text-text-primary">Activity Timeline</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-text-muted">No activity recorded yet.</p>
            ) : (
              <ol className="space-y-4 border-l border-border pl-4">
                {activity.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" />
                    <p className="text-sm font-medium text-text-secondary">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </p>
                    {entry.note && <p className="mt-0.5 text-xs text-text-muted">{entry.note}</p>}
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </AdminCard>
        </div>
      )}
    </AdminShell>
  );
}
