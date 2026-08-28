"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface SlotPickerProps {
  availableSlots: string[];
  value: string;
  onChange: (isoDateTime: string) => void;
  timeZone?: string;
}

function dateKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatSelectedDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function SlotPicker({
  availableSlots,
  value,
  onChange,
  timeZone = "Asia/Dhaka",
}: SlotPickerProps) {
  const slotsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const iso of availableSlots) {
      const key = dateKey(iso, timeZone);
      const list = map.get(key) ?? [];
      list.push(iso);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }
    return map;
  }, [availableSlots, timeZone]);

  const availableDates = useMemo(
    () => Array.from(slotsByDate.keys()).map((key) => new Date(`${key}T00:00:00`)),
    [slotsByDate]
  );

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    value ? dateKey(value, timeZone) : null
  );
  const [popoverOpen, setPopoverOpen] = useState(false);

  const selectedDate = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : undefined;
  const timesForSelectedDate = selectedDateKey ? slotsByDate.get(selectedDateKey) ?? [] : [];

  return (
    <div className="space-y-3">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-11 w-full items-center gap-2.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-left text-sm text-text-primary transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-600"
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-text-secondary" />
            <span className={cn(!selectedDate && "text-text-muted")}>
              {selectedDate ? formatSelectedDate(selectedDate, timeZone) : "Choose a date"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              const localKey = new Intl.DateTimeFormat("en-CA", {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(date);
              setSelectedDateKey(localKey);
              setPopoverOpen(false);
            }}
            disabled={(date) => {
              const key = new Intl.DateTimeFormat("en-CA", {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(date);
              return !slotsByDate.has(key);
            }}
            defaultMonth={availableDates[0]}
          />
        </PopoverContent>
      </Popover>

      {selectedDateKey && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
            <Clock className="h-3.5 w-3.5" />
            Available Times
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {timesForSelectedDate.map((iso) => (
              <button
                key={iso}
                type="button"
                onClick={() => onChange(iso)}
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-sm font-medium transition",
                  value === iso
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-text-primary hover:border-sky-400 hover:bg-primary-light"
                )}
              >
                {formatTime(iso, timeZone)}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableDates.length === 0 && (
        <p className="text-sm text-text-muted">
          No slots are available right now. Please check back soon.
        </p>
      )}
    </div>
  );
}
