# ── Backend ──────────────────────────
FROM node:20-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# ── Frontend Build ───────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ── Production Image ─────────────────
FROM node:20-alpine
RUN apk add --no-cache nginx

WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy nginx config
COPY nginx/default.conf /etc/nginx/http.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
