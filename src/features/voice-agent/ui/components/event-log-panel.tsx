"use client";

import React from "react";
import { cn } from "@/shared/lib/cn";
import type { LogEntry } from "@/features/voice-agent/model/voice-agent.atoms";

interface EventLogPanelProps {
  logs: LogEntry[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  logStyles: Record<LogEntry["severity"], string>;
}

export const EventLogPanel = ({
  logs,
  containerRef,
  logStyles,
}: EventLogPanelProps) => (
  <div
    className={cn(
      "flex h-72 flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white",
      "dark:border-zinc-700 dark:bg-zinc-900",
    )}
  >
    <div
      className={cn(
        "flex items-center justify-between border-b border-zinc-100 px-4 py-3",
        "dark:border-zinc-800",
      )}
    >
      <span
        className={cn(
          "text-sm font-semibold uppercase tracking-wide text-zinc-600",
          "dark:text-zinc-300",
        )}
      >
        Event log
      </span>
      <span
        className={cn(
          "text-xs font-medium text-zinc-500 dark:text-zinc-400",
        )}
      >
        {logs.length} entries
      </span>
    </div>
    <div
      ref={containerRef}
      className={cn(
        "flex-1 overflow-y-auto px-4 py-3",
        "space-y-3 text-sm",
      )}
    >
      {logs.length === 0 ? (
        <div
          className={cn(
            "rounded-md border border-dashed border-zinc-300 p-4 text-center text-zinc-500",
            "dark:border-zinc-700 dark:text-zinc-400",
          )}
        >
          No events captured yet.
        </div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className={cn(
              "flex flex-col gap-2 rounded-lg px-4 py-3 shadow-sm transition",
              logStyles[log.severity],
            )}
          >
            <div className={cn("flex items-center justify-between")}>
              <span
                className={cn(
                  "text-[0.65rem] font-semibold uppercase tracking-wide opacity-70",
                )}
              >
                {log.severity}
              </span>
              <span
                className={cn(
                  "text-[0.65rem] font-mono text-zinc-500 opacity-80",
                  "dark:text-zinc-400",
                )}
              >
                {log.id.split("-")[0]}
              </span>
            </div>
            <pre
              className={cn(
                "whitespace-pre-wrap break-words text-sm leading-relaxed",
                "font-mono text-zinc-800 dark:text-zinc-200",
              )}
            >
              {log.message}
            </pre>
          </div>
        ))
      )}
    </div>
  </div>
);

