import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import type { ConnectPayload } from '@/entities/session/session.types';
import { SARADORENG_SYSTEM_PROMPT } from '../../../../entities/agent/roles/saradoreng';

export interface RealtimeConnectResult {
  agent: RealtimeAgent;
  session: RealtimeSession;
  clientSecret: string;
  micHelpers?: {
    mute: () => void;
    unmute: () => void;
    isMuted: () => boolean;
  };
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

let micTrack: MediaStreamTrack | null = null;
const initMicTrack = async (mode: string) => {
  if (mode !== 'voice') return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micTrack = stream.getAudioTracks()[0];
    console.log('Mic track initialized!');
  } catch (err) {
    console.warn('Mic access denied:', err);
  }
};

const muteMic = () => {
  if (micTrack) {
    micTrack.enabled = false;
    console.log('Mic muted! (AI talking)');
  }
};

const unmuteMic = () => {
  if (micTrack) {
    micTrack.enabled = true;
    console.log('Mic unmuted! (Your turn)');
  }
};

const isMicMuted = () => micTrack?.enabled === false;

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

  if (payload.mode === 'voice') {
    await initMicTrack(payload.mode);
  }

  await session.connect({
    apiKey: clientSecret,
  });

  if (payload.mode === 'voice') {
    (session as any).on('response.audio.delta', (_event: any) => muteMic());

    (session as any).on('response.done', (_event: any) => unmuteMic());

    (session as any).on('response.cancelled', (_event: any) => unmuteMic());
  }

  return {
    agent,
    session,
    clientSecret,
    micHelpers:
      payload.mode === 'voice'
        ? {
            mute: muteMic,
            unmute: unmuteMic,
            isMuted: isMicMuted,
          }
        : undefined,
  };
};

export const createRealtimeVoiceSession = createRealtimeSession;
