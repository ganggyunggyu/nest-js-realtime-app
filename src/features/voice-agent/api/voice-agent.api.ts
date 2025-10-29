import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import type { ConnectPayload } from '@/entities/session/session.types';
import { SARADORENG_SYSTEM_PROMPT } from '../../../../entities/agent/roles/saradoreng';

export interface RealtimeConnectResult {
  agent: RealtimeAgent;
  session: RealtimeSession;
  clientSecret: string;
}

const connectEndpoint = '/api/realtime/client-secret';

const postClientSecret = async (payload: ConnectPayload) => {
  const response = await fetch(connectEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = 'Failed to issue realtime client secret';
    try {
      const errorJson = await response.json();
      if (typeof errorJson?.message === 'string') {
        errorDetail = `${errorDetail}: ${errorJson.message}`;
        if (typeof errorJson?.detail === 'string') {
          errorDetail = `${errorDetail} (${errorJson.detail})`;
        }
      } else {
        errorDetail = `${errorDetail}: ${JSON.stringify(errorJson)}`;
      }
    } catch {
      const errorText = await response.text();
      if (errorText) {
        errorDetail = `${errorDetail}: ${errorText}`;
      }
    }
    throw new Error(errorDetail);
  }

  const data = (await response.json()) as { value: string };
  return data.value;
};

export const createRealtimeSession = async (
  payload: ConnectPayload
): Promise<RealtimeConnectResult> => {
  const clientSecret = await postClientSecret(payload);

  const combinedInstructions = [
    SARADORENG_SYSTEM_PROMPT,
    payload.instructions.headline,
    payload.instructions.details,
  ]
    .filter(Boolean)
    .join('\n\n');

  const agent = new RealtimeAgent({
    name: '사라도령',
    instructions: combinedInstructions,
  });

  const session = new RealtimeSession(agent, {
    transport: payload.mode === 'text' ? 'websocket' : 'webrtc',
  });

  await session.connect({
    apiKey: clientSecret,
  });

  return {
    agent,
    session,
    clientSecret,
  };
};

export const createRealtimeVoiceSession = createRealtimeSession;
