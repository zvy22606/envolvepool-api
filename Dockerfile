FROM node:20-alpine3.19 AS builder

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:20-bullseye-slim

USER node

WORKDIR /app

COPY --chown=node:node package*.json .

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/script ./script
COPY --from=builder /app/template ./template

RUN npm pkg delete scripts.prepare
RUN npm ci --omit=dev

RUN npx prisma generate

EXPOSE 3000
CMD [ "sh", "-c", "npx prisma migrate deploy && node dist/index.js" ]
