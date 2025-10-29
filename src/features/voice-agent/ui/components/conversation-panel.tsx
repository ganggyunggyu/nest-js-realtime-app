"use client";

import React from "react";
import { cn } from "@/shared/lib/cn";
import type { ConversationMessage } from "@/features/voice-agent/model/voice-agent.atoms";

interface ConversationPanelProps {
  messages: ConversationMessage[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const ConversationPanel = ({
  messages,
  containerRef,
}: ConversationPanelProps) => {
  return (
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
          Conversation
        </span>
        <span
          className={cn(
            "text-xs font-medium text-zinc-500 dark:text-zinc-400",
          )}
        >
          {messages.length} items
        </span>
      </div>
      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 py-3",
          "space-y-3 text-sm",
        )}
      >
        {messages.length === 0 ? (
          <div
            className={cn(
              "rounded-md border border-dashed border-zinc-300 p-4 text-center text-zinc-500",
              "dark:border-zinc-700 dark:text-zinc-400",
            )}
          >
            No conversation captured yet.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1 rounded-lg px-4 py-3 shadow-sm transition",
                message.role === "user"
                  ? "self-end bg-zinc-950 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                  : "self-start bg-zinc-50 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
              )}
            >
              <div className={cn("flex items-center justify-between")}>
                <span
                  className={cn(
                    "text-[0.65rem] font-semibold uppercase tracking-wide opacity-70",
                  )}
                >
                  {message.role}
                </span>
                <span
                  className={cn(
                    "text-[0.65rem] font-semibold uppercase tracking-wide",
                    message.status === "completed" && "text-emerald-400",
                    message.status === "in_progress" && "text-amber-400",
                    message.status === "incomplete" && "text-rose-400",
                  )}
                >
                  {message.status}
                </span>
              </div>
              <span>{message.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

