# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 120000

COPY . .

# Build with empty backend URL so axios uses relative paths (nginx proxies /api)
ENV REACT_APP_BACKEND_URL=""
RUN yarn build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
