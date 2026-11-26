FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./

USER node
EXPOSE 5000
CMD ["npm", "start"]
