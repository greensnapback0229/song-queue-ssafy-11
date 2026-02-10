# SPEC: F8 - Docker 배포

## Purpose

Docker 컨테이너로 패키징하여 Ubuntu 서버에 배포하고,
nginx reverse proxy를 통해 WebSocket을 포함한 전체 서비스를 제공한다.

## Flow Summary

1. Dockerfile로 멀티스테이지 빌드
2. docker-compose.yml로 서비스 정의 (포트, 볼륨, 환경변수)
3. nginx에서 reverse proxy + WebSocket 프록시 설정
4. `docker compose up -d`로 배포

## 범위 정의

### In Scope
- Dockerfile (멀티스테이지 빌드, Node 20 Alpine)
- docker-compose.yml (포트 45000:3000, 볼륨, 환경변수)
- .dockerignore
- nginx WebSocket 프록시 설정 가이드

### Out of Scope
- CI/CD 파이프라인
- SSL 인증서 설정
- 모니터링/로깅

## Dockerfile 구조

```
Stage 1: base        - Node 20 Alpine + 빌드 도구 (python3, make, g++)
Stage 2: deps        - npm ci (production + dev dependencies)
Stage 3: builder     - next build
Stage 4: runner      - Production 이미지 (production deps + tsx + 빌드 결과)
```

**주요 결정 사항**:
- `better-sqlite3`는 네이티브 모듈 → 빌드 도구 필요
- `tsx`는 server.ts 실행에 필요 → production에도 포함
- `/app/data` 디렉토리로 SQLite DB 영속화

## docker-compose.yml

```yaml
services:
  song-queue:
    build: .
    container_name: song-queue
    ports:
      - "45000:3000"
    volumes:
      - song-queue-data:/app/data
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ADMIN_PASSWORD=ssafy11
```

## nginx 설정

```nginx
# WebSocket 전용 경로
location /ws {
    proxy_pass http://localhost:45000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
    proxy_buffering off;
}

# 일반 HTTP 요청
location / {
    proxy_pass http://localhost:45000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**핵심**: `/ws`와 `/`를 분리하여 WebSocket 헤더가 일반 요청에 영향 주지 않도록 함.

## Edge Cases

- 컨테이너 재시작 → 볼륨으로 DB 보존 (댓글은 메모리이므로 유실)
- nginx 타임아웃 → server.ts에서 30초 ping으로 방지
- 포트 충돌 → 45000번 포트 사용

## Test Strategy

- T1: `docker compose build` 성공
- T2: `docker compose up -d` → 컨테이너 정상 실행
- T3: `curl localhost:45000` → 200 응답
- T4: WebSocket /ws 연결 성공
- T5: 컨테이너 재시작 후 DB 데이터 보존 확인
