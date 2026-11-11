# 1. Base Image: Lightweight Alpine Linux with Node.js 24 pre-installed
FROM node:24-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy ONLY package.json and package-lock.json first (for layer caching!)
COPY package*.json ./

# 4. Clean install of dependencies inside Linux container
RUN npm ci

# 5. Now copy the rest of our NestJS source code (src/, tsconfig.json, etc.)
COPY . .

# 6. Compile TypeScript (.ts) into JavaScript (.js) inside /app/dist
RUN npm run build

# 7. Document that this container listens on port 3000
EXPOSE 3000

# 8. Command that runs when the container starts
CMD ["node", "dist/main.js"]