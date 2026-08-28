"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const msRemaining = new Date(expiresAt).getTime() - now;

  return (
    <p className="font-mono text-sm text-text-secondary">
      {msRemaining > 0
        ? `Your page expires in ${formatCountdown(msRemaining)}`
        : "This session has expired."}
    </p>
  );
}
