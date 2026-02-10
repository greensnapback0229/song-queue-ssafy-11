# SSAFY 서울 11반 노래 큐

SSAFY 서울 11반 교육 과정에서 벌칙으로 노래를 불러야 하는 사람들을 체계적으로 관리하는 웹서비스입니다. 큐에 추가된 사람들이 순서대로 노래를 부르고, 완료된 노래는 기록에 남깁니다.

## 주요 기능

### 1. 노래 큐 관리
- **양방향 추가**: 큐의 앞 또는 뒤에 사람을 추가 가능
- **정보 입력**: 이름과 벌칙 사유를 함께 기록
- **실시간 목록**: 현재 대기 중인 인원 확인

### 2. 노래 시작 및 진행
- **Dequeue**: 큐 맨 앞 사람을 꺼내고 노래 제목 입력
- **전체화면 모드**: 집중력 있는 노래 환경 제공
- **자동 리다이렉트**: 모든 유저가 3초 폴링으로 현재 노래 세션 감지

### 3. 실시간 댓글 (WebSocket)
- **비저장 댓글**: 노래 부르는 중 실시간 응원 메시지
- **연결 상태 표시**: WebSocket 연결 상태를 시각적으로 확인
- **자동 스크롤**: 최신 댓글이 자동으로 화면에 표시

### 4. 노래 내역 조회
- **영구 기록**: 완료한 모든 노래가 SQLite에 저장
- **상세 정보**: 가수 이름, 벌칙 사유, 노래 제목, 완료 시간 기록
- **역순 정렬**: 최신 노래부터 표시

## 기술 스택

| 영역 | 기술 |
|------|------|
| **프레임워크** | Next.js 16 (App Router) + TypeScript |
| **스타일** | Tailwind CSS 4 |
| **데이터베이스** | SQLite (better-sqlite3) |
| **실시간 통신** | WebSocket (ws) |
| **서버** | 커스텀 HTTP 서버 (Next.js + WebSocket 통합) |

## 프로젝트 구조

```
song-queue/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # 큐 메인 페이지
│   │   ├── layout.tsx                # 루트 레이아웃
│   │   ├── history/
│   │   │   └── page.tsx              # 노래 내역 페이지
│   │   ├── singing/
│   │   │   ├── page.tsx              # 노래 모드 (실시간 댓글 포함)
│   │   │   └── layout.tsx            # 노래 페이지 레이아웃
│   │   └── api/
│   │       ├── queue/
│   │       │   ├── route.ts          # GET: 큐 조회, POST: 큐에 추가
│   │       │   └── [id]/route.ts     # DELETE: 큐 항목 삭제
│   │       ├── singing/
│   │       │   ├── start/route.ts    # POST: Dequeue + 노래 시작
│   │       │   ├── current/route.ts  # GET: 현재 세션 조회
│   │       │   └── complete/route.ts # POST: 노래 완료 + 내역 저장
│   │       └── history/
│   │           └── route.ts          # GET: 노래 내역 조회
│   ├── components/
│   │   ├── Layout/
│   │   │   └── Header.tsx            # 헤더 컴포넌트
│   │   └── Queue/
│   │       ├── EnqueueForm.tsx       # 큐에 추가 폼
│   │       ├── QueueList.tsx         # 큐 목록 표시
│   │       └── DequeueModal.tsx      # 노래 시작 모달 (노래 제목 입력)
│   ├── lib/
│   │   ├── db.ts                     # SQLite 연결 및 초기화
│   │   └── schema.ts                 # 데이터베이스 테이블 스키마
│   └── types/
│       └── index.ts                  # TypeScript 타입 정의
├── server.ts                         # 커스텀 서버 (Next.js + WebSocket)
├── Dockerfile                        # Docker 이미지 설정
├── docker-compose.yml                # Docker Compose 설정
├── package.json                      # 프로젝트 의존성
├── tsconfig.json                     # TypeScript 설정
├── next.config.ts                    # Next.js 설정
└── data/                             # SQLite 데이터베이스 (gitignore)
```

## 데이터베이스 스키마

### queue_items (큐 항목)
```sql
CREATE TABLE queue_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- 사람 이름
  reason TEXT NOT NULL,            -- 벌칙 사유
  position INTEGER NOT NULL,       -- 큐 내 순서 (0부터 시작)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_queue_items_position ON queue_items(position);
```

### singing_session (진행 중인 세션)
```sql
CREATE TABLE singing_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- 가수 이름
  reason TEXT NOT NULL,            -- 벌칙 사유
  song_title TEXT NOT NULL,        -- 노래 제목
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### song_history (노래 내역)
```sql
CREATE TABLE song_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- 가수 이름
  reason TEXT NOT NULL,            -- 벌칙 사유
  song_title TEXT NOT NULL,        -- 노래 제목
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API 레퍼런스

### 큐 관리

#### GET /api/queue
**응답**: 현재 큐에 있는 모든 항목 조회
```json
{
  "items": [
    {
      "id": 1,
      "name": "김민준",
      "reason": "과제 미제출",
      "position": 0,
      "created_at": "2025-02-10T10:00:00Z"
    }
  ]
}
```

#### POST /api/queue
**요청**: 큐에 사람 추가
```json
{
  "name": "이수진",
  "reason": "지각",
  "direction": "back"  // "front" 또는 "back" (기본값: "back")
}
```
**응답**:
```json
{
  "item": {
    "id": 2,
    "name": "이수진",
    "reason": "지각",
    "position": 1,
    "created_at": "2025-02-10T10:05:00Z"
  }
}
```

#### DELETE /api/queue/[id]
**응답**: 큐에서 항목 삭제 (position 자동 조정)
```json
{
  "success": true
}
```

