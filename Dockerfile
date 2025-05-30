# Step 1: build Vite
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Step 2: serve the app
FROM node:18
WORKDIR /app
COPY --from=build /app/dist /app
RUN npm install -g serve
CMD ["serve", "-s", ".", "-l", "8080"]
