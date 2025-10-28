import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useAtom } from "jotai";
import type { RealtimeItem } from "@openai/agents/realtime";
import type {
  ConnectPayload,
  RealtimeMode,
} from "@/entities/session/session.types";
import {
  voiceAgentAgentAtom,
  voiceAgentConversationAtom,
  voiceAgentModeAtom,
  voiceAgentLogsAtom,
  voiceAgentSessionAtom,
  voiceAgentStatusAtom,
  voiceAgentResponsePendingAtom,
  type LogEntry,
  type LogSeverity,
  type ConversationMessage,
} from "@/features/voice-agent/model/voice-agent.atoms";
import { createRealtimeSession } from "@/features/voice-agent/api/voice-agent.api";

const MAX_LOG_LENGTH = 30;

const clampLogs = (logs: LogEntry[]) =>
  logs.length > MAX_LOG_LENGTH ? logs.slice(logs.length - MAX_LOG_LENGTH) : logs;

const createLogEntry = (
  message: string,
  severity: LogSeverity = "info",
): LogEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
  message,
  severity,
});

const resolveMessageText = (item: RealtimeItem): ConversationMessage | null => {
  if (item.type !== "message") {
    return null;
  }

  const textSegments = item.content
    .map((content) => {
      if (content.type === "input_text" || content.type === "output_text") {
        return content.text;
      }

      if (
        (content.type === "input_audio" || content.type === "output_audio") &&
        content.transcript
      ) {
        return content.transcript;
      }

      return null;
    })
    .filter(Boolean) as string[];

  return {
    id: item.itemId,
    role: item.role,
    text: textSegments.join(" ").trim(),
    status: item.status ?? "completed",
  };
};

export const useRealtimeAgentConnection = () => {
  const [session, setSession] = useAtom(voiceAgentSessionAtom);
  const [logs, setLogs] = useAtom(voiceAgentLogsAtom);
  const [status, setStatus] = useAtom(voiceAgentStatusAtom);
  const [, setAgent] = useAtom(voiceAgentAgentAtom);
  const [conversation, setConversation] = useAtom(voiceAgentConversationAtom);
  const [mode, setMode] = useAtom(voiceAgentModeAtom);
  const [responsePending, setResponsePending] = useAtom(
    voiceAgentResponsePendingAtom,
  );
  const [responsePending, setResponsePending] = useAtom(
    voiceAgentResponsePendingAtom,
  );
  const eventCleanupRef = React.useRef<(() => void) | null>(null);
  const assistantBufferRef = React.useRef<Map<string, string>>(new Map());

  const cleanupSessionListeners = React.useCallback(() => {
    if (eventCleanupRef.current) {
      eventCleanupRef.current();
      eventCleanupRef.current = null;
    }
  }, []);

  const upsertConversationMessage = React.useCallback(
    (message: ConversationMessage) => {
      if (!message.text && message.role === "assistant") {
        return;
      }

      setConversation((currentMessages) => {
        const existingIndex = currentMessages.findIndex(
          (entry) => entry.id === message.id,
        );

        if (existingIndex !== -1) {
          const nextMessages = [...currentMessages];
          nextMessages[existingIndex] = {
            ...nextMessages[existingIndex],
            ...message,
          };
          return nextMessages;
        }

        return [...currentMessages, message];
      });
    },
    [setConversation],
  );

  const appendLog = React.useCallback(
    (entry: string, severity: LogSeverity = "info") => {
      setLogs((currentLogs) =>
        clampLogs([...currentLogs, createLogEntry(entry, severity)]),
      );
    },
    [setLogs],
  );

  const mutation = useMutation({
    mutationFn: async (payload: ConnectPayload) => {
      setStatus("connecting");
      setConversation([]);
      appendLog(
        `Attempting ${payload.mode === "voice" ? "voice" : "text"} session connection…`,
        "info",
      );

      return createRealtimeSession(payload);
    },
    onSuccess: ({ agent, session: newSession }, variables) => {
      cleanupSessionListeners();

      assistantBufferRef.current.clear();
      setMode(variables?.mode ?? "voice");

      const handleHistoryUpdated = (history: RealtimeItem[]) => {
        history.forEach((item) => {
          const message = resolveMessageText(item);
          if (message) {
            upsertConversationMessage(message);
          }
        });
      };

      const handleHistoryAdded = (item: RealtimeItem) => {
        const message = resolveMessageText(item);
        if (message) {
          upsertConversationMessage(message);
        }
      };

      const handleTransportEvent = (event: { type: string; [key: string]: any }) => {
        if (event.type === "response.created") {
          setResponsePending(true);
        }

        if (event.type === "response.output_text.delta") {
          const itemId =
            event.item_id ??
            `${event.response_id ?? "response"}:${event.output_index ?? 0}:${
              event.content_index ?? 0
            }`;
          const currentText = assistantBufferRef.current.get(itemId) ?? "";
          const nextText = `${currentText}${event.delta ?? ""}`;
          assistantBufferRef.current.set(itemId, nextText);
          upsertConversationMessage({
            id: itemId,
            role: "assistant",
            text: nextText.trim(),
            status: "in_progress",
          });
        }

        if (
          event.type === "response.output_text.done" ||
          event.type === "response.completed" ||
          event.type === "response.done" ||
          event.type === "response.failed" ||
          event.type === "response.cancelled"
        ) {
          const itemId =
            event.item_id ??
            `${event.response_id ?? "response"}:${event.output_index ?? 0}:${
              event.content_index ?? 0
            }`;
          const finalText = assistantBufferRef.current.get(itemId) ?? "";

          if (finalText.trim().length > 0) {
            upsertConversationMessage({
              id: itemId,
              role: "assistant",
              text: finalText.trim(),
              status: "completed",
            });
            appendLog(
              `Assistant responded with ${Math.min(finalText.trim().length, 40)} characters.`,
              "success",
            );
          }

          setResponsePending(false);
        }
      };

      const handleError = (error: { error: unknown }) => {
        const isTransportDisconnect =
          typeof error?.error === "object" &&
          error?.error !== null &&
          "type" in (error.error as Record<string, unknown>) &&
          (error.error as { type?: string }).type === "disconnect";

        if (isTransportDisconnect) {
          appendLog("Realtime transport disconnected.", "warning");
          setStatus("idle");
          cleanupSessionListeners();
          setSession(null);
          setResponsePending(false);
          return;
        }

        if (error?.error instanceof Error) {
          appendLog(`Session error: ${error.error.message}`, "error");
          setStatus("error");
          setResponsePending(false);
          return;
        }

        appendLog(
          `Session warning: ${JSON.stringify(error.error, null, 2)}`,
          "warning",
        );
      };

      newSession.on("history_updated", handleHistoryUpdated);
      newSession.on("error", handleError);
      newSession.on("history_added", handleHistoryAdded);
      newSession.on("transport_event", handleTransportEvent);

      eventCleanupRef.current = () => {
        newSession.off("history_updated", handleHistoryUpdated);
        newSession.off("error", handleError);
        newSession.off("history_added", handleHistoryAdded);
        newSession.off("transport_event", handleTransportEvent);
      };

      setStatus("connected");
      setAgent(agent);
      setSession(newSession);
      appendLog("Realtime session connected.", "success");
      newSession.history.forEach((item) => {
        const message = resolveMessageText(item);
        if (message) {
          upsertConversationMessage(message);
        }
      });
      setResponsePending(false);
    },
    onError: (error) => {
      setStatus("error");
      appendLog(`Connection failed: ${(error as Error).message}`, "error");
      setResponsePending(false);
    },
  });

  const handleConnect = React.useCallback(
    async (payload: ConnectPayload) => {
      if (status === "connected") {
        appendLog("Session already active.", "warning");
        return;
      }

      await mutation.mutateAsync(payload);
    },
    [appendLog, mutation, status],
  );

  const handleDisconnect = React.useCallback(() => {
    if (!session) {
      appendLog("No active session to disconnect.", "warning");
      return;
    }

    cleanupSessionListeners();
    session.close();
    setSession(null);
    setStatus("idle");
    setConversation([]);
    assistantBufferRef.current.clear();
    setResponsePending(false);
    appendLog("Realtime session disconnected.", "info");
  }, [appendLog, cleanupSessionListeners, session, setConversation, setResponsePending, setSession, setStatus]);

  const handleSendMessage = React.useCallback(
    (message: string) => {
      if (!session) {
        appendLog("Cannot send message without an active session.", "warning");
        return;
      }

      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        appendLog("Cannot send empty message.", "warning");
        return;
      }

       if (mode === "text" && responsePending) {
        appendLog(
          "Assistant is still responding. Wait for the current turn to complete before sending another prompt.",
          "warning",
        );
        return;
      }

      if (mode === "text" && responsePending) {
        appendLog(
          "Assistant is still responding. Wait for the current turn to finish before sending another prompt.",
          "warning",
        );
        return;
      }

      session.sendMessage({
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: trimmedMessage,
          },
        ],
      });
      appendLog(
        `Sent text input: “${trimmedMessage.slice(0, 60)}${
          trimmedMessage.length > 60 ? "…" : ""
        }”`,
        "info",
      );
      if (mode === "text") {
        setResponsePending(true);
      }
    },
    [appendLog, mode, responsePending, session, setResponsePending],
  );

  React.useEffect(
    () => () => {
      cleanupSessionListeners();
    },
    [cleanupSessionListeners],
  );

  return {
    status,
    logs,
    conversation,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sendMessage: handleSendMessage,
    isPending: mutation.isPending,
    responsePending,
  };
};

// 호환용 별칭
export const useVoiceAgentConnection = useRealtimeAgentConnection;
