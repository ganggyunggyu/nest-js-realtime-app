import { atom } from "jotai";
import type {
  RealtimeAgent,
  RealtimeSession,
} from "@openai/agents/realtime";
import type { ConnectPayload, RealtimeMode } from "@/entities/session/session.types";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  status: "in_progress" | "completed" | "incomplete";
}

export type LogSeverity = "info" | "success" | "warning" | "error";

export interface LogEntry {
  id: string;
  message: string;
  severity: LogSeverity;
}

export const voiceAgentStatusAtom = atom<
  "idle" | "connecting" | "connected" | "error"
>("idle");
export const voiceAgentLogsAtom = atom<LogEntry[]>([]);
export const voiceAgentAgentAtom = atom<RealtimeAgent | null>(null);
export const voiceAgentSessionAtom = atom<RealtimeSession | null>(null);
export const voiceAgentConversationAtom = atom<ConversationMessage[]>([]);
export const voiceAgentModeAtom = atom<RealtimeMode>("voice");
export const voiceAgentResponsePendingAtom = atom(false);
export const voiceAgentSessionIdAtom = atom<string | null>(null);
export const voiceAgentLastPayloadAtom = atom<ConnectPayload | null>(null);
export const voiceAgentApiKeyAtom = atom<string>("");
