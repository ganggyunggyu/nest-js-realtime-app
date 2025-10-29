"use client";

import React from "react";
import type { RealtimeMode } from "@/entities/session/session.types";
import { cn } from "@/shared/lib/cn";

interface SessionStatusPanelProps {
  status: "idle" | "connecting" | "connected" | "error";
  sessionId: string | null;
  responsePending: boolean;
  mode: RealtimeMode;
  onModeChange: (mode: RealtimeMode) => void;
  voice: string;
  voiceOptions: Array<{ value: string; label: string }>;
  onVoiceChange: (voice: string) => void;
  isPending: boolean;
  onConnect: (event: React.FormEvent<HTMLFormElement>) => void;
  onDisconnect: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export const SessionStatusPanel = ({
  status,
  sessionId,
  responsePending,
  mode,
  onModeChange,
  voice,
  voiceOptions,
  onVoiceChange,
  isPending,
  onConnect,
  onDisconnect,
  onReset,
  disabled = false,
}: SessionStatusPanelProps) => {
  return (
    <form
      onSubmit={onConnect}
      className={cn(
        "grid grid-cols-1 gap-6 rounded-xl bg-zinc-50 p-6",
        "dark:bg-zinc-800/40",
      )}
    >
      <section className={cn("flex flex-col gap-4")}>
        {mode === "voice" && (
          <label
            className={cn(
              "flex flex-col gap-2 rounded-lg border border-zinc-200 p-4",
              "text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200",
            )}
          >
            Output voice
            <select
              value={voice}
              onChange={(event) => onVoiceChange(event.target.value)}
              className={cn(
                "w-full rounded-lg border border-zinc-200 bg-white px-4 py-3",
                "text-base text-zinc-900 outline-none transition",
                "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
                "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
                "dark:focus:border-zinc-200 dark:focus:ring-zinc-200/20",
              )}
              disabled={status === "connecting" || disabled}
            >
              {voiceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div
          className={cn(
            "flex flex-col gap-4 rounded-lg border border-dashed border-zinc-300 p-4",
            "dark:border-zinc-700",
          )}
        >
          <div className={cn("flex items-center justify-between")}>
            <div className={cn("flex flex-col gap-1")}>
              <span
                className={cn(
                  "text-sm font-semibold text-zinc-700",
                  "dark:text-zinc-200",
                )}
              >
                Session status
              </span>
              <span
                className={cn(
                  "text-lg font-medium capitalize",
                  status === "connected" && "text-emerald-500",
                  status === "connecting" && "text-amber-500",
                  status === "error" && "text-rose-500",
                  status === "idle" && "text-zinc-500",
                )}
              >
                {status}
              </span>
            </div>
            <div
              className={cn("flex flex-col items-end gap-1")}
              aria-live="polite"
            >
              {sessionId && (
                <span
                  className={cn(
                    "text-xs font-mono text-zinc-500",
                    "dark:text-zinc-400",
                  )}
                >
                  Session: {sessionId}
                </span>
              )}
              {mode === "text" && responsePending && (
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wide text-amber-500",
                    "dark:text-amber-300",
                  )}
                >
                  Responding…
                </span>
              )}
            </div>
          </div>
          <div
            className={cn("flex flex-wrap gap-2")}
            aria-live="polite"
          >
            <button
              type="submit"
              disabled={isPending || status === "connected"}
              className={cn(
                "rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition",
                "disabled:cursor-not-allowed disabled:bg-zinc-500",
                "hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900",
                "dark:hover:bg-zinc-200",
              )}
            >
              {status === "connected" ? "Connected" : "Connect"}
            </button>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={status !== "connected"}
              className={cn(
                "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition",
                "hover:border-zinc-900 hover:text-zinc-950",
                "disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400",
                "dark:border-zinc-700 dark:text-zinc-100",
                "dark:hover:border-zinc-200 dark:hover:text-zinc-50",
                "dark:disabled:border-zinc-700 dark:disabled:text-zinc-500",
              )}
            >
              Disconnect
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={isPending}
              className={cn(
                "rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-700 transition",
                "hover:border-amber-500 hover:text-amber-800",
                "disabled:cursor-not-allowed disabled:border-amber-200 disabled:text-amber-300",
                "dark:border-amber-500 dark:text-amber-300",
                "dark:hover:border-amber-400 dark:hover:text-amber-200",
                "dark:disabled:border-amber-200 dark:disabled:text-amber-200",
              )}
            >
              Reset
            </button>
          </div>
        </div>
      </section>
    </form>
  );
};
