# SPEC: F7 - 관리자 인증

## Purpose

정적 비밀번호 기반으로 관리자 권한을 부여하여,
큐 등록/삭제, 노래 시작/완료, 내역 삭제를 관리자만 수행할 수 있도록 한다.

## Flow Summary

1. 헤더의 "관리자 로그인" 버튼 클릭
2. 비밀번호 입력 모달 표시
3. POST /api/auth/verify로 검증
4. 성공 시 AdminContext에 isAdmin=true + password 저장
5. localStorage에 비밀번호 캐시 (새로고침 시 자동 로그인)
6. 관리자 상태에 따라 UI 요소 표시/숨김

## 범위 정의

### In Scope
- POST /api/auth/verify: 비밀번호 검증 API
- AdminContext: 전역 관리자 상태 관리
- 헤더 로그인/로그아웃 UI
- 관리자 보호 API: `x-admin-password` 헤더 검증
- localStorage 비밀번호 캐시

### Out of Scope
- 회원가입/JWT/세션
- 비밀번호 변경 UI
- 다중 관리자 역할

## API Routes

### POST /api/auth/verify
- **Body**: `{ password: string }`
- **Response**: `{ success: boolean }`

### 보호되는 API 목록
| API | 메서드 | 검증 방식 |
|-----|--------|-----------|
| /api/queue | POST | `x-admin-password` 헤더 |
| /api/queue/[id] | DELETE | `x-admin-password` 헤더 |
| /api/singing/start | POST | `x-admin-password` 헤더 |
| /api/singing/complete | POST | `x-admin-password` 헤더 |
| /api/history/[id] | DELETE | `x-admin-password` 헤더 |

## 인증 흐름

```
[클라이언트]                    [서버]
   │                              │
   ├── POST /api/auth/verify ────►│
   │   { password: "ssafy11" }    │
   │                              ├── verifyPassword()
   │◄── { success: true } ────────┤
   │                              │
   ├── AdminContext.login()       │
   ├── localStorage.set()        │
   │                              │
   ├── POST /api/queue ──────────►│
   │   x-admin-password: ssafy11  │
   │                              ├── verifyPassword()
   │◄── { item: ... } ───────────┤
```

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/lib/auth.ts` | `verifyPassword()` - 환경변수 비밀번호 비교 |
| `src/context/AdminContext.tsx` | React Context + localStorage 캐시 |
| `src/app/api/auth/verify/route.ts` | 비밀번호 검증 엔드포인트 |
| `src/components/Layout/Header.tsx` | 로그인/로그아웃 UI + 모달 |

## 비밀번호 설정

- 환경변수: `ADMIN_PASSWORD` (기본값: `ssafy11`)
- docker-compose.yml에서 설정

## UI 변화 (관리자 여부)

| 요소 | 비관리자 | 관리자 |
|------|---------|--------|
| 큐 등록 폼 | 숨김 | 표시 |
| 큐 삭제 버튼 | 숨김 | 표시 |
| "노래 시작" 버튼 | disabled | 활성화 |
| "노래 완료" 버튼 | 숨김 | 표시 |
| 내역 삭제 버튼 | 숨김 | 표시 |
| 헤더 상태 | "관리자 로그인" | "관리자 ✓" + "로그아웃" |

## Edge Cases

- 잘못된 비밀번호 → "비밀번호가 틀렸습니다" alert
- localStorage에 이전 비밀번호 → 페이지 로드 시 자동 verify
- 서버 비밀번호 변경 후 → verify 실패 시 자동 logout

## Test Strategy

- T1: 올바른 비밀번호 → success: true
- T2: 틀린 비밀번호 → success: false
- T3: 비인증 상태에서 보호 API 호출 → 401
- T4: 인증 상태에서 보호 API 호출 → 정상 동작
