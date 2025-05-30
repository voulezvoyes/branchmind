# Step 1: build the Vite app
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Step 2: use serve to host the static site on port 8080
FROM node:18
WORKDIR /app
COPY --from=build /app/dist /app
RUN npm install -g serve
CMD ["serve", "-s", ".", "-l", "8080"]
