"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "space-y-3",
        month_caption: "flex justify-center pt-1 relative items-center text-sm font-semibold text-text-primary",
        nav: "flex items-center justify-between absolute inset-x-0 top-1",
        button_previous: "h-7 w-7 inline-flex items-center justify-center rounded-md text-text-secondary hover:bg-primary-light hover:text-primary transition",
        button_next: "h-7 w-7 inline-flex items-center justify-center rounded-md text-text-secondary hover:bg-primary-light hover:text-primary transition",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-text-muted w-9 text-xs font-medium",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button:
          "h-9 w-9 rounded-md text-text-primary hover:bg-primary-light transition inline-flex items-center justify-center",
        selected: "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary-hover",
        today: "[&>button]:font-semibold [&>button]:text-primary",
        outside: "text-text-muted opacity-40",
        disabled: "text-text-muted opacity-30 [&>button]:hover:bg-transparent [&>button]:cursor-not-allowed",
        hidden: "invisible",
        ...props.classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
