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
  const [copied, setCopied] = React.useState(false);

  const roleLabel: Record<ConversationMessage["role"], string> = {
    user: "유저",
    assistant: "사라도령",
    system: "시스템",
  };

  const formatConversation = React.useCallback(() => {
    const RESET_TRIGGERS = new Set([
      "안녕 사라도령",
      "사라도령아",
      "새로 시작하자",
      "고마워",
      "잘있어",
    ]);

    const toBlockquote = (value: string) =>
      value
        .split(/\r?\n/g)
        .map((line) => `> ${line}`)
        .join("\n");

    const parts: string[] = [];
    let currentRole: ConversationMessage["role"] | null = null;

    messages.forEach((m, index) => {
      const text = (m.text ?? "").toString();
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      const isReset = m.role === "user" && RESET_TRIGGERS.has(trimmed);
      if (isReset && parts.length > 0) {
        parts.push("\n---\n\n");
      }

      if (m.role !== currentRole) {
        if (parts.length > 0) {
          parts.push("\n");
        }
        parts.push(`**${roleLabel[m.role]}:**\n\n`);
        currentRole = m.role;
      }

      parts.push(toBlockquote(text));
      parts.push("\n\n");
    });

    return parts.join("").trim();
  }, [messages, roleLabel]);

  const handleCopy = React.useCallback(async () => {
    const text = formatConversation();
    if (!text) {
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [formatConversation]);

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
        <div className={cn("flex items-center gap-2")}> 
          <span
            className={cn(
              "text-xs font-medium text-zinc-500 dark:text-zinc-400",
            )}
          >
            {messages.length} items
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={messages.length === 0}
            aria-label="Copy conversation"
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
              "border-zinc-300 text-zinc-700 hover:bg-zinc-50",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("h-4 w-4")}
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
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
