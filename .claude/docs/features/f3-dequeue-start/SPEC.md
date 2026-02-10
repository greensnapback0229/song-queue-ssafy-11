# SPEC: F3 - Dequeue & 노래 시작

## Purpose

큐의 첫 번째 사람을 꺼내고(dequeue), 노래 제목을 입력받아
singing_session을 생성하여 노래 부르기 모드를 시작한다.

## Flow Summary

1. 관리자가 "노래 시작" 버튼 클릭
2. DequeueModal이 열림 (다음 사람 정보 표시)
3. 노래 제목 입력
4. "시작" 클릭 → POST /api/singing/start
5. 서버: queue_items에서 position=0 삭제 + position 재정렬 + singing_session 생성
6. 클라이언트: /singing 페이지로 이동

## 범위 정의

### In Scope
- DequeueModal 컴포넌트 (다음 사람 표시 + 노래 제목 입력)
- POST /api/singing/start API
- 트랜잭션: dequeue + position 재정렬 + 세션 생성
- 노래 시작 후 /singing 리다이렉트

### Out of Scope
- 노래 부르기 UI (F4)
- 노래 완료 처리 (F5)

## API Routes

### POST /api/singing/start
- **인증**: 관리자 비밀번호 필요 (`x-admin-password` 헤더)
- **Body**: `{ song_title: string }`
- **동작**:
  1. 현재 활성 세션 존재 확인 → 있으면 409 에러
  2. queue_items에서 position 최소값 항목 조회
  3. 트랜잭션:
     - queue_items에서 해당 항목 삭제
     - 나머지 항목 position - 1
     - singing_session에 새 레코드 삽입
  4. 생성된 세션 반환
- **Response**: `{ session: SingingSession }`

### GET /api/singing/current
- **인증**: 불필요
- **Response**: `{ session: SingingSession | null }`

## UI Components

### DequeueModal
- Props: `isOpen`, `nextPerson` (QueueItem | null), `onClose`, `onStart`
- 다음 사람 이름/벌칙 사유 표시
- 노래 제목 입력 필드 (필수)
- 시작/취소 버튼

## Edge Cases

- 큐가 비어있을 때 → "노래 시작" 버튼 disabled
- 이미 활성 세션이 있을 때 → 409 Conflict 에러
- 노래 제목 미입력 → 시작 버튼 disabled

## Test Strategy

- T1: POST /api/singing/start → 세션 생성 + 큐에서 제거 확인
- T2: 활성 세션 존재 시 → 409 에러
- T3: 빈 큐일 때 → 404 에러
- T4: position 재정렬 확인
