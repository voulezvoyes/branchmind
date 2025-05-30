# Step 1: build the Vite app with env var
FROM node:18 AS build

# Vite에서 사용할 환경변수 입력
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

WORKDIR /app
COPY . .

# env 로드 위해 dotenv가 필요한 경우 여기에 설치 가능
RUN npm install && npm run build

# Step 2: serve the built static site
FROM node:18

WORKDIR /app

# 빌드 결과물만 복사
COPY --from=build /app/dist .

# serve 설치
RUN npm install -g serve

# Cloud Run이 요구하는 포트로 실행
CMD ["serve", "-s", ".", "-l", "8080"]
