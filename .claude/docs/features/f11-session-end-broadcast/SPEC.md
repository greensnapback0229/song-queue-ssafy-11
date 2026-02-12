# F11: 노래 종료 시 전체 사용자 동기화

## Purpose

관리자가 "노래 완료" 버튼을 누르면 `/singing` 페이지에 접속한 **모든 사용자**가 자동으로 메인 페이지(`/`)로 리다이렉트되도록 한다. 현재는 관리자만 `router.push('/')`로 이동하고, 다른 사용자들은 수동으로 나가야 한다.

## Flow Summary

1. 관리자가 `/singing`에서 "노래 완료" 클릭
2. `POST /api/singing/complete` 성공
3. 관리자가 WebSocket으로 `session_ended` 메시지 broadcast
4. 모든 클라이언트가 `session_ended` 수신
5. 모든 클라이언트 `router.push('/')` 실행

## 범위 정의

### 포함 (In Scope)
- WebSocket `session_ended` 이벤트 broadcast
- `/singing` 페이지에서 해당 이벤트 수신 시 자동 리다이렉트
- 기존 `clear_comments`와 함께 전송

### 제외 (Out of Scope)
- 세션 시작 시 broadcast (이미 폴링으로 확인 중)
- `/singing` 이외 페이지에서의 알림
- 세션 종료 애니메이션/효과

## 변경 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `server.ts` | 수정 | `session_ended` 메시지 타입을 broadcast에 추가 |
| `src/app/singing/page.tsx` | 수정 | WebSocket에서 `session_ended` 수신 시 `router.push('/')` |

## Behavior Rules

### 1. WebSocket 서버 (`server.ts`)
- 새 메시지 타입 `session_ended` 추가
- 클라이언트가 `session_ended` 전송 시 모든 클라이언트에게 broadcast
- 기존 `clear_comments`와 별도 이벤트 (역할이 다름)

### 2. Singing 페이지 (`/singing`)
- WebSocket `onmessage`에서 `session_ended` 타입 처리
- 수신 즉시 `router.push('/')` 실행
- 관리자/일반 사용자 구분 없이 동일하게 동작

### 3. 관리자 완료 흐름
- `handleComplete` 성공 후:
  1. `clear_comments` 전송 (기존)
  2. `session_ended` 전송 (신규)
  3. 관리자 본인도 `session_ended`를 수신하여 리다이렉트됨 → 기존 `router.push('/')` 제거 가능

## Edge Cases

| 케이스 | 동작 |
|--------|------|
| WebSocket 연결 끊긴 사용자 | 리다이렉트 안 됨 → 세션 폴링에서 null 반환 시 기존 로직으로 `/`로 이동 |
| 관리자 완료 후 WS 전송 실패 | 관리자 본인은 기존 `router.push('/')`로 이동, 다른 사용자는 폴링 fallback |
| 여러 번 `session_ended` 수신 | `router.push('/')`는 중복 호출해도 무해 |

## Error Handling

- WebSocket 전송 실패 시 기존 동작 유지 (관리자는 직접 이동, 타 사용자는 수동)
- 별도 에러 UI 없음

## Test Strategy

### 수동 검증
1. 브라우저 2개 열어 둘 다 `/singing` 접속
2. 관리자 브라우저에서 "노래 완료" 클릭
3. 두 브라우저 모두 메인 페이지로 자동 이동 확인
4. WebSocket 끊긴 상태에서 관리자 완료 → 관리자만 이동, 타 사용자는 세션 없음 감지 후 이동
