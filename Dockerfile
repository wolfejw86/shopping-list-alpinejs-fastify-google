FROM node:12-alpine as local-dev
EXPOSE 3001
RUN mkdir -p /app
WORKDIR /app
COPY *.json ./
RUN npm install
COPY . /app
RUN npm run build
CMD ["npm", "run", "start:watch"]


FROM node:12-alpine as dev-builder
RUN mkdir -p /app
WORKDIR /app
COPY *.json ./
RUN npm install
COPY . /app
RUN npm run build
CMD ["npm", "run", "start"]

# Start multi-stage build
FROM node:12-slim as production
EXPOSE 8080
RUN mkdir -p /app
WORKDIR /app
COPY *.json ./
RUN npm install --production
COPY --from=dev-builder /app/dist/ /app/dist/
COPY --from=dev-builder /app/migrations/ /app/migrations/
CMD ["node", "dist/server.js"]