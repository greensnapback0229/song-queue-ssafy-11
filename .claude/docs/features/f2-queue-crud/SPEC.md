# SPEC: F2 - 큐 관리 (Queue CRUD)

## Purpose

벌칙에 당첨된 사람을 노래 큐에 추가/조회/삭제하는 기능.
Deque 구조로 앞/뒤 양방향 삽입이 가능하고, 큐 형태로 시각적으로 표시한다.

## Flow Summary
1. 사용자가 이름 + 벌칙 사유 입력
2. 앞쪽 또는 뒤쪽에 enqueue
3. 큐 목록이 순서대로 표시됨
4. 큐에서 개별 항목 삭제 가능

## 범위 정의

### In Scope
- 큐 목록 조회 (position 순서)
- Enqueue: 앞쪽(front) / 뒤쪽(back) 양방향 삽입
- 입력 폼: 이름, 벌칙 사유, 삽입 방향
- 큐 시각적 UI (Queue 형태)
- 개별 항목 삭제

### Out of Scope
- Dequeue (F3에서 구현)
- 노래 시작 모드 (F4)
- 순서 변경 (드래그 앤 드롭)

## API Routes

### GET /api/queue
- 큐 목록 조회
- position ASC 정렬
- Response: `{ items: QueueItem[] }`

### POST /api/queue
- 큐에 항목 추가
- **인증**: 관리자 비밀번호 필요 (`x-admin-password` 헤더)
- Body: `{ name: string, reason: string, direction: "front" | "back" }`
- direction="back": 현재 max(position)+1로 삽입
- direction="front": 모든 기존 항목 position+1, 새 항목 position=0
- Response: `{ item: QueueItem }`
- Validation: name, reason 필수 (빈 문자열 불가)

### DELETE /api/queue/[id]
- 큐에서 항목 삭제
- **인증**: 관리자 비밀번호 필요 (`x-admin-password` 헤더)
- 삭제 후 position 재정렬
- Response: `{ success: true }`

## UI Components

### QueueList
- 큐 항목을 순서대로 표시
- 각 항목: 순서 번호, 이름, 벌칙 사유
- 삭제 버튼
- 빈 큐일 때 "큐가 비어있습니다" 표시

### EnqueueForm
- 이름 입력 (필수)
- 벌칙 사유 입력 (필수)
- 삽입 방향 선택 (앞쪽/뒤쪽, 기본값: 뒤쪽)
- 추가 버튼

## Edge Cases
- 빈 큐에 front 삽입 → position=0으로 정상 삽입
- 이름/사유 공백만 입력 → trim 후 빈 문자열이면 에러
- 동시 삽입 → SQLite WAL 모드로 처리

## Test Strategy
- T1: GET /api/queue → 빈 배열 반환
- T2: POST /api/queue (back) → position 증가 확인
- T3: POST /api/queue (front) → position=0, 기존 항목 position+1
- T4: DELETE /api/queue/[id] → 삭제 + position 재정렬
- T5: Validation → name/reason 빈값 시 400 에러
- T6: npm run build 성공
