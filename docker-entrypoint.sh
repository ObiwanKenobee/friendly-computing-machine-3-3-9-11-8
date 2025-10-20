#!/bin/sh
# QuantumVest Docker Entrypoint Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting QuantumVest Enterprise...${NC}"

# Wait for database to be ready
if [ -n "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⏳ Waiting for database connection...${NC}"
    
    # Extract database host and port from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    # Default port if not specified
    if [ -z "$DB_PORT" ]; then
        DB_PORT=5432
    fi
    
    # Wait for database
    timeout=60
    count=0
    while ! nc -z $DB_HOST $DB_PORT; do
        sleep 1
        count=$((count + 1))
        if [ $count -ge $timeout ]; then
            echo -e "${RED}❌ Database connection timeout${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Database connection established${NC}"
fi

# Run database migrations in production
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"
    pnpm prisma migrate deploy
    echo -e "${GREEN}✅ Database migrations completed${NC}"
fi

# Wait for Redis to be ready
if [ -n "$REDIS_URL" ]; then
    echo -e "${YELLOW}⏳ Waiting for Redis connection...${NC}"
    
    # Extract Redis host and port
    REDIS_HOST=$(echo $REDIS_URL | sed -n 's/redis:\/\/\([^:]*\):.*/\1/p')
    REDIS_PORT=$(echo $REDIS_URL | sed -n 's/.*:\([0-9]*\)$/\1/p')
    
    if [ -z "$REDIS_PORT" ]; then
        REDIS_PORT=6379
    fi
    
    # Wait for Redis
    timeout=30
    count=0
    while ! nc -z $REDIS_HOST $REDIS_PORT; do
        sleep 1
        count=$((count + 1))
        if [ $count -ge $timeout ]; then
            echo -e "${YELLOW}⚠️ Redis connection timeout (continuing without cache)${NC}"
            break
        fi
    done
    
    if [ $count -lt $timeout ]; then
        echo -e "${GREEN}✅ Redis connection established${NC}"
    fi
fi

# Wait for MongoDB to be ready
if [ -n "$MONGODB_URL" ]; then
    echo -e "${YELLOW}⏳ Waiting for MongoDB connection...${NC}"
    
    # Extract MongoDB host and port
    MONGO_HOST=$(echo $MONGODB_URL | sed -n 's/mongodb:\/\/\([^:]*\):.*/\1/p')
    MONGO_PORT=$(echo $MONGODB_URL | sed -n 's/.*:\([0-9]*\)$/\1/p')
    
    if [ -z "$MONGO_PORT" ]; then
        MONGO_PORT=27017
    fi
    
    # Wait for MongoDB
    timeout=30
    count=0
    while ! nc -z $MONGO_HOST $MONGO_PORT; do
        sleep 1
        count=$((count + 1))
        if [ $count -ge $timeout ]; then
            echo -e "${YELLOW}⚠️ MongoDB connection timeout (continuing without events)${NC}"
            break
        fi
    done
    
    if [ $count -lt $timeout ]; then
        echo -e "${GREEN}✅ MongoDB connection established${NC}"
    fi
fi

# Initialize application services
echo -e "${YELLOW}🔧 Initializing application services...${NC}"

# Create necessary directories
mkdir -p /app/logs
mkdir -p /app/temp

# Set proper permissions
chmod 755 /app/logs
chmod 755 /app/temp

# Export environment variables for the application
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-5173}
export HOST=${HOST:-0.0.0.0}

# Handle graceful shutdown
shutdown() {
    echo -e "${YELLOW}🛑 Received shutdown signal, gracefully stopping...${NC}"
    kill -TERM "$child" 2>/dev/null
    wait "$child"
    echo -e "${GREEN}✅ QuantumVest stopped gracefully${NC}"
    exit 0
}

trap shutdown SIGTERM SIGINT

# Start the application
echo -e "${GREEN}🌟 Starting QuantumVest on http://$HOST:$PORT${NC}"

if [ "$NODE_ENV" = "production" ]; then
    # Production: serve built files
    pnpm run preview --host $HOST --port $PORT &
else
    # Development: start dev server
    pnpm run dev --host $HOST --port $PORT &
fi

child=$!
wait "$child"
