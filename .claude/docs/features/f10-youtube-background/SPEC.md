# F10: 노래 모드 YouTube 영상 배경

## Purpose

노래 모드(`/singing`)에서 관리자가 YouTube 반주 영상을 선택하면 해당 영상이 배경으로 재생되어 반주로 활용할 수 있도록 한다. 영상 미선택 시 기존 보라색 그라디언트 배경이 유지된다.

## 범위 정의

### 포함 (In Scope)
- YouTube Data API v3를 이용한 영상 검색 (서버 프록시)
- 검색 결과에서 영상 선택/해제 + 토글 미리보기
- 선택된 영상 ID를 세션에 저장 및 이력 보존
- `/singing` 페이지에서 YouTube iframe 배경 재생
- 영상 미선택 시 기존 보라색 그라디언트 fallback

### 제외 (Out of Scope)
- YouTube 영상 다운로드/저장
- 재생 중 영상 변경
- 영상 볼륨 조절 UI
- 모바일 최적화

## Inputs / Outputs

### API: `GET /api/youtube/search`

| 항목 | 값 |
|------|-----|
| 인증 | `x-admin-password` 헤더 |
| 쿼리 | `q` (검색어) |
| 자동 추가 키워드 | `금영노래방` |
| 필터 | `videoEmbeddable: true`, `videoSyndicated: true` |
| 최대 결과 | 5개 |

**Input**: `?q=사랑의인사`
**Output**:
```json
{
  "results": [
    {
      "videoId": "abc123",
      "title": "사랑의인사 금영노래방",
      "channelTitle": "금영노래방",
      "thumbnailUrl": "https://i.ytimg.com/vi/abc123/mqdefault.jpg"
    }
  ]
}
```

### API: `POST /api/singing/start`

**Input 변경**: body에 `youtube_video_id` (optional) 추가
```json
{
  "song_title": "사랑의인사",
  "youtube_video_id": "abc123"
}
```

### API: `GET /api/singing/current`

**Output 변경**: 응답에 `youtube_video_id` 포함

### API: `POST /api/singing/complete`

**동작 변경**: `song_history` INSERT 시 `youtube_video_id` 이관

## Behavior Rules

### 1. YouTube 검색 (DequeueModal)
- 노래 제목 입력 후 "YouTube 검색" 버튼 클릭 또는 Enter
- 검색어에 `금영노래방` 자동 추가
- 결과: 썸네일 + 제목 + 채널명, 최대 5개 리스트
- 영상 클릭 → 해당 항목 아래에 미리보기 iframe 토글 펼침
- 같은 영상 다시 클릭 → 미리보기 접힘 + 선택 해제
- 다른 영상 클릭 → 이전 접힘, 새 영상 펼침
- 영상 선택 없이도 "노래 시작" 가능

### 2. 안내 문구
- 검색 결과 상단에 경고 표시:
  - **"노래방 공식 영상은 YouTube에서 임베딩을 허용하지 않습니다."** (굵게)
  - "금영노래방은 임베딩을 허용합니다. 미리보기로 재생 가능 여부를 확인해주세요."

### 3. 배경 영상 재생 (`/singing` 페이지)
- `youtube_video_id` 있으면: YouTube iframe 배경 + `bg-black/40` 스크림
- `youtube_video_id` 없으면: 기존 보라색 그라디언트
- 영상은 사이드바(댓글) 제외한 메인 영역에만 표시
- 16:9 비율 유지 (잘리지 않음, 여백은 검정)
- autoplay, loop, controls 숨김, 소리 ON
- 텍스트에 `text-shadow` 적용하여 가독성 확보
- 댓글 사이드바는 항상 불투명 흰색

### 4. 데이터 보존
- `singing_session.youtube_video_id`: 세션 중 보관
- 노래 완료 시 `song_history.youtube_video_id`로 이관

## DB Schema 변경

```sql
-- 마이그레이션 (ALTER TABLE, 이미 존재 시 무시)
ALTER TABLE singing_session ADD COLUMN youtube_video_id TEXT;
ALTER TABLE song_history ADD COLUMN youtube_video_id TEXT;
```

## 변경된 파일

| 파일 | 작업 | 역할 |
|------|------|------|
| `password.env` | 수정 | `YOUTUBE_API_KEY` 환경변수 추가 |
| `src/lib/schema.ts` | 수정 | `youtube_video_id` 컬럼 마이그레이션 |
| `src/types/index.ts` | 수정 | `SingingSession`, `SongHistory`에 필드 추가, `YouTubeSearchResult` 인터페이스 |
| `src/app/api/youtube/search/route.ts` | 신규 | YouTube Data API v3 검색 프록시 |
| `src/app/api/singing/start/route.ts` | 수정 | `youtube_video_id` 수신/저장 |
| `src/app/api/singing/current/route.ts` | 수정 | SELECT에 `youtube_video_id` 추가 |
| `src/app/api/singing/complete/route.ts` | 수정 | history INSERT에 `youtube_video_id` 이관 |
| `src/components/Queue/DequeueModal.tsx` | 수정 | YouTube 검색 UI + 토글 미리보기 + 안내 문구 |
| `src/components/Singing/YouTubeBackground.tsx` | 신규 | YouTube iframe 전체화면 배경 컴포넌트 |
| `src/app/singing/page.tsx` | 수정 | 배경 영상 통합 + z-index 레이어링 |

## Edge Cases

| 케이스 | 동작 |
|--------|------|
| YouTube API 키 미설정 | 검색 시 500 에러 + "YouTube API 키가 설정되지 않았습니다" |
| 검색어 빈 문자열 | 400 에러 + "검색어를 입력해주세요" |
| 검색 결과 0개 | 빈 리스트 (안내 문구 미표시) |
| 임베딩 차단 영상 선택 | 미리보기에서 재생 불가 확인 → 다른 영상 선택 유도 |
| 영상 미선택 후 노래 시작 | 정상 동작 (기존 보라색 그라디언트) |
| 비관리자의 YouTube 검색 시도 | 401 에러 |

## Error Handling

| 에러 | HTTP 코드 | 메시지 |
|------|-----------|--------|
| 관리자 미인증 | 401 | 관리자 권한이 필요합니다 |
| 검색어 없음 | 400 | 검색어를 입력해주세요 |
| API 키 미설정 | 500 | YouTube API 키가 설정되지 않았습니다 |
| YouTube API 호출 실패 | 502 | YouTube 검색에 실패했습니다 |
| 기타 서버 오류 | 500 | YouTube 검색 중 오류가 발생했습니다 |

## Test Strategy

### 수동 검증
1. `npm run build` 성공
2. YouTube API 키 없어도 빌드 에러 없음 (런타임에서만 사용)
3. 영상 선택 없이 노래 시작 → 기존 보라색 배경 정상 동작
4. 영상 클릭 → 미리보기 토글 정상 동작
5. 영상 선택 후 노래 시작 → `/singing`에서 배경 영상 재생 + 소리
6. 노래 완료 시 `song_history`에 `youtube_video_id` 보존
7. 임베딩 차단 영상은 미리보기에서 확인 가능
