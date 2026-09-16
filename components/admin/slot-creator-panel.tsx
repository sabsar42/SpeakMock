"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SlotTemplate } from "@/lib/types";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function enumerateDates(start: string, end: string, daysOfWeek: number[]): string[] {
  if (!start || !end) return [];
  const dates: string[] = [];
  const cur = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (cur > endDate) return [];

  while (cur <= endDate) {
    if (daysOfWeek.length === 0 || daysOfWeek.includes(cur.getDay())) {
      dates.push(toDateInputValue(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

interface SlotCreatorPanelProps {
  onSlotsCreated: () => void;
}

export function SlotCreatorPanel({ onSlotsCreated }: SlotCreatorPanelProps) {
  // --- Single slot ---
  const [singleDate, setSingleDate] = useState("");
  const [singleTime, setSingleTime] = useState("09:00");
  const [isAddingSingle, setIsAddingSingle] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  // --- Bulk ---
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [times, setTimes] = useState<string[]>(["09:00", "10:00"]);
  const [newTime, setNewTime] = useState("");
  const [excludeDates, setExcludeDates] = useState<string[]>([]);
  const [newExcludeDate, setNewExcludeDate] = useState("");
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number } | null>(
    null
  );

  // --- Templates ---
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  useEffect(() => {
    fetch("/api/admin/slots/template")
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => {});
  }, []);

  const candidateDates = useMemo(
    () => enumerateDates(startDate, endDate, daysOfWeek),
    [startDate, endDate, daysOfWeek]
  );
  const excludeSet = useMemo(() => new Set(excludeDates), [excludeDates]);
  const effectiveDates = useMemo(
    () => candidateDates.filter((d) => !excludeSet.has(d)),
    [candidateDates, excludeSet]
  );
  const previewCount = effectiveDates.length * times.length;

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function addTime() {
    if (!newTime || times.includes(newTime)) return;
    setTimes((prev) => [...prev, newTime].sort());
    setNewTime("");
  }

  function addExcludeDate() {
    if (!newExcludeDate || excludeDates.includes(newExcludeDate)) return;
    setExcludeDates((prev) => [...prev, newExcludeDate].sort());
    setNewExcludeDate("");
  }

  async function handleAddSingleSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!singleDate || !singleTime) return;
    setIsAddingSingle(true);
    setSingleError(null);
    try {
      const res = await fetch("/api/admin/slots/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: [singleDate], times: [singleTime] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add slot.");
      if (data.created === 0) {
        setSingleError("That slot already exists.");
      } else {
        onSlotsCreated();
      }
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : "Could not add slot.");
    } finally {
      setIsAddingSingle(false);
    }
  }

  async function handleCreateBulk() {
    if (previewCount === 0) return;
    setIsCreatingBulk(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await fetch("/api/admin/slots/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: effectiveDates, times, exclude_dates: excludeDates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create slots.");
      setBulkResult({ created: data.created, skipped: data.skipped });
      onSlotsCreated();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Could not create slots.");
    } finally {
      setIsCreatingBulk(false);
    }
  }

  async function handleSaveTemplate() {
    const name = window.prompt("Name this template (e.g. \"Weekday Morning\"):");
    if (!name?.trim()) return;
    setIsSavingTemplate(true);
    try {
      const res = await fetch("/api/admin/slots/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), config: { daysOfWeek, times } }),
      });
      const data = await res.json();
      if (res.ok) setTemplates((prev) => [data.template, ...prev]);
    } finally {
      setIsSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    await fetch("/api/admin/slots/template", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function applyTemplate(template: SlotTemplate) {
    setDaysOfWeek(template.config.daysOfWeek);
    setTimes(template.config.times);
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      {templates.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Quick Templates
          </p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <span
                key={t.id}
                className="group flex items-center gap-1.5 rounded-full border border-border bg-gray-50 py-1 pl-3 pr-1.5 text-xs text-text-secondary"
              >
                <button onClick={() => applyTemplate(t)} className="hover:text-text-primary">
                  {t.name}
                </button>
                <button
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="rounded-full p-0.5 text-text-muted hover:bg-gray-200 hover:text-text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="single">
        <TabsList className="w-full">
          <TabsTrigger value="single" className="flex-1">
            Single Slot
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex-1">
            Bulk Creator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <form onSubmit={handleAddSingleSlot} className="space-y-3">
            {singleError && (
              <p className="text-xs text-error">{singleError}</p>
            )}
            <div className="space-y-1.5">
              <Label className="text-text-secondary">Date</Label>
              <Input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="border-border bg-gray-50 text-text-primary"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-text-secondary">Time</Label>
              <Input
                type="time"
                step={1800}
                value={singleTime}
                onChange={(e) => setSingleTime(e.target.value)}
                className="border-border bg-gray-50 text-text-primary"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isAddingSingle}>
              {isAddingSingle ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Slot
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-text-secondary">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-border bg-gray-50 text-text-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-text-secondary">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-border bg-gray-50 text-text-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-text-secondary">Days of Week</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <label
                    key={day.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium",
                      daysOfWeek.includes(day.value)
                        ? "border-accent bg-accent/20 text-text-primary"
                        : "border-border bg-gray-50 text-text-muted"
                    )}
                  >
                    <Checkbox
                      checked={daysOfWeek.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                      className="h-3.5 w-3.5 border-border"
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-text-secondary">Time Slots</Label>
              <div className="flex flex-wrap gap-2">
                {times.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-full border border-border bg-gray-50 px-2.5 py-1 text-xs text-text-secondary"
                  >
                    {t}
                    <button
                      onClick={() => setTimes((prev) => prev.filter((x) => x !== t))}
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="time"
                  step={1800}
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="border-border bg-gray-50 text-text-primary"
                />
                <Button type="button" variant="outline" onClick={addTime}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-text-secondary">Exclude Dates (holidays, etc.)</Label>
              {excludeDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {excludeDates.map((d) => (
                    <span
                      key={d}
                      className="flex items-center gap-1 rounded-full border border-border bg-gray-50 px-2.5 py-1 text-xs text-text-secondary"
                    >
                      {d}
                      <button
                        onClick={() =>
                          setExcludeDates((prev) => prev.filter((x) => x !== d))
                        }
                        className="text-text-muted hover:text-text-primary"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newExcludeDate}
                  onChange={(e) => setNewExcludeDate(e.target.value)}
                  className="border-border bg-gray-50 text-text-primary"
                />
                <Button type="button" variant="outline" onClick={addExcludeDate}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-gray-50 px-3.5 py-2.5 text-sm text-text-secondary">
              This will create <strong className="text-text-primary">{previewCount}</strong> slot
              {previewCount === 1 ? "" : "s"} across{" "}
              <strong className="text-text-primary">{effectiveDates.length}</strong> day
              {effectiveDates.length === 1 ? "" : "s"}.
            </div>

            {bulkError && <p className="text-xs text-error">{bulkError}</p>}
            {bulkResult && (
              <p className="text-xs text-success">
                Created {bulkResult.created} slot{bulkResult.created === 1 ? "" : "s"}
                {bulkResult.skipped > 0 ? ` (${bulkResult.skipped} already existed)` : ""}.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-border bg-gray-50 text-text-primary hover:bg-gray-200"
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || times.length === 0}
              >
                Save as Template
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateBulk}
                disabled={isCreatingBulk || previewCount === 0}
              >
                {isCreatingBulk ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="hidden" />
                )}
                Create All Slots
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
