FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install deps - fallback to npm install if no lock file
RUN if [ -f package-lock.json ]; then       npm ci --no-audit --no-fund;     else       echo "No package-lock.json found, running npm install...";       npm install --no-audit --no-fund;     fi

COPY . .

# Prisma generate (ignore if fails)
RUN npx prisma generate 2>/dev/null || echo "Prisma generate skipped"

# Build Next.js
RUN npm run build

EXPOSE 3000

# Entrypoint for migrate
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
