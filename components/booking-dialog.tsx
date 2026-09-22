"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/booking-form";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillName?: string;
  prefillEmail?: string;
}

export function BookingDialog({
  open,
  onOpenChange,
  prefillName,
  prefillEmail,
}: BookingDialogProps) {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => setSubmittedEmail(null), 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="no-scrollbar max-h-[80vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle>
              {submittedEmail ? "Booking Requested" : "Book Your Session"}
            </DialogTitle>
          </DialogHeader>

          {submittedEmail ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 animate-in zoom-in items-center justify-center rounded-full bg-green-50">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <p className="mt-4 text-sm text-text-secondary">
                We&apos;ll verify your payment and confirm your slot within a
                few hours. Check your email for updates.
              </p>
              <p className="mt-3 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-text-primary">
                {submittedEmail}
              </p>
              <p className="mt-3 text-xs text-text-muted">
                If you don&apos;t see our email, check your spam folder.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <BookingForm
              prefillName={prefillName}
              prefillEmail={prefillEmail}
              onSuccess={(email) => setSubmittedEmail(email)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
