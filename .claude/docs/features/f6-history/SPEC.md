# SPEC: F6 - 노래 내역 조회 & 삭제

## Purpose

완료된 노래의 내역을 조회하고, 관리자가 개별 내역을 삭제할 수 있다.

## Flow Summary

1. /history 페이지 접속 → GET /api/history
2. 완료 시간 역순으로 내역 목록 표시
3. 관리자: 각 항목에 "삭제" 버튼 표시
4. 삭제 클릭 → confirm 다이얼로그 → DELETE /api/history/[id]
5. 목록 새로고침

## 범위 정의

### In Scope
- GET /api/history: 전체 내역 조회 (completed_at DESC)
- DELETE /api/history/[id]: 개별 내역 삭제 (관리자 인증)
- /history 페이지 UI
- 시간 표시: Asia/Seoul 타임존
- 노래 세션 감지 폴링 (3초) → 세션 활성 시 /singing 리다이렉트

### Out of Scope
- 내역 수정
- 내역 검색/필터
- 페이지네이션

## API Routes

### GET /api/history
- **인증**: 불필요
- **Response**: `{ items: SongHistory[] }`
- **정렬**: completed_at DESC

### DELETE /api/history/[id]
- **인증**: 관리자 비밀번호 필요 (`x-admin-password` 헤더)
- **Response**: `{ success: true }`
- **에러**: 404 (항목 없음), 401 (비인증), 400 (잘못된 ID)

## UI

- 헤더: "노래 내역" 제목 + 총 N곡 표시
- 각 항목 카드: 이름, 노래 제목(purple), 벌칙 사유, 완료 시간
- 관리자일 때 완료 시간 옆에 "삭제" 텍스트 버튼 (red)
- 삭제 전 `confirm()` 확인
- 빈 내역: "아직 노래 내역이 없습니다" + 음표 이모지

## 시간 포맷

```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'Z'); // UTC로 파싱
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
};
```

## Edge Cases

- 삭제 실패 → alert 표시
- 빈 내역 → 안내 메시지
- 노래 세션 활성 중 → 자동 /singing 리다이렉트

## Test Strategy

- T1: GET /api/history → 역순 정렬 확인
- T2: DELETE /api/history/[id] → 삭제 성공
- T3: 존재하지 않는 id → 404
- T4: 비인증 삭제 → 401
- T5: npm run build 성공
