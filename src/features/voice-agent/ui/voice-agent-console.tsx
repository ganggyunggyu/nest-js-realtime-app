"use client";

import React from "react";
import { cn } from "@/shared/lib/cn";
import { useRealtimeAgentConnection } from "@/features/voice-agent/hooks/voice-agent.hooks";
import type { RealtimeMode } from "@/entities/session/session.types";
import {
  DEFAULT_SESSION_DETAILS,
  DEFAULT_SESSION_HEADLINE,
} from "@/entities/session/session.constants";
import type { LogSeverity } from "@/features/voice-agent/model/voice-agent.atoms";
import { ApiKeyPanel } from "@/features/voice-agent/ui/components/api-key-panel";
import { ConversationPanel } from "@/features/voice-agent/ui/components/conversation-panel";
import { EventLogPanel } from "@/features/voice-agent/ui/components/event-log-panel";
import { SessionStatusPanel } from "@/features/voice-agent/ui/components/session-status-panel";

const voiceOptions = [
  { value: "alloy", label: "Alloy" },
  { value: "coral", label: "Coral" },
  { value: "marin", label: "Marin" },
];

const logStyles: Record<LogSeverity, string> = {
  info: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  error: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
};

type VoiceAgentConsoleProps = {
  defaultMode?: RealtimeMode;
  forcedMode?: RealtimeMode;
};

export const VoiceAgentConsole: React.FC<VoiceAgentConsoleProps> = ({ defaultMode = "voice", forcedMode }) => {
  const {
    status,
    logs,
    conversation,
    connect,
    disconnect,
    sendMessage,
    isPending,
    responsePending,
    sessionId,
    apiKey,
    updateApiKey,
    resetSession,
  } = useRealtimeAgentConnection();

  const [mode, setMode] = React.useState<RealtimeMode>(forcedMode || defaultMode);
  const [voice, setVoice] = React.useState(voiceOptions[0]?.value ?? "alloy");
  const [chatDraft, setChatDraft] = React.useState("");
  const [apiKeyDraft, setApiKeyDraft] = React.useState(apiKey);
  const [apiKeyVisible, setApiKeyVisible] = React.useState(false);
  const conversationContainerRef = React.useRef<HTMLDivElement | null>(null);
  const logContainerRef = React.useRef<HTMLDivElement | null>(null);

  const canSendChat =
    chatDraft.trim().length > 0 &&
    mode === "text" &&
    !responsePending &&
    !isPending;

  React.useEffect(() => {
    setApiKeyDraft(apiKey);
  }, [apiKey]);

  const handleApiKeyChange = React.useCallback(
    (value: string) => {
      setApiKeyDraft(value);
      updateApiKey(value.trim());
    },
    [updateApiKey],
  );

  const triggerConnect = React.useCallback(() => {
    void connect({
      instructions: {
        headline: DEFAULT_SESSION_HEADLINE,
        details: DEFAULT_SESSION_DETAILS,
      },
      mode,
      voice: mode === "voice" ? voice : undefined,
    });
  }, [connect, mode, voice]);

  const handleConnect = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      triggerConnect();
    },
    [triggerConnect],
  );

  const handleDisconnect = React.useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleManualReset = React.useCallback(() => {
    void resetSession(true);
  }, [resetSession]);

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

        <ApiKeyPanel
          value={apiKeyDraft}
          visible={apiKeyVisible}
          onToggleVisibility={() => setApiKeyVisible((prev) => !prev)}
          onChange={handleApiKeyChange}
        />

        <div className={cn("flex items-center justify-between px-4")}>
          <div className={cn("flex items-center gap-2")}>
            <div
              className={cn(
                "h-3 w-3 rounded-full",
                mode === "voice" ? "bg-emerald-500" : "bg-blue-500"
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold uppercase tracking-wide",
                mode === "voice" ? "text-emerald-600" : "text-blue-600",
                "dark:text-emerald-400 dark:text-blue-400"
              )}
            >
              {mode === "voice" ? "Voice Mode" : "Text Mode"}
              {forcedMode && " (Locked)"}
            </span>
          </div>
        </div>
        <SessionStatusPanel
          status={status}
          sessionId={sessionId}
          responsePending={responsePending}
          mode={mode}
          onModeChange={(value) => !forcedMode && setMode(value)}
          voice={voice}
          voiceOptions={voiceOptions}
          onVoiceChange={(value) => setVoice(value)}
          isPending={isPending}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onReset={handleManualReset}
          disabled={!!forcedMode}
        />

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
                responsePending
                  ? "Assistant is responding… waiting to finish this turn."
                  : status === "connecting"
                  ? "Connecting… please wait."
                  : "Ask something and press Enter to send."
              }
              className={cn(
                "flex-1 rounded-md border border-transparent bg-transparent px-3 py-2 text-sm outline-none transition",
                "focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/40",
                "dark:focus:border-zinc-500 dark:focus:ring-zinc-500/40",
              )}
              disabled={responsePending || isPending}
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
          <ConversationPanel
            messages={conversation}
            containerRef={conversationContainerRef}
          />
          <EventLogPanel
            logs={logs}
            containerRef={logContainerRef}
            logStyles={logStyles}
          />
        </section>
      </div>
    </React.Fragment>
  );
};
