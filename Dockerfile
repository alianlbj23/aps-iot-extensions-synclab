# Use Debian 12 (bookworm) as base image
FROM python:3.12-slim

# 先用 root 做所有安裝與設定
USER root

# 安裝需要的工具（可自行補 apt-get install）
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential git \
 && rm -rf /var/lib/apt/lists/*

# 安裝 Node.js (22版本)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && node -v && npm -v

# 建立 synlab 使用者
RUN useradd -m synlab
# 建立 /app 並改成 synlab 擁有
RUN mkdir -p /app && chown -R synlab:synlab /app
# 設定工作目錄
WORKDIR /app

# 安裝 Node 依賴
COPY package*.json ./
RUN npm ci

# 複製專案檔案並改成 synlab 擁有
COPY . .
RUN chown -R synlab:synlab /app 

EXPOSE 3000
# 依你的 package.json scripts，start 跑 server.js
CMD ["npm", "run", "start"]