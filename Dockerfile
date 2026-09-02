FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
RUN apk add --no-cache libstdc++ && addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
RUN mkdir -p /app/data && chown -R app:app /app
USER app
ENV NODE_ENV=production SERVER_PORT=3333 DATABASE_PATH=/app/data/fiscalguard.db
EXPOSE 3333
VOLUME ["/app/data"]
CMD ["npm", "start"]
