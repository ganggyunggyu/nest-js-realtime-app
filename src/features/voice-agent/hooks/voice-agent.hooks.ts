import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import type { RealtimeItem, RealtimeSession } from '@openai/agents/realtime';
import type { ConnectPayload } from '@/entities/session/session.types';
import {
  voiceAgentAgentAtom,
  voiceAgentConversationAtom,
  voiceAgentModeAtom,
  voiceAgentSessionIdAtom,
  voiceAgentLogsAtom,
  voiceAgentSessionAtom,
  voiceAgentStatusAtom,
  voiceAgentResponsePendingAtom,
  voiceAgentLastPayloadAtom,
  voiceAgentApiKeyAtom,
  type LogEntry,
  type LogSeverity,
  type ConversationMessage,
} from '@/features/voice-agent/model/voice-agent.atoms';
import {
  createRealtimeSession,
  type RealtimeConnectResult,
} from '@/features/voice-agent/api/voice-agent.api';

const MAX_LOG_LENGTH = 30;

const clampLogs = (logs: LogEntry[]) =>
  logs.length > MAX_LOG_LENGTH
    ? logs.slice(logs.length - MAX_LOG_LENGTH)
    : logs;

const createLogEntry = (
  message: string,
  severity: LogSeverity = 'info'
): LogEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
  message,
  severity,
});

const resolveMessageText = (item: RealtimeItem): ConversationMessage | null => {
  if (item.type !== 'message') {
    return null;
  }

  const textSegments = item.content
    .map((content) => {
      if (content.type === 'input_text' || content.type === 'output_text') {
        return content.text;
      }

      if (
        (content.type === 'input_audio' || content.type === 'output_audio') &&
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
    text: textSegments.join(' ').trim(),
    status:
      'status' in item &&
      (item.status === 'in_progress' ||
        item.status === 'completed' ||
        item.status === 'incomplete')
        ? item.status
        : 'completed',
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
    voiceAgentResponsePendingAtom
  );
  const [sessionId, setSessionId] = useAtom(voiceAgentSessionIdAtom);
  const [lastPayload, setLastPayload] = useAtom(voiceAgentLastPayloadAtom);
  const [apiKey, setApiKey] = useAtom(voiceAgentApiKeyAtom);

  const eventCleanupRef = React.useRef<(() => void) | null>(null);
  const assistantBufferRef = React.useRef<Map<string, string>>(new Map());
  const responseTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const savedKey = window.localStorage.getItem('voice-agent-openai-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, [setApiKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (apiKey) {
      window.localStorage.setItem('voice-agent-openai-key', apiKey);
    } else {
      window.localStorage.removeItem('voice-agent-openai-key');
    }
  }, [apiKey]);

  const cleanupSessionListeners = React.useCallback(() => {
    if (eventCleanupRef.current) {
      eventCleanupRef.current();
      eventCleanupRef.current = null;
    }
  }, []);

  const upsertConversationMessage = React.useCallback(
    (message: ConversationMessage) => {
      if (!message.text && message.role === 'assistant') {
        return;
      }

      setConversation((currentMessages) => {
        const existingIndex = currentMessages.findIndex(
          (entry) => entry.id === message.id
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
    [setConversation]
  );

  const appendLog = React.useCallback(
    (entry: string, severity: LogSeverity = 'info') => {
      setLogs((currentLogs) =>
        clampLogs([...currentLogs, createLogEntry(entry, severity)])
      );
    },
    [setLogs]
  );

  const mutation = useMutation<RealtimeConnectResult, Error, ConnectPayload>({
    mutationFn: async (payload: ConnectPayload) => {
      setStatus('connecting');
      setConversation([]);
      appendLog(
        `Attempting ${
          payload.mode === 'voice' ? 'voice' : 'text'
        } session connection…`,
        'info'
      );

      return createRealtimeSession(payload);
    },
    onSuccess: (
      { agent, session: newSession }: RealtimeConnectResult,
      variables: ConnectPayload
    ) => {
      cleanupSessionListeners();

      assistantBufferRef.current.clear();
      setMode(variables?.mode ?? 'voice');
      if (variables) {
        setLastPayload(variables);
      }

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

      const handleTransportEvent = (event: {
        type: string;
      } & Record<string, unknown>) => {
        if (
          event.type === 'session.created' &&
          typeof event.session === 'object' &&
          event.session !== null &&
          'id' in event.session &&
          typeof event.session.id === 'string'
        ) {
          setSessionId(event.session.id);
        }

        if (event.type === 'response.created') {
          setResponsePending(true);
        }

        if (event.type === 'response.output_text.delta') {
          setResponsePending(true);

          const itemId: string =
            (event.item_id as string | undefined) ??
            `${(event.response_id as string | undefined) ?? 'response'}:${
              (event.output_index as number | undefined) ?? 0
            }:${(event.content_index as number | undefined) ?? 0}`;
          const currentText = assistantBufferRef.current.get(itemId) ?? '';
          const nextText = `${currentText}${(event.delta as string | undefined) ?? ''}`;
          assistantBufferRef.current.set(itemId, nextText);
          upsertConversationMessage({
            id: itemId,
            role: 'assistant',
            text: nextText.trim(),
            status: 'in_progress',
          });
        }

        if (
          event.type === 'response.output_text.done' ||
          event.type === 'response.completed' ||
          event.type === 'response.done' ||
          event.type === 'response.failed' ||
          event.type === 'response.cancelled'
        ) {
          const itemId: string =
            (event.item_id as string | undefined) ??
            `${(event.response_id as string | undefined) ?? 'response'}:${
              (event.output_index as number | undefined) ?? 0
            }:${(event.content_index as number | undefined) ?? 0}`;
          const finalText = assistantBufferRef.current.get(itemId) ?? '';

          if (finalText.trim().length > 0) {
            upsertConversationMessage({
              id: itemId,
              role: 'assistant',
              text: finalText.trim(),
              status: 'completed',
            });
            appendLog(
              `Assistant responded with ${Math.min(
                finalText.trim().length,
                40
              )} characters.`,
              'success'
            );
          }

          setResponsePending(false);
        }
      };

      const handleError = (error: { error: unknown }) => {
        const isTransportDisconnect =
          typeof error?.error === 'object' &&
          error?.error !== null &&
          'type' in (error.error as Record<string, unknown>) &&
          (error.error as { type?: string }).type === 'disconnect';

        if (isTransportDisconnect) {
          appendLog('Realtime transport disconnected.', 'warning');
          setStatus('idle');
          cleanupSessionListeners();
          setSession(null);
          setResponsePending(false);
          return;
        }

        if (error?.error instanceof Error) {
          appendLog(`Session error: ${error.error.message}`, 'error');
          setStatus('error');
          setResponsePending(false);
          return;
        }

        appendLog(
          `Session warning: ${JSON.stringify(error.error, null, 2)}`,
          'warning'
        );
      };

      newSession.on('history_updated', handleHistoryUpdated);
      newSession.on('error', handleError);
      newSession.on('history_added', handleHistoryAdded);
      newSession.on('transport_event', handleTransportEvent);

      eventCleanupRef.current = () => {
        newSession.off('history_updated', handleHistoryUpdated);
        newSession.off('error', handleError);
        newSession.off('history_added', handleHistoryAdded);
        newSession.off('transport_event', handleTransportEvent);
      };

      setStatus('connected');
      setAgent(agent);
      setSession(newSession);
      appendLog('Realtime session connected.', 'success');
      newSession.history.forEach((item) => {
        const message = resolveMessageText(item);
        if (message) {
          upsertConversationMessage(message);
        }
      });
      setResponsePending(false);
      setSessionId(null);
    },
    onError: (error: Error) => {
      setStatus('error');
      appendLog(`Connection failed: ${error.message}`, 'error');
      setResponsePending(false);
      setSessionId(null);
    },
  });

  const handleConnect = React.useCallback(
    async (payload: ConnectPayload) => {
      if (status === 'connected') {
        appendLog('Session already active.', 'warning');
        return;
      }

      const payloadWithKey: ConnectPayload = {
        ...payload,
        apiKey: apiKey ? apiKey : undefined,
      };

      setLastPayload(payloadWithKey);
      await mutation.mutateAsync(payloadWithKey);
    },
    [apiKey, appendLog, mutation, setLastPayload, status]
  );

  const handleDisconnect = React.useCallback(() => {
    if (!session) {
      appendLog('No active session to disconnect.', 'warning');
      return;
    }

    cleanupSessionListeners();
    session.close();
    setSession(null);
    setStatus('idle');
    setConversation([]);
    assistantBufferRef.current.clear();
    setResponsePending(false);
    setSessionId(null);
    appendLog('Realtime session disconnected.', 'info');
  }, [
    appendLog,
    cleanupSessionListeners,
    session,
    setConversation,
    setResponsePending,
    setSession,
    setSessionId,
    setStatus,
  ]);

  const handleResetSession = React.useCallback(
    async (autoReconnect = false) => {
      if (mutation.isPending) {
        appendLog('Cannot reset while connection is pending.', 'warning');
        return;
      }

      cleanupSessionListeners();

      if (session) {
        session.close();
      }

      setSession(null);
      setStatus('idle');
      setConversation([]);
      assistantBufferRef.current.clear();
      setResponsePending(false);
      setSessionId(null);

      appendLog(
        autoReconnect
          ? 'Session reset requested. Attempting to reconnect...'
          : 'Session has been reset.',
        'warning'
      );

      if (autoReconnect && lastPayload) {
        try {
          await mutation.mutateAsync(lastPayload);
        } catch (error) {
          appendLog(
            `Auto-reconnect failed: ${(error as Error).message}`,
            'error'
          );
        }
      }
    },
    [
      appendLog,
      cleanupSessionListeners,
      lastPayload,
      mutation,
      session,
      setConversation,
      setResponsePending,
      setSession,
      setSessionId,
      setStatus,
    ]
  );

  const safeSendMessage = React.useCallback(
    (activeSession: RealtimeSession, text: string) => {
      activeSession.sendMessage({
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      });
      appendLog(
        `Sent text input: “${text.slice(0, 60)}${
          text.length > 60 ? '…' : ''
        }”`,
        'info'
      );
      if (mode === 'text') {
        setResponsePending(true);
      }
    },
    [appendLog, mode, setResponsePending]
  );

  const handleUpdateApiKey = React.useCallback(
    (value: string) => {
      setApiKey(value);
      setLastPayload((current) =>
        current ? { ...current, apiKey: value ? value : undefined } : current
      );
    },
    [setApiKey, setLastPayload]
  );

  const handleSendMessage = React.useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        appendLog('Cannot send empty message.', 'warning');
        return;
      }

      if (mode === 'text' && responsePending) {
        appendLog(
          'Assistant is still responding. Wait for the current turn to finish before sending another prompt.',
          'warning'
        );
        return;
      }

      if (!session) {
        const payloadToUse: ConnectPayload = lastPayload
          ? {
              ...lastPayload,
              apiKey: lastPayload.apiKey ?? (apiKey || undefined),
            }
          : {
              instructions: {
                headline: 'Realtime Agent Assistant',
                details:
                  'Respond in short, structured sentences. Surface notable insights before wrapping up.',
              },
              mode,
              voice: mode === 'voice' ? 'alloy' : undefined,
              apiKey: apiKey ? apiKey : undefined,
            };

        setLastPayload(payloadToUse);
        appendLog('Bootstrapping new session before sending message.', 'info');

        try {
          const result = await mutation.mutateAsync(payloadToUse);
          safeSendMessage(result.session, trimmedMessage);
          return;
        } catch (error) {
          appendLog(
            `Unable to create session: ${(error as Error).message}`,
            'error'
          );
          return;
        }
      }

      safeSendMessage(session, trimmedMessage);
    },
    [
      apiKey,
      appendLog,
      lastPayload,
      mode,
      mutation,
      responsePending,
      safeSendMessage,
      session,
      setLastPayload,
    ]
  );

  React.useEffect(() => {
    if (!responsePending) {
      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
      return;
    }

    responseTimeoutRef.current = window.setTimeout(() => {
      appendLog(
        'Response is taking longer than expected. Resetting session.',
        'warning'
      );
      void handleResetSession(true);
    }, 15000);

    return () => {
      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
    };
  }, [appendLog, handleResetSession, responsePending]);

  React.useEffect(
    () => () => {
      cleanupSessionListeners();
    },
    [cleanupSessionListeners]
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
    sessionId,
    apiKey,
    updateApiKey: handleUpdateApiKey,
    resetSession: handleResetSession,
  };
};

// 호환용 별칭
export const useVoiceAgentConnection = useRealtimeAgentConnection;
