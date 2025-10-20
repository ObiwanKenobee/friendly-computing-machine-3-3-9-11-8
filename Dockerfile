# QuantumVest Production Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm for faster dependency management
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S quantumvest -u 1001

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --production --frozen-lockfile && \
    pnpm store prune

# Copy built application from builder stage
COPY --from=builder --chown=quantumvest:nodejs /app/dist ./dist
COPY --from=builder --chown=quantumvest:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=quantumvest:nodejs /app/prisma ./prisma

# Copy additional configuration files
COPY --chown=quantumvest:nodejs docker-entrypoint.sh ./
COPY --chown=quantumvest:nodejs health-check.js ./

# Make scripts executable
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER quantumvest

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node health-check.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["./docker-entrypoint.sh"]
