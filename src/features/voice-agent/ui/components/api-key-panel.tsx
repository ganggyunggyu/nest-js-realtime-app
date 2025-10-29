"use client";

import React from "react";
import { cn } from "@/shared/lib/cn";

interface ApiKeyPanelProps {
  value: string;
  visible: boolean;
  onToggleVisibility: () => void;
  onChange: (value: string) => void;
}

export const ApiKeyPanel = ({
  value,
  visible,
  onToggleVisibility,
  onChange,
}: ApiKeyPanelProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6",
        "dark:border-zinc-800 dark:bg-zinc-900",
      )}
    >
      <div
        className={cn("flex items-center justify-between")}
        aria-live="polite"
      >
        <span
          className={cn(
            "text-sm font-semibold text-zinc-700",
            "dark:text-zinc-200",
          )}
        >
          OpenAI API Key
        </span>
        <button
          type="button"
          onClick={onToggleVisibility}
          className={cn(
            "text-xs font-medium text-zinc-600 underline transition hover:text-zinc-900",
            "dark:text-zinc-400 dark:hover:text-zinc-200",
          )}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={visible ? "text" : "password"}
        placeholder="Optional client key (starts with sk-...)"
        className={cn(
          "w-full rounded-lg border border-zinc-200 bg-white px-4 py-3",
          "text-sm text-zinc-900 outline-none transition",
          "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
          "dark:focus:border-zinc-200 dark:focus:ring-zinc-200/20",
        )}
      />
      <span
        className={cn(
          "text-xs text-zinc-500",
          "dark:text-zinc-400",
        )}
      >
        Stored locally for this browser. Leave empty to fall back to the server key.
      </span>
    </div>
  );
};

