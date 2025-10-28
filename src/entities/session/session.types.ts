export interface SessionInstructions {
  headline: string;
  details: string;
}

export type RealtimeMode = "voice" | "text";

export interface ConnectPayload {
  instructions: SessionInstructions;
  mode: RealtimeMode;
  voice?: string;
}
