# Stage 1: Build React frontend
FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN ./node_modules/.bin/vite build

# Stage 2: Production server
FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY backend/ ./backend/
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 4000
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
