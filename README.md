# Next Realtime App

OpenAI Realtime API(GA)를 브라우저에서 테스트할 수 있는 실시간 음성/텍스트 에이전트 콘솔입니다.

## 주요 기능

- **음성 모드(WebRTC)**: 마이크 입력과 TTS 응답을 실시간으로 주고받는 양방향 음성 통화
- **텍스트 모드(WebSocket)**: 마이크 없이 저지연 텍스트 채팅
- **실시간 이벤트 로깅**: OpenAI Realtime API 이벤트를 실시간으로 모니터링
- **임시 키 발급**: 서버 API 키를 안전하게 보호하며 클라이언트용 임시 키 자동 생성
- **사라도령 캐릭터**: 제주 신화 기반 심리 상담 AI 에이전트 프롬프트 내장

## 기술 스택

### Core
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**

### Styling
- **Tailwind CSS v4** (다크 모드 지원)
- **clsx** + **tailwind-merge** (cn 유틸)

### State Management
- **TanStack Query v5** - 서버 상태 관리
- **Jotai v2** - 클라이언트 상태 관리

### Realtime API
- **@openai/agents** - OpenAI Realtime SDK
- **WebRTC** - 음성 통신
- **WebSocket** - 텍스트 통신

## 설치

```bash
# pnpm 사용 (권장)
pnpm install

# 또는 npm
npm install

# 또는 yarn
yarn install
```

## 환경 변수 설정

`.env.local` 파일을 생성하고 OpenAI API 키를 추가하세요:

```bash
OPENAI_API_KEY=sk-proj-...
```

> **보안**: 서버 키는 절대 클라이언트로 노출되지 않습니다. 서버에서 임시 키(`ek_...`)를 발급하여 브라우저에 전달합니다.

## 실행

```bash
# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

개발 서버 실행 후 [http://localhost:3000](http://localhost:3000)을 브라우저에서 열어주세요.

## 프로젝트 구조 (FSD)

```
next-realtime-app/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── realtime/
│   │       └── client-secret/    # 임시 키 발급 API
│   ├── layout.tsx                # 루트 레이아웃 + Providers
│   ├── page.tsx                  # 메인 페이지
│   └── providers/                # React Query, Jotai Provider
├── entities/                     # 도메인 모델
│   ├── agent/
│   │   └── roles/
│   │       └── saradoreng.ts     # 사라도령 시스템 프롬프트
│   └── session/
│       └── session.types.ts      # 세션 타입 정의
├── features/                     # 비즈니스 기능
│   └── voice-agent/
│       ├── api/                  # API 요청 로직
│       ├── hooks/                # 커스텀 훅
│       ├── model/                # Jotai atoms
│       └── ui/                   # UI 컴포넌트
├── shared/                       # 공용 유틸
│   └── lib/
│       └── cn/                   # className 병합 유틸
└── docs/                         # 문서
    └── realtime-improvements.md
```

## 주요 컴포넌트

### `VoiceAgentConsole`
src/features/voice-agent/ui/voice-agent-console.tsx:1

실시간 음성/텍스트 에이전트의 메인 UI 컴포넌트입니다:
- API 키 관리
- 프롬프트 설정 (headline, details)
- 전송 모드 선택 (voice/text)
- 음성 선택 (alloy/coral/marin)
- 연결/해제 제어
- 대화 내역 표시
- 이벤트 로그 표시

### `useRealtimeAgentConnection`
src/features/voice-agent/hooks/voice-agent.hooks.ts:1

Realtime API 연결을 관리하는 커스텀 훅:
- WebRTC/WebSocket 연결 처리
- 세션 생성 및 관리
- 메시지 송수신
- 이벤트 로깅
- 에러 핸들링

## API 엔드포인트

### `POST /api/realtime/client-secret`
app/api/realtime/client-secret/route.ts:1

서버 API 키로 OpenAI에 요청하여 클라이언트용 임시 키(`ek_...`)를 발급합니다.

**Request Body**:
```json
{
  "session": {
    "type": "realtime",
    "model": "gpt-realtime",
    "audio": {
      "output": {
        "voice": "marin"
      }
    }
  }
}
```

**Response**:
```json
{
  "value": "ek_...",
  "expires_at": 1234567890
}
```

## Realtime API 연결 흐름

1. **임시 키 발급**: `/api/realtime/client-secret` 호출
2. **WebRTC 연결**: `RTCPeerConnection` 생성 및 데이터 채널 설정
3. **SDP 교환**: OpenAI `/v1/realtime/calls` 엔드포인트에 Offer 전송
4. **세션 업데이트**: 데이터 채널로 `session.update` 이벤트 전송
5. **이벤트 수신**: 실시간으로 음성/텍스트 응답 수신

## 개발 가이드

프로젝트 전체에 적용되는 코딩 규칙은 `AGENTS.md` 파일을 참고하세요:
- 절대경로 import 강제 (`@/*`)
- `cn()` 유틸로 className 병합
- `React.Fragment` 풀버전 사용 (`<>` 금지)
- TanStack Query + Jotai 패턴
- Tailwind v4 모바일 우선 반응형

## 라이선스

MIT

## 관련 문서

- [AGENTS.md](./AGENTS.md) - 프로젝트 작업 가이드
- [OpenAI Realtime API Docs](https://platform.openai.com/docs/api-reference/realtime)
- [Next.js Documentation](https://nextjs.org/docs)
