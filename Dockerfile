# Step 1: build the Vite app
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Step 2: serve the static site
FROM node:18
WORKDIR /app
COPY --from=build /app/dist /app
RUN npm install -g serve
EXPOSE 8080
CMD ["serve", "-s", ".", "-l", "8080"]
