# AGENTS.md — next-realtime-app 작업 가이드

본 문서는 이 디렉토리 트리 전체에 적용됩니다. 이 프로젝트는 Next.js(App Router) + Tailwind v4 기반입니다. 목적은 OpenAI Realtime API(GA) 이벤트를 브라우저에서 검증/테스트할 수 있는 “Realtime Events Tester”를 구현·운영하는 것입니다. 오옹! 나이스! 근데 움직임이 예사롭지 않은 것은 맞아.

## 목표
- 브라우저(WebRTC) 기반 Realtime 연결 및 이벤트 로깅/검증 UI 구현
- GA 명세(베타 대비 변경점) 반영: 이벤트 네이밍, 세션 생성, 임시 키 발급, `/v1/realtime/calls`
- FE 공통 셋업: TanStack Query, Jotai, 절대경로 import(`@/*`), `cn()` 유틸, React.Fragment 풀버전
- 서버 키 보안을 위해 클라이언트에는 임시키만 노출

## 현재 스택 분석(현 상태)
- Next.js 16(App Router) + React 19
- Tailwind CSS v4(`@import "tailwindcss";`), 다크 모드 토큰 사용
- 절대경로 alias: `@/*` → 프로젝트 루트(`tsconfig.json` 확인). FSD 계층은 루트에 생성합니다: `entities/`, `features/`, `widgets/`, `shared/` 등
- 누락: TanStack Query, Jotai, cn 유틸, Realtime SDK/연결 코드

## 디렉토리 구조(FSD 권장)
```
app/                 # Next.js 라우팅(App Router)
entities/            # 도메인 모델, API 타입
features/            # 비즈니스 기능(UI, hooks, api)
widgets/             # 복합 UI 블록
shared/              # 공용(ui, lib, api)
  ├─ lib/cn/         # cn 유틸
  └─ api/            # axios/retry 등 (선택)
```

## 코딩 규칙(필수)
- TypeScript + 현대적 React(함수형 컴포넌트)
- 절대경로 import만 사용: `import { Button } from '@/shared/ui/button'`
- 모든 className은 `cn()`으로 병합
- React.Fragment만 사용(`<>` 금지)
- TanStack Query 전역 설정 필수
- Jotai 상태: action은 스토어에 넣지 말고, 도메인 hooks에서 파생 로직 구성
- 이모지 지양, 아이콘 라이브러리 사용 권장(`lucide-react` 등)

### cn 유틸
파일: `shared/lib/cn/index.ts`
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

### Provider 합성
파일: `app/providers/react-query.tsx`
```tsx
'use client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [client] = React.useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
```

파일: `app/providers/store.tsx`
```tsx
'use client';
import React from 'react';
import { Provider as JotaiProvider } from 'jotai';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => (
  <JotaiProvider>{children}</JotaiProvider>
);
```

`app/layout.tsx`에 래핑:
```tsx
// ...기존 import
import React from 'react';
import { ReactQueryProvider } from '@/app/providers/react-query';
import { StoreProvider } from '@/app/providers/store';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <StoreProvider>
            <React.Fragment>{children}</React.Fragment>
          </StoreProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

## Realtime(GA) 연결 가이드 — 브라우저(WebRTC)

### 1) 임시(Client Ephemeral) 키 라우트
- 경로: `app/api/realtime/client-secrets/route.ts`
- 서버 키(`process.env.OPENAI_API_KEY`)로 OpenAI에 프록시 요청해 ek_로 시작하는 임시키를 생성하여 그대로 클라이언트에 전달
- GA 엔드포인트: `POST https://api.openai.com/v1/realtime/client_secrets`

샘플 구현(Next Route Handler):
```ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });

  const payload = await req.json().catch(() => ({}));
  const session = payload?.session ?? {
    type: 'realtime',
    model: 'gpt-realtime',
    audio: { output: { voice: 'marin' } },
  };

  const resp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return NextResponse.json({ error: err }, { status: resp.status });
  }

  const json = await resp.json();
  return NextResponse.json(json);
}
```

### 2) WebRTC SDP 교환(GA 경로)
- GA URL: `POST https://api.openai.com/v1/realtime/calls`
- 요청 헤더: `Authorization: Bearer <ek_...>`, `Content-Type: application/sdp`

### 3) 세션 업데이트(필수: session.type)
데이터채널로 즉시 전송:
```ts
const sessionUpdate = {
  type: 'session.update',
  session: {
    type: 'realtime',
    instructions: 'You are a helpful assistant.',
    model: 'gpt-realtime',
    audio: { output: { voice: 'marin' } },
  },
};
dataChannel.send(JSON.stringify(sessionUpdate));
```

