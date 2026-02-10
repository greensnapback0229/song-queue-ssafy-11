# SPEC: F5 - 노래 완료 & 내역 저장

## Purpose

관리자가 "노래 완료" 버튼을 누르면 현재 singing_session을 종료하고,
song_history에 기록을 저장한 뒤 메인 페이지로 복귀한다.

## Flow Summary

1. 관리자가 /singing에서 "노래 완료" 클릭
2. POST /api/singing/complete 호출
3. 서버: singing_session → song_history 이동 + 세션 삭제
4. 클라이언트: WebSocket으로 clear_comments 전송
5. / 페이지로 리다이렉트
6. 다른 사용자들은 3초 폴링으로 세션 종료 감지 → / 로 복귀

## 범위 정의

### In Scope
- POST /api/singing/complete API (관리자 인증)
- 트랜잭션: session → history 이동 + session 삭제
- 댓글 초기화 (WebSocket clear_comments)
- 완료 후 메인 페이지 리다이렉트

### Out of Scope
- 노래 평가/점수
- 완료 알림

## API Routes

### POST /api/singing/complete
- **인증**: 관리자 비밀번호 필요 (`x-admin-password` 헤더)
- **Body**: `{ session_id: number }`
- **동작**:
  1. singing_session에서 해당 세션 조회
  2. 트랜잭션:
     - song_history에 삽입 (name, reason, song_title)
     - singing_session에서 삭제
  3. 저장된 history 반환
- **Response**: `{ history: SongHistory }`

## Edge Cases

- 세션이 이미 없는 경우 → 404 에러
- 완료 중 네트워크 에러 → 에러 알림 + 버튼 재활성화
- clear_comments 전송 실패 → 다음 세션 시작 시 자연스럽게 초기화

## Test Strategy

- T1: POST /api/singing/complete → history 생성 + session 삭제 확인
- T2: 존재하지 않는 session_id → 404 에러
- T3: 비인증 요청 → 401 에러
