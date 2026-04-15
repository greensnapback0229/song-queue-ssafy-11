FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 의존성 설치
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

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
ENV PROBLEMS_DIR=/data/problems
ENV DB_PATH=/app/data/baekjoon.db

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# public 디렉토리가 있으면 복사
RUN mkdir -p ./public
COPY --from=builder /app/public/ ./public/

RUN mkdir -p /app/data /data/problems

EXPOSE 3000

CMD ["node", "server.js"]
