# Étape de build
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o meryouzik-backend .

# Étape d'exécution
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/meryouzik-backend .
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/static ./static

EXPOSE 8080