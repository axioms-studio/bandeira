# ── Stage 1: Build frontend assets ──────────────────────────────────────────
FROM node:22-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY vite.config.mts tsconfig.json tailwind.config.* ./
COPY resources/ resources/
COPY public/ public/
RUN npm run build

# ── Stage 2: Build Go binary ───────────────────────────────────────────────
FROM golang:1.26-alpine AS backend

RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/public/build public/build

RUN CGO_ENABLED=1 go build -o /bandeira ./cmd/web

# ── Stage 3: Final minimal image ──────────────────────────────────────────
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata curl

RUN adduser -D -u 1000 bandeira
WORKDIR /app

COPY --from=backend /bandeira /app/bandeira
COPY --from=frontend /app/public/build /app/public/build
COPY config/config.yaml /app/config/config.yaml
COPY resources/views/ /app/resources/views/

RUN mkdir -p /app/dbs && chown -R bandeira:bandeira /app

USER bandeira

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

CMD ["/app/bandeira"]
