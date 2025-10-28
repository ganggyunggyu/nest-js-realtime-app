"use client";

import React from "react";
import { cn } from "@/shared/lib/cn";
import { useRealtimeAgentConnection } from "@/features/voice-agent/hooks/voice-agent.hooks";
import type { RealtimeMode } from "@/entities/session/session.types";
import type { LogSeverity } from "@/features/voice-agent/model/voice-agent.atoms";

const voiceOptions = [
  { value: "alloy", label: "Alloy" },
  { value: "coral", label: "Coral" },
  { value: "marin", label: "Marin" },
];

const modeOptions: Array<{ value: RealtimeMode; label: string; hint: string }> = [
  {
    value: "voice",
    label: "Voice (WebRTC)",
    hint: "Bi-directional audio with microphone capture and TTS reply.",
  },
  {
    value: "text",
    label: "Chat (WebSocket)",
    hint: "Low-latency text runs without touching the microphone.",
  },
];

const logStyles: Record<LogSeverity, string> = {
  info: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  error: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
};

export const VoiceAgentConsole = () => {
  const {
    status,
    logs,
    conversation,
    connect,
    disconnect,
    sendMessage,
    isPending,
    responsePending,
  } = useRealtimeAgentConnection();

  const [headline, setHeadline] = React.useState("Realtime Agent Assistant");
  const [details, setDetails] = React.useState(
    "Respond in short, structured sentences. Surface notable insights before wrapping up.",
  );
  const [mode, setMode] = React.useState<RealtimeMode>("voice");
  const [voice, setVoice] = React.useState(voiceOptions[0]?.value ?? "alloy");
  const [chatDraft, setChatDraft] = React.useState("");
  const conversationContainerRef = React.useRef<HTMLDivElement | null>(null);
  const logContainerRef = React.useRef<HTMLDivElement | null>(null);

  const canSendChat =
    status === "connected" &&
    chatDraft.trim().length > 0 &&
    mode === "text" &&
    !responsePending;

  const handleConnect = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await connect({
        instructions: { headline, details },
        mode,
        voice: mode === "voice" ? voice : undefined,
      });
    },
    [connect, details, headline, mode, voice],
  );

  const handleDisconnect = React.useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleSendChat = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSendChat) {
        return;
      }

      sendMessage(chatDraft);
      setChatDraft("");
    },
    [canSendChat, chatDraft, sendMessage],
  );

  React.useEffect(() => {
    const container = conversationContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation]);

  React.useEffect(() => {
    const container = logContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [logs]);

  return (
    <React.Fragment>
      <div
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl",
          "border border-zinc-200 bg-white p-10 shadow-xl",
          "dark:border-zinc-800 dark:bg-zinc-900",
        )}
      >
        <header className={cn("flex flex-col gap-2")}>
          <span
            className={cn(
              "text-sm font-medium uppercase tracking-wide text-zinc-500",
              "dark:text-zinc-400",
            )}
          >
            Realtime API Prototype
          </span>
          <h1
            className={cn(
              "text-3xl font-semibold text-zinc-950",
              "dark:text-zinc-100",
            )}
          >
            Voice & Chat Control Surface
          </h1>
          <p
            className={cn(
              "text-sm leading-6 text-zinc-600",
              "dark:text-zinc-400",
            )}
          >
            Obtain an ephemeral client key, launch a session, and steer either
            voice or text transport pathways directly in the browser.
          </p>
        </header>

        <form
          onSubmit={handleConnect}
          className={cn(
            "grid grid-cols-1 gap-6 rounded-xl bg-zinc-50 p-6",
            "dark:bg-zinc-800/40 lg:grid-cols-3",
          )}
        >
          <section className={cn("col-span-2 flex flex-col gap-4")}>
            <label
              className={cn(
                "flex flex-col gap-2",
                "text-sm font-medium text-zinc-700 dark:text-zinc-200",
              )}
            >
              Headline prompt
              <input
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                className={cn(
                  "w-full rounded-lg border border-zinc-200 bg-white px-4 py-3",
                  "text-base text-zinc-900 outline-none transition",
                  "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
                  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
                  "dark:focus:border-zinc-200 dark:focus:ring-zinc-200/20",
                )}
                placeholder="Give the assistant a name or short identity line."
              />
            </label>
            <label
              className={cn(
                "flex flex-col gap-2",
                "text-sm font-medium text-zinc-700 dark:text-zinc-200",
              )}
            >
              Behaviour guidelines
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                className={cn(
                  "h-40 w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-3",
                  "text-base text-zinc-900 outline-none transition",
                  "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
                  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
                  "dark:focus:border-zinc-200 dark:focus:ring-zinc-200/20",
                )}
                placeholder="Spell out tone, escalation rules, and guardrails."
              />
            </label>
          </section>
          <section className={cn("flex flex-col gap-4")}>
            <div
              className={cn(
                "flex flex-col gap-3 rounded-lg border border-zinc-200 p-4",
                "dark:border-zinc-700",
              )}
            >
              <span
                className={cn(
                  "text-sm font-semibold text-zinc-700 dark:text-zinc-200",
                )}
              >
                Transport mode
              </span>
              <div
                className={cn(
                  "grid grid-cols-1 gap-2 rounded-md bg-white p-2",
                  "dark:bg-zinc-900",
                )}
              >
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    className={cn(
                      "flex flex-col rounded-md border px-3 py-2 text-left transition",
                      "border-transparent hover:border-zinc-300 hover:bg-zinc-100",
                      "dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
                      mode === option.value &&
                        "border-zinc-900 bg-zinc-900 text-zinc-50 shadow-sm dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900",
                    )}
                    disabled={status === "connecting"}
                  >
                    <span className={cn("text-sm font-semibold leading-none")}>
                      {option.label}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-xs text-zinc-600",
                        "dark:text-zinc-400",
                      )}
                    >
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label
              className={cn(
                "flex flex-col gap-2 rounded-lg border border-zinc-200 p-4",
                "text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200",
              )}
            >
              Output voice
              <select
                value={voice}
                onChange={(event) => setVoice(event.target.value)}
                className={cn(
                  "w-full rounded-lg border border-zinc-200 bg-white px-4 py-3",
                  "text-base text-zinc-900 outline-none transition",
                  "focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10",
                  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50",
                  "dark:focus:border-zinc-200 dark:focus:ring-zinc-200/20",
                )}
                disabled={mode !== "voice" || status === "connecting"}
              >
                {voiceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

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
                <div className={cn("flex gap-2")}>
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
                    onClick={handleDisconnect}
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
                </div>
              </div>
            </div>
          </section>
        </form>

        {mode === "text" && (
          <form
            onSubmit={handleSendChat}
            className={cn(
              "flex gap-3 rounded-xl border border-zinc-200 bg-white p-4",
              "dark:border-zinc-700 dark:bg-zinc-900",
            )}
          >
            <input
              value={chatDraft}
            onChange={(event) => setChatDraft(event.target.value)}
              placeholder={
                status === "connected"
                  ? "Ask something and press Enter to send."
                  : "Connect the session to start chatting."
              }
              className={cn(
                "flex-1 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm outline-none transition",
                "focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/40",
                "dark:focus:border-zinc-500 dark:focus:ring-zinc-500/40",
              )}
              disabled={status !== "connected"}
            />
            <button
              type="submit"
              disabled={!canSendChat}
              className={cn(
                "rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 transition",
                "hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500",
                "dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
              )}
            >
              Send
            </button>
          </form>
        )}

        <section
          className={cn(
            "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]",
          )}
        >
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
                {conversation.length} items
              </span>
            </div>
            <div
              ref={conversationContainerRef}
              className={cn(
                "flex-1 overflow-y-auto px-4 py-3",
                "space-y-3 text-sm",
              )}
            >
              {conversation.length === 0 ? (
                <div
                  className={cn(
                    "rounded-md border border-dashed border-zinc-300 p-4 text-center text-zinc-500",
                    "dark:border-zinc-700 dark:text-zinc-400",
                  )}
                >
                  No conversation captured yet.
                </div>
              ) : (
                conversation.map((message) => (
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
              ref={logContainerRef}
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
        </section>
      </div>
    </React.Fragment>
  );
};
