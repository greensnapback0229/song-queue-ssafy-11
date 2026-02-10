# MASTER PLAN: SSAFY 서울 11반 노래 큐

## 문제 요약

SSAFY 서울 11반에서 벌칙으로 노래를 부르는 상황을 관리하는 웹 서비스.
벌칙 당첨자를 큐에 등록하고, 순서대로 꺼내서 노래를 부르게 하며,
부르는 동안 실시간 댓글을 남길 수 있고, 완료 후 내역이 저장된다.

## 가정 및 불명확한 요구사항

- 인증: 별도 회원가입 없이 정적 비밀번호(환경변수)로 관리자 권한 부여
- 동시접속: 한 반(~30명) 규모, SQLite WAL 모드로 충분
- 노래 세션: 동시에 1개만 활성화 가능
- 댓글: 영구 저장 불필요, 세션 중 메모리에만 보관

## Feature 분해

| # | Feature | 설명 |
|---|---------|------|
| F1 | 프로젝트 초기 설정 | Next.js + SQLite + TypeScript + Tailwind 프로젝트 구성 |
| F2 | 큐 관리 (Queue CRUD) | 큐 등록(앞/뒤), 조회, 삭제 |
| F3 | Dequeue & 노래 시작 | 큐에서 꺼내기 + 노래 제목 입력 + 세션 생성 |
| F4 | 노래 부르기 모드 | 전체화면 노래 모드 + WebSocket 실시간 댓글 |
| F5 | 노래 완료 & 내역 저장 | 세션 종료 → song_history 저장 + 댓글 초기화 |
| F6 | 노래 내역 조회 | 완료된 노래 목록 조회 + 삭제 |
| F7 | 관리자 인증 | 비밀번호 기반 관리자 권한 (등록/시작/완료/삭제) |
| F8 | Docker 배포 | Dockerfile + docker-compose + nginx WebSocket 프록시 |

## 작업 순서

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8

- F7(인증)은 F2~F6 완료 후 전체에 적용
- F8(배포)은 모든 기능 완료 후 진행

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes + Custom Server (server.ts)
- **Database**: SQLite (better-sqlite3, WAL mode)
- **WebSocket**: ws 라이브러리, /ws 경로, noServer 모드
- **배포**: Docker + nginx reverse proxy (포트 45000)

## 범위 제외 항목

- 회원가입/로그인 시스템
- 댓글 영구 저장
- 순서 드래그앤드롭 변경
- 모바일 전용 UI
- 다중 세션 동시 진행
