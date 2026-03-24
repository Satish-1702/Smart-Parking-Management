FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN npm --prefix ./server ci --omit=dev

COPY server ./server
COPY frontend ./frontend

WORKDIR /app/server

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

CMD ["npm", "run", "start"]