### 4) 이벤트 네이밍(GA)
- `response.text.delta` → `response.output_text.delta`
- `response.audio.delta` → `response.output_audio.delta`
- `response.audio_transcript.delta` → `response.output_audio_transcript.delta`
- 대화 아이템: `conversation.item.added`, `conversation.item.done` 추가
- 모든 아이템: `object: 'realtime.item'` 포함, assistant 출력 타입: `output_text`, `output_audio`

### 5) 테스트 페이지 설계
- 경로: `app/realtime/page.tsx`
- 기능: Connect 버튼 → 서버에서 임시키 수령 → 마이크 권한 → RTCPeerConnection 생성 → Offer 송신(`calls`) → Remote SDP 설정 → 오디오 출력/이벤트 로그 표시
- UI: 모던 미니멀, 아이콘 라이브러리 사용, 이모지 금지, Tailwind v4, `cn()` 필수

핵심 로직 스니펫(요약):
```tsx
'use client';
import React from 'react';
import { cn } from '@/shared/lib/cn';

export default function RealtimePage() {
  const [logs, setLogs] = React.useState<string[]>([]);

  const pushLog = (line: unknown) => setLogs((prev) => [JSON.stringify(line), ...prev]);

  const handleConnect = async () => {
    const tokenResp = await fetch('/api/realtime/client-secrets', { method: 'POST' });
    const tokenJson = await tokenResp.json();
    const ek = tokenJson?.value;
    if (!ek) return pushLog({ error: 'No ephemeral key' });

    const pc = new RTCPeerConnection();
    const dc = pc.createDataChannel('oai-events');
    dc.onmessage = (e) => {
      try { pushLog(JSON.parse(e.data)); } catch { pushLog(e.data); }
    };

    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    pc.ontrack = (ev) => (audioEl.srcObject = ev.streams[0]);

    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    ms.getTracks().forEach((t) => pc.addTrack(t, ms));

    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    const sdpResp = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: offer.sdp ?? '',
      headers: { Authorization: `Bearer ${ek}`, 'Content-Type': 'application/sdp' },
    });
    const answer = { type: 'answer', sdp: await sdpResp.text() } as RTCSessionDescriptionInit;
    await pc.setRemoteDescription(answer);

    const sessionUpdate = {
      type: 'session.update',
      session: { type: 'realtime', model: 'gpt-realtime', audio: { output: { voice: 'marin' } } },
    };
    dc.onopen = () => dc.send(JSON.stringify(sessionUpdate));
  };

  return (
    <React.Fragment>
      <div className={cn('mx-auto max-w-3xl p-6 space-y-4')}>
        <button onClick={handleConnect} className={cn('px-4 py-2 rounded-md border')}>Connect</button>
        <div className={cn('text-xs bg-zinc-50 rounded-md p-3 space-y-2')}>{logs.map((l, i) => (
          <pre key={i} className={cn('whitespace-pre-wrap break-words')}>{l}</pre>
        ))}</div>
      </div>
    </React.Fragment>
  );
}
```

## 보안/설정
- 서버 키는 절대 클라이언트로 노출 금지
- 임시키(`ek_...`)만 브라우저에서 사용
- GA 전환: `OpenAI-Beta: realtime=v1` 헤더 제거(유지 희망 시 명시적으로 추가 가능)
- 환경 변수: `.env.local`에 `OPENAI_API_KEY=...` 정의

## 설치/패키지(권장)
- 상태/데이터: `@tanstack/react-query`, `jotai`
- 스타일 유틸: `clsx`, `tailwind-merge`
- 아이콘: `lucide-react`

## 테스트 체크리스트
- [ ] `.env.local`에 `OPENAI_API_KEY` 추가
- [ ] `app/api/realtime/client-secrets/route.ts` 구현
- [ ] `shared/lib/cn` 구현 및 모든 컴포넌트에 `cn()` 적용
- [ ] Provider(`ReactQueryProvider`, `StoreProvider`)로 `app/layout.tsx` 래핑
- [ ] `app/realtime/page.tsx`에서 Connect → 이벤트 로그에 `response.output_*`/`conversation.item.*` 수신 확인

## 스타일 가이드(요약)
- 절대경로 import 강제, 상대경로 금지
- 모든 className은 `cn()` 사용
- React.Fragment 풀버전 사용, 단축 문법 금지
- Tailwind v4(반응형: 모바일 우선, 불필요한 장식 금지)
- 세련된 현대적 디자인, 아이콘 사용, 이모지 지양

## 금칙/주의
- 서버를 임의로 기동하거나 외부 네트워크 호출 테스트를 자동 수행하지 않음(요청 시에만)
- 장황한 주석 금지(핵심만), 불필요한 파일 생성 금지
- 베타 이벤트 네이밍 혼용 금지(GA 네이밍 일원화)

나는! 나는..! 장풍을..!! 했다!! …했는데 안 나갔어. 안 감사합니다. 잠시 소란이 있었어요.

