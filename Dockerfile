FROM node:20-alpine AS base

# better-sqlite3 네이티브 모듈 빌드에 필요
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 의존성 설치
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 빌드
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 프로덕션
FROM node:20-alpine AS runner
RUN apk add --no-cache python3 make g++
WORKDIR /app

ENV NODE_ENV=production

# 필요한 파일만 복사
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# 프로덕션 의존성만 설치 (tsx는 devDependency이므로 별도 설치)
RUN npm ci --omit=dev && npm install tsx

# data 디렉토리 생성 (SQLite DB 저장)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
