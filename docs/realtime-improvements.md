# Realtime 이벤트 테스터 — 개선사항 요약

아래 항목은 현 프로젝트(next-realtime-app)에 즉시 적용 가능한 개선 포인트입니다. 보안 고려는 생략했습니다.

## 핵심 추가 작업
- TanStack Query/Jotai 전역 Provider 추가 및 `app/layout.tsx` 래핑
- `shared/lib/cn` 유틸 생성 후 모든 className 병합에 사용
- Realtime 임시 키 발급 라우트: `app/api/realtime/client-secrets/route.ts`
- GA 경로(`/v1/realtime/calls`)로 WebRTC SDP 교환하는 테스트 화면: `app/realtime/page.tsx`
- 이벤트 로그 UI: `response.output_*`, `conversation.item.*` 실시간 표시
- 아이콘 라이브러리 도입(예: lucide-react) — 이모지 지양

## 패키지
- `@tanstack/react-query`, `jotai`, `clsx`, `tailwind-merge`, `lucide-react`

## 이벤트/세션 명세(GA 반영)
- `session.update`에 `session.type: "realtime"` 필수, 음성 출력 설정 포함 가능
- 이벤트 네이밍 변경 적용: `response.text.delta → response.output_text.delta` 등
- 대화 아이템 이벤트: `conversation.item.added`, `conversation.item.done`
- 모든 아이템에 `object: "realtime.item"` 포함, assistant 출력 타입 `output_text`/`output_audio`

## 파일 배치 권장(FSD)
```
shared/lib/cn/index.ts
app/providers/react-query.tsx
app/providers/store.tsx
app/api/realtime/client-secrets/route.ts
app/realtime/page.tsx
entities/agent/roles/saradoreng.ts  ← 시스템 프롬프트(완료)
```

## 페이즈드 적용 제안
1) 공용 유틸/프로바이더(
   `shared/lib/cn`, `app/providers/*`) 생성 및 레이아웃 래핑
2) 임시 키 라우트 구현 후 로컬 호출로 ek_ 토큰 수령 확인
3) `realtime` 페이지에서 WebRTC 연결 및 이벤트 로그 구현
4) 음성 출력/마이크 입력 옵션 및 모델 파라미터 튜닝

## 시스템 프롬프트
- Realtime 세션용 시스템 프롬프트는 `entities/agent/roles/saradoreng.ts`의 `SARADORENG_SYSTEM_PROMPT`를 사용
- 트리거("안녕 사라도령")와 5문장 제한, 자해 관련 고정 응답 준수

