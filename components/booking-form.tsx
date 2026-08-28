"use client";

import { useEffect, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SlotPicker } from "@/components/slot-picker";

const SESSION_FEE = process.env.NEXT_PUBLIC_SESSION_FEE ?? "৳500";
const PAYMENT_METHOD_NAME = process.env.NEXT_PUBLIC_PAYMENT_METHOD_NAME ?? "bKash";
const PAYMENT_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_NUMBER ?? "01XXXXXXXXX";

interface BookingFormProps {
  prefillName?: string;
  prefillEmail?: string;
  onSuccess?: (email: string) => void;
}

export function BookingForm({
  prefillName = "",
  prefillEmail = "",
  onSuccess,
}: BookingFormProps) {
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState("");
  const [slot, setSlot] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      setIsLoadingSlots(true);
      setSlotsError(null);
      try {
        const res = await fetch("/api/booking");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load slots.");
        if (!cancelled) setAvailableSlots(data.slots ?? []);
      } catch {
        if (!cancelled) setSlotsError("Could not load available slots. Please refresh.");
      } finally {
        if (!cancelled) setIsLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit =
    name.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    slot !== "" &&
    transactionId.trim() !== "" &&
    agreed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          slot_datetime: slot,
          transaction_id: transactionId,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      onSuccess?.(email);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="e.g. Nusrat Jahan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Gmail Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+880 1XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Preferred Slot</Label>
        {isLoadingSlots ? (
          <div className="flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading available slots...
          </div>
        ) : slotsError ? (
          <p className="text-sm text-error">{slotsError}</p>
        ) : (
          <SlotPicker availableSlots={availableSlots} value={slot} onChange={setSlot} />
        )}
      </div>

      <div className="rounded-lg border border-sky-100 bg-primary-light p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-sm text-text-primary">
            <p className="font-medium">
              Pay {SESSION_FEE} via {PAYMENT_METHOD_NAME}
            </p>
            <p className="mt-1 text-text-secondary">
              Send payment to{" "}
              <span className="font-mono font-medium text-text-primary">
                {PAYMENT_NUMBER}
              </span>{" "}
              and enter your transaction ID below.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction-id">
          Transaction ID <span className="text-error">*</span>
        </Label>
        <Input
          id="transaction-id"
          placeholder="e.g. 8N7K2LQ9RT"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          required
        />
      </div>

      <div className="flex items-start gap-2.5">
        <Checkbox
          id="confirm"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
        />
        <Label htmlFor="confirm" className="text-sm font-normal leading-snug text-text-secondary">
          I confirm I have made the payment of {SESSION_FEE} and understand the
          no-show policy.
        </Label>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Request Booking"
        )}
      </Button>
    </form>
  );
}
