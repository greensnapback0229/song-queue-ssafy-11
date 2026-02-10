# SPEC: F4 - 노래 부르기 모드 (Live Mode)

## Purpose

노래 부르는 사람의 정보를 전체화면으로 표시하고,
WebSocket을 통해 실시간 댓글을 주고받는 라이브 모드를 제공한다.

## Flow Summary

1. /singing 페이지 접속 → GET /api/singing/current로 세션 조회
2. 세션 없으면 / 로 리다이렉트
3. 세션 있으면 전체화면 UI 표시 + WebSocket /ws 연결
4. 서버가 기존 댓글 히스토리 전송 (type: 'history')
5. 사용자가 닉네임 + 댓글 입력 → WebSocket으로 전송
6. 서버가 모든 클라이언트에 브로드캐스트 (type: 'comment')
7. 댓글 목록 자동 스크롤

## 범위 정의

### In Scope
- 전체화면 노래 모드 UI (이름, 노래 제목, 벌칙 사유)
- WebSocket /ws 연결 (자동 재연결 3초)
- 실시간 댓글 사이드바 (w-96)
- 댓글 입력 폼 (닉네임 + 내용)
- 서버 메모리 댓글 히스토리 (새 클라이언트 접속 시 전송)
- 30초 ping/pong keepalive
- 다른 페이지(/, /history)에서 3초 폴링으로 세션 감지 → 자동 리다이렉트

### Out of Scope
- 댓글 DB 저장
- 댓글 삭제/수정
- 이모지 반응

## WebSocket 프로토콜

### 서버 → 클라이언트

```json
// 접속 시 기존 댓글 전송
{ "type": "history", "comments": [{ "nickname": "...", "content": "...", "timestamp": 123 }] }

// 새 댓글 브로드캐스트
{ "type": "comment", "nickname": "...", "content": "...", "timestamp": 123 }
```

### 클라이언트 → 서버

```json
// 댓글 전송
{ "type": "comment", "nickname": "...", "content": "...", "timestamp": 123 }

// 댓글 초기화 (노래 완료 시)
{ "type": "clear_comments" }
```

## 서버 구현 (server.ts)

- WebSocketServer: `noServer: true` 모드
- HTTP upgrade 이벤트에서 `/ws` 경로만 WebSocket 처리
- 나머지 경로는 Next.js에 위임 (기존 HMR WS와 충돌 방지)
- `sessionComments` 배열: 메모리에 현재 세션 댓글 보관
- 새 클라이언트 접속 시 히스토리 전송
- `clear_comments` 수신 시 배열 초기화

## UI 레이아웃

```
┌─────────────────────────────────┬──────────────┐
│                                 │ 실시간 댓글   │
│     지금 부르는 사람              │              │
│     [이름] (8xl)                │  댓글 목록    │
│                                 │  ...         │
│     노래 제목                    │              │
│     [제목] (4xl, yellow)        │              │
│                                 │  ────────    │
│     벌칙 사유                    │  닉네임 입력  │
│     [사유]                      │  댓글 + 전송  │
│                                 │              │
│     [노래 완료] (관리자만)       │              │
└─────────────────────────────────┴──────────────┘
```

## Edge Cases

- WebSocket 연결 끊김 → 3초 후 자동 재연결
- 새로고침 → WebSocket 재연결 + 히스토리 수신으로 댓글 복원
- 세션 종료 후 /singing 접속 → / 로 리다이렉트
- nginx 프록시 타임아웃 → 30초 ping으로 방지

## Test Strategy

- T1: /singing 페이지 세션 없을 때 리다이렉트 확인
- T2: WebSocket 연결 + 댓글 전송/수신 확인
- T3: 새 클라이언트 접속 시 히스토리 수신 확인
- T4: clear_comments 후 히스토리 비어있는지 확인
- T5: npm run build 성공
