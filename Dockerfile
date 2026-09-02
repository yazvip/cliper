FROM node:20-alpine AS base
WORKDIR /app

# Install deps for Prisma + build
RUN apk add --no-cache openssl libc6-compat python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Install
RUN if [ -f package-lock.json ]; then       npm ci --no-audit --no-fund || npm install --no-audit --no-fund;     else       npm install --no-audit --no-fund;     fi

# Copy prisma first for better caching
COPY prisma ./prisma

# Generate Prisma Client (with dummy DATABASE_URL for build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate

# Copy rest
COPY . .

# Build - with dummy env to avoid collecting page data errors
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV REDIS_URL="redis://localhost:6379"
ENV JWT_SECRET="build-time-dummy-secret-min-32-chars-for-build-only"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3000

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
