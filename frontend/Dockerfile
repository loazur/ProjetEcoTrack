FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY server.js ./server.js
COPY src ./src
COPY public/index.html ./public/index.html
RUN npm run build

FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
