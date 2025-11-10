FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy PDF directories (read-only)
COPY --chown=nextjs:nodejs "Blockchain NFT Web3" "./Blockchain NFT Web3"
COPY --chown=nextjs:nodejs "Cloud Gaming" "./Cloud Gaming"
COPY --chown=nextjs:nodejs Esports ./Esports
COPY --chown=nextjs:nodejs "General Industry" "./General Industry"
COPY --chown=nextjs:nodejs HR ./HR
COPY --chown=nextjs:nodejs Investments ./Investments
COPY --chown=nextjs:nodejs "Marketing & Streaming" "./Marketing & Streaming"
COPY --chown=nextjs:nodejs Mobile ./Mobile
COPY --chown=nextjs:nodejs "Regional Reports" "./Regional Reports"
COPY --chown=nextjs:nodejs "XR Metaverse" "./XR Metaverse"

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
