import { NextResponse, type NextRequest } from 'next/server';
import type { ConnectPayload } from '@/entities/session/session.types';
import { SARADORENG_SYSTEM_PROMPT } from '../../../../entities/agent/roles/saradoreng';

const endpoint = 'https://api.openai.com/v1/realtime/client_secrets';
const realtimeModel = 'gpt-realtime-mini-2025-10-06';
const allowedVoices = new Set(['alloy', 'coral', 'marin']);

const buildBody = (payload: ConnectPayload) => {
  const session: Record<string, unknown> = {
    type: 'realtime',
    model: realtimeModel,
    instructions: [
      SARADORENG_SYSTEM_PROMPT,
      payload.instructions.headline,
      payload.instructions.details,
    ]
      .filter(Boolean)
      .join('\n\n'),
  };

  if (payload.mode === 'voice' && payload.voice) {
    session.audio = {
      output: {
        voice: payload.voice,
      },
      input: {
        turn_detection: {
          type: 'server_vad',
          create_response: false, // ★ 자동 응답 시작 금지 (핵심)
          interrupt_response: false, // 중도 인터럽트 금지
          threshold: 0.5, // 필요 시 조정
          idle_timeout_ms: 5000, // 출력 후 여유 대기
        },
      },
    };
  }

  return {
    session,
  };
};

export const POST = async (request: NextRequest) => {
  const body = (await request.json()) as ConnectPayload;
  const clientSuppliedKey = body.apiKey?.trim();
  const apiKey = clientSuppliedKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { message: 'OPENAI_API_KEY missing' },
      { status: 500 }
    );
  }

  if (body.apiKey) {
    delete body.apiKey;
  }

  if (body.mode !== 'voice' && body.mode !== 'text') {
    return NextResponse.json(
      { message: 'Unsupported realtime mode' },
      { status: 400 }
    );
  }

  if (body.mode === 'voice') {
    if (!body.voice) {
      return NextResponse.json(
        { message: 'Voice must be provided for voice mode' },
        { status: 400 }
      );
    }

    if (!allowedVoices.has(body.voice)) {
      return NextResponse.json(
        { message: 'Unsupported voice selection' },
        { status: 400 }
      );
    }
  }

  if (!body.instructions.headline.trim() || !body.instructions.details.trim()) {
    return NextResponse.json(
      { message: 'Instructions cannot be empty' },
      { status: 400 }
    );
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildBody(body)),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json(
      { message: 'Failed to create realtime client secret', detail: error },
      { status: response.status }
    );
  }

  const payloadResponse = (await response.json()) as { value: string };

  return NextResponse.json(payloadResponse);
};
