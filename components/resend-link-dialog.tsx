"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResendLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResendLinkDialog({ open, onOpenChange }: ResendLinkDialogProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
      }, 200);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Always show the same success state regardless of outcome —
      // we never reveal whether an email address has a session on file.
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <div className="no-scrollbar max-h-[80vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle>Resend My Link</DialogTitle>
          </DialogHeader>

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <p className="mt-3 text-center text-sm text-text-secondary">
            Lost your session link? Enter your Gmail and we&apos;ll resend it.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-700">
              If we found a session for that email, we&apos;ve sent the link.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-email">Gmail Address</Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={email.trim() === "" || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend My Link"
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