### 노래 세션

#### POST /api/singing/start
**요청**: Dequeue + 노래 세션 시작
```json
{
  "song_title": "뻐꾸기"
}
```
**응답**:
```json
{
  "session": {
    "id": 1,
    "name": "김민준",
    "reason": "과제 미제출",
    "song_title": "뻐꾸기",
    "started_at": "2025-02-10T10:10:00Z"
  }
}
```

#### GET /api/singing/current
**응답**: 현재 진행 중인 노래 세션 조회 (없으면 null)
```json
{
  "session": {
    "id": 1,
    "name": "김민준",
    "reason": "과제 미제출",
    "song_title": "뻐꾸기",
    "started_at": "2025-02-10T10:10:00Z"
  }
}
```

#### POST /api/singing/complete
**요청**: 노래 완료 및 내역 저장
```json
{
  "session_id": 1
}
```
**응답**:
```json
{
  "history": {
    "id": 1,
    "name": "김민준",
    "reason": "과제 미제출",
    "song_title": "뻐꾸기",
    "completed_at": "2025-02-10T10:15:00Z"
  }
}
```

### 내역 조회

#### GET /api/history
**응답**: 완료한 모든 노래 내역 (최신순)
```json
{
  "items": [
    {
      "id": 2,
      "name": "이수진",
      "reason": "지각",
      "song_title": "사랑이 아니었다면",
      "completed_at": "2025-02-10T10:20:00Z"
    },
    {
      "id": 1,
      "name": "김민준",
      "reason": "과제 미제출",
      "song_title": "뻐꾸기",
      "completed_at": "2025-02-10T10:15:00Z"
    }
  ]
}
```

## 설치 및 실행

### 요구사항
- Node.js 18+
- npm 또는 yarn

### 로컬 개발 환경

1. **저장소 클론 및 의존성 설치**
```bash
npm install
```

2. **개발 서버 실행**
```bash
npm run dev
```

3. **브라우저에서 접속**
```
http://localhost:3000
```

### 프로덕션 빌드

1. **빌드**
```bash
npm run build
```

2. **실행**
```bash
npm start
```

## Docker 실행

### Docker Compose (권장)

```bash
docker-compose up -d
```

이후 다음 주소로 접속:
```
http://서버IP:45000
```

**특징**:
- SQLite 데이터는 Docker 볼륨에 영구 저장
- 컨테이너 재시작해도 데이터 유지
- 서버의 포트 3000이 호스트의 45000으로 매핑

### 단독 Docker 이미지

```bash
docker build -t song-queue .
docker run -d -p 45000:3000 -v song-queue-data:/app/data song-queue
```

## 사용 흐름

### 1. 큐 관리
- 메인 페이지에서 이름과 벌칙 사유 입력
- "앞에 추가" 또는 "뒤에 추가" 선택
- 필요시 항목 삭제 가능

### 2. 노래 시작
- "노래 시작" 버튼 클릭 (큐가 비어있으면 비활성화)
- 모달에서 노래 제목 입력
- 자동으로 노래 모드로 이동

### 3. 노래 모드
- 좌측: 전체화면 노래 정보 표시
- 우측: 실시간 댓글 창
- 댓글 입력 및 전송
- "노래 완료" 버튼으로 완료 처리

### 4. 내역 조회
- `/history` 페이지에서 완료한 모든 노래 확인
- 최신 노래부터 역순 정렬

## 개발 가이드

### 새로운 페이지 추가
Next.js App Router를 사용하므로, `src/app/` 디렉토리에 폴더를 만들고 `page.tsx`를 생성하면 자동으로 라우트가 생성됩니다.

### 새로운 API 엔드포인트 추가
`src/app/api/` 디렉토리에 경로에 맞춰 `route.ts` 파일을 생성하고 `GET`, `POST`, `DELETE` 등을 export합니다.

### 스타일 커스터마이징
Tailwind CSS 4를 사용합니다. `tailwind.config.js`에서 테마를 커스터마이징할 수 있습니다.

### WebSocket 메시지 형식
댓글 전송 시 다음 형식을 사용합니다:
```json
{
  "type": "comment",
  "nickname": "닉네임",
  "content": "댓글 내용",
  "timestamp": 1707500400000
}
```

## 주의사항

### 데이터베이스
- SQLite는 프로젝트 루트의 `data/` 디렉토리에 저장됩니다
- `.gitignore`에 `data/` 디렉토리가 포함되어 있으므로 커밋되지 않습니다
- 로컬에서 테스트할 때 생성된 DB는 환경마다 독립적입니다

### WebSocket
- 댓글은 메모리에만 존재하고 데이터베이스에 저장되지 않습니다
- 서버 재시작 시 모든 댓글이 사라집니다
- HTTPS 환경에서는 WSS(WebSocket Secure)를 자동으로 사용합니다

### 동시성
- SQLite의 WAL 모드를 활성화하여 동시 읽기/쓰기 지원
- 트랜잭션을 사용하여 데이터 일관성 보장

## 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# 포트 변경
PORT=3001 npm run dev
```

### WebSocket 연결 실패
- 브라우저 개발자 도구 (F12) → Network 탭 확인
- `ws://` 연결이 성공하는지 확인
- 방화벽 설정 확인

### Docker에서 데이터 손실
```bash
# 볼륨 확인
docker volume ls | grep song-queue

# 볼륨 내용 확인
docker volume inspect song-queue-data
```

## 라이센스

이 프로젝트는 SSAFY 교육용으로 제작되었습니다.

## 기여

이 프로젝트에 기여하려면 Pull Request를 보내주세요.
