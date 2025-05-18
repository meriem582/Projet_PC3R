# Builder stage
FROM golang:1.24-alpine3.18 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod tidy && go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o meryouzik-backend .

# Runtime stage (inchangé)
FROM alpine:3.18
WORKDIR /app
COPY --from=builder /app/meryouzik-backend .
EXPOSE 8080
CMD ["./meryouzik-backend"]