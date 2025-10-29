# next-realtime-app — 프로젝트 분석 및 개선 제안

아이고난1, 코드가 꽤 잘 깔렸네. 나는! 나는..! 장풍을..!! 했다!! …아 아니고, 정리부터 간다.

**요약**
- Next.js 16(App Router) + React 19 + Tailwind v4
- 상태관리/데이터: Jotai + TanStack Query 이미 탑재
- OpenAI Realtime(Agents Realtime SDK) 연동: 임시키 발급 라우트 + 세션 관리 + GA 이벤트 네이밍 반영 완료
- FSD 구조 준수(entities/features/shared 등) 및 `@/*` 절대 경로 사용 중

**핵심 레퍼런스 파일**
- 레이아웃/프로바이더: `app/layout.tsx`, `src/app/provider/app-provider.tsx`, `src/app/provider/query-provider.tsx`
- 임시 키 라우트: `app/api/realtime/client-secret/route.ts`
- 피처 진입점: `src/features/index.ts`, `src/features/voice-agent/ui/voice-agent-console.tsx`
- 훅/상태: `src/features/voice-agent/hooks/voice-agent.hooks.ts`, `src/features/voice-agent/model/voice-agent.atoms.ts`
- 이벤트 매핑: `src/features/voice-agent/lib/history-utils.ts`
- 유틸: `src/shared/lib/cn.ts`


## 현재 상태 점검
- 절대 경로(`@/*`) 활성: `tsconfig.json`에서 `"@/*": ["./src/*"]`
- TanStack Query Provider: `src/app/provider/query-provider.tsx`에서 기본 옵션 세팅 후 `AppProvider`로 합성
- Jotai Provider: `AppProvider`에서 래핑 적용
- cn 유틸: `src/shared/lib/cn.ts` 사용, 전역적으로 `className={cn(...)}` 패턴 준수
- Realtime 임시키 라우트: `app/api/realtime/client-secret/route.ts` 구현, 모델/보이스/지침 구성 및 유효성 검사 포함
- GA 이벤트 네이밍: 훅에서 `response.output_text.delta` 등 GA 명세 사용 확인
- UI: `VoiceAgentConsole`로 Voice/Text 모드 모두 지원, 이벤트 로그/히스토리 반영


## 발견된 이슈/리스크
- 중복 프로바이더 폴더
  - 사용 중: `src/app/provider/*`
  - 중복 흔적: `app/providers/react-query.tsx`, `app/providers/store.tsx` (실제 레이아웃에서 미사용)
  - 권장: 하나로 정리. `src/app/provider/*`를 기준으로 유지하고 `app/providers/*` 제거 또는 마이그레이션 가이드 명시

- cn 유틸 중복
  - 사용 기준: `src/shared/lib/cn.ts`
  - 중복 파일: `shared/lib/cn/index.ts` (루트 `shared/` 경로)
  - 권장: `src/shared/lib/cn.ts`만 유지. 루트 `shared/` 트리 의존 제거

- 라우트 네이밍 비일치
  - 문서(AGENTS.md) 예시: `client-secrets`
  - 실제 구현: `app/api/realtime/client-secret/route.ts` (단수)
  - 프론트 호출 경로도 `'/api/realtime/client-secret'` 사용
  - 권장: 파일/경로를 `client-secrets`로 통일하거나 문서 쪽 예시를 현행 경로로 정정. 팀 합의 후 일괄 변경

- 아이콘 도입 미흡
  - 요구사항: 이모지 지양, 아이콘 라이브러리 권장(`lucide-react` 등)
  - 권장: 버튼/상태 인디케이터에 `lucide-react` 최소 도입(예: 연결/해제, 경고, 성공 상태)

- 보안/환경 변수
  - `.env`는 `.gitignore`에 포함되어 안전. 로컬 키가 존재하나 클라이언트에는 임시키만 전달(OK)
  - 권장: CI/CD 환경에서 `.env.local`/시크릿 관리 표준화


## 개선 제안(우선순위)
- P0: 프로바이더/유틸 중복 제거
  - `app/providers/*` 제거 또는 `src/app/provider/*`로 병합 문서화
  - `shared/lib/cn/index.ts` 제거하고 `src/shared/lib/cn.ts`만 사용

- P0: 라우트 네이밍 통일
  - API 라우트와 호출 경로를 `client-secrets` 또는 `client-secret` 중 하나로 팀 합의 후 일괄 변경
  - 관련 파일: `app/api/realtime/client-secret/route.ts`, `src/features/voice-agent/api/voice-agent.api.ts`

- P1: /realtime 테스트 페이지(선택)
  - 간소화된 이벤트 뷰어(+오디오 출력) 페이지 추가로 디버깅 가속
  - 경로 예: `app/realtime/page.tsx` (현재 콘솔 UI는 충분히 완성도 높음 — 디버깅 특화 화면은 선택)

- P1: 아이콘 교체/추가
  - `lucide-react` 도입으로 상태/동작 시각화 강화(연결, 응답 대기, 오류)

- P2: 에러 경계/알림 패턴
  - 한정된 범위의 Error Boundary + 토스트 알림(쿨다운 포함)으로 사용자 경험 향상


## 작업 체크리스트
- [ ] `src/app/provider/*` 기준으로 전역 Provider 일원화
- [ ] `src/shared/lib/cn.ts` 기준으로 cn 유틸 단일화
- [ ] `client-secret(s)` 라우트/호출 경로 통일(코드/문서 동기화)
- [ ] 아이콘 라이브러리 도입(이모지 제거)
- [ ] (선택) `app/realtime/page.tsx` 디버깅 페이지 추가


## 참고
- 전사 가이드는 루트의 `AGENTS.md`에 정리되어 있음. 본 문서는 현 리포 상태를 반영한 분석/개선용 스냅샷.

근데 움직임이 예사롭지 않은 것은 맞아! 정리 끝. 잠시 소란이 있었어요.

