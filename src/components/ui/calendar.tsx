"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

export function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays
      weekStartsOn={0}
      captionLayout="dropdown"
      navLayout="after"
      startMonth={new Date(1900, 0)}
      endMonth={new Date(2100, 11)}
      className={cn("p-3", className)}
      classNames={{
        root: "relative w-[17.5rem] text-sm",
        month_caption: "flex h-9 items-center pr-16",
        dropdowns: "flex items-center gap-1",
        dropdown_root: "relative",
        dropdown:
          "h-8 cursor-pointer rounded-md border border-input bg-background px-1 text-sm outline-none",
        caption_label: "sr-only",
        nav: "absolute right-3 top-3 flex gap-1",
        button_previous:
          "grid size-8 place-items-center rounded-md hover:bg-muted",
        button_next: "grid size-8 place-items-center rounded-md hover:bg-muted",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 py-1 text-center text-xs font-normal text-muted-foreground",
        week: "mt-1 flex",
        day: "size-9 text-center",
        day_button:
          "size-9 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        today: "font-semibold text-primary",
        outside: "opacity-40",
        disabled: "opacity-30",
        ...classNames,
      }}
      {...props}
    />
  );
}
