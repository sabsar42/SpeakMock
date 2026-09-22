"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const AI_TEST_FEE = process.env.NEXT_PUBLIC_AI_TEST_FEE ?? "৳120";
const PAYMENT_METHOD_NAME = process.env.NEXT_PUBLIC_PAYMENT_METHOD_NAME ?? "bKash";
const PAYMENT_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_NUMBER ?? "01XXXXXXXXX";

export default function AiTestPayPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim() !== "" && email.trim() !== "" && transactionId.trim() !== "" && agreed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/ai-test/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, transaction_id: transactionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/ai-test/pending?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-[560px]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary">
              Start Your AI Mock Test
            </h1>
            <p className="mt-2 text-text-secondary">
              Fill in your details and complete payment to get your test link.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
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
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="rounded-lg border border-sky-100 bg-primary-light p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="text-sm text-text-primary">
                    <p className="font-medium">
                      Pay {AI_TEST_FEE} via {PAYMENT_METHOD_NAME}
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
                  I confirm I have made the payment of {AI_TEST_FEE}.
                </Label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit and Get My Test Link"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
