FROM node:20-slim AS build
WORKDIR /app
COPY medibook-frontend/package*.json ./
RUN npm install
COPY medibook-frontend/ .
RUN npm run build

FROM nginx:1.25
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80