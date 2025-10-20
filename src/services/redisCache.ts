/**
 * Redis Cache Service
 * AI inference caching, session management, and high-performance data storage
 */

import Redis from "ioredis";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  version?: string;
  tags?: string[];
}

export interface AIInferenceCache {
  modelId: string;
  inputHash: string;
  outputData: any;
  confidence: number;
  computeTime: number;
  timestamp: number;
}

export interface SessionData {
  userId: string;
  sessionId: string;
  metadata: Record<string, any>;
  lastActivity: number;
  expiresAt: number;
}

export interface QuantumStateCache {
  circuitId: string;
  stateVector: number[];
  fidelity: number;
  coherenceTime: number;
  timestamp: number;
}

export interface RealTimePricing {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  timestamp: number;
  source: string;
}

export class RedisCache {
  private static instance: RedisCache;
  private redis: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private isConnected: boolean = false;

  private constructor() {
    this.initializeRedis();
  }

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  private initializeRedis(): void {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const redisOptions = {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
    };

    this.redis = new Redis(redisUrl, redisOptions);
    this.subscriber = new Redis(redisUrl, redisOptions);
    this.publisher = new Redis(redisUrl, redisOptions);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on("connect", () => {
      console.log("✅ Redis connected");
      this.isConnected = true;
    });

    this.redis.on("error", (error) => {
      console.error("❌ Redis error:", error);
      this.isConnected = false;
    });

    this.redis.on("close", () => {
      console.log("🔌 Redis connection closed");
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.redis.connect(),
        this.subscriber.connect(),
        this.publisher.connect(),
      ]);
      console.log("✅ All Redis connections established");
    } catch (error) {
      console.error("❌ Failed to connect to Redis:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    await Promise.all([
      this.redis.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect(),
    ]);
    this.isConnected = false;
  }

  /**
   * Generic cache operations
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) return null;

      return JSON.parse(value);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    options: CacheOptions = {},
  ): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);

      if (options.ttl) {
        await this.redis.setex(key, options.ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }

      // Add to tags if specified
      if (options.tags) {
        for (const tag of options.tags) {
          await this.redis.sadd(`tag:${tag}`, key);
        }
      }

      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * AI Inference Caching
   */
  async cacheAIInference(
    modelId: string,
    inputData: any,
    outputData: any,
    confidence: number,
    computeTime: number,
    ttl: number = 3600,
  ): Promise<void> {
    const inputHash = this.hashObject(inputData);
    const cacheKey = `ai:${modelId}:${inputHash}`;

    const inferenceData: AIInferenceCache = {
      modelId,
      inputHash,
      outputData,
      confidence,
      computeTime,
      timestamp: Date.now(),
    };

    await this.set(cacheKey, inferenceData, {
      ttl,
      tags: ["ai_inference", modelId],
    });

    // Track inference statistics
    await this.trackInferenceStats(modelId, computeTime, confidence);
  }

  async getAIInference(
    modelId: string,
    inputData: any,
  ): Promise<AIInferenceCache | null> {
    const inputHash = this.hashObject(inputData);
    const cacheKey = `ai:${modelId}:${inputHash}`;

    const cached = await this.get<AIInferenceCache>(cacheKey);

    if (cached) {
      // Update hit statistics
      await this.redis.incr(`stats:ai:${modelId}:hits`);
      await this.redis.incr(`stats:ai:total_hits`);
    } else {
      // Update miss statistics
      await this.redis.incr(`stats:ai:${modelId}:misses`);
      await this.redis.incr(`stats:ai:total_misses`);
    }

    return cached;
  }

  private async trackInferenceStats(
    modelId: string,
    computeTime: number,
    confidence: number,
  ): Promise<void> {
    const statsKey = `stats:ai:${modelId}`;
    const pipeline = this.redis.pipeline();

    pipeline.incr(`${statsKey}:total_inferences`);
    pipeline.incr(`stats:ai:total_inferences`);
    pipeline.lpush(`${statsKey}:compute_times`, computeTime);
    pipeline.ltrim(`${statsKey}:compute_times`, 0, 999); // Keep last 1000
    pipeline.lpush(`${statsKey}:confidences`, confidence);
    pipeline.ltrim(`${statsKey}:confidences`, 0, 999); // Keep last 1000

    await pipeline.exec();
  }

  /**
   * Session Management
   */
  async createSession(
    userId: string,
    sessionId: string,
    metadata: Record<string, any> = {},
    ttl: number = 86400, // 24 hours
  ): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const userSessionsKey = `user_sessions:${userId}`;

    const sessionData: SessionData = {
      userId,
      sessionId,
      metadata,
      lastActivity: Date.now(),
      expiresAt: Date.now() + ttl * 1000,
    };

    await Promise.all([
      this.set(sessionKey, sessionData, { ttl }),
      this.redis.sadd(userSessionsKey, sessionId),
      this.redis.expire(userSessionsKey, ttl),
    ]);
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = `session:${sessionId}`;
    const session = await this.get<SessionData>(sessionKey);

    if (session && session.expiresAt > Date.now()) {
      // Update last activity
      session.lastActivity = Date.now();
      await this.set(sessionKey, session, {
        ttl: Math.floor((session.expiresAt - Date.now()) / 1000),
      });
      return session;
    }

    return null;
  }

  async updateSession(
    sessionId: string,
    metadata: Record<string, any>,
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    session.metadata = { ...session.metadata, ...metadata };
    session.lastActivity = Date.now();

    const ttl = Math.floor((session.expiresAt - Date.now()) / 1000);
    return await this.set(`session:${sessionId}`, session, { ttl });
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      await Promise.all([
        this.del(`session:${sessionId}`),
        this.redis.srem(`user_sessions:${session.userId}`, sessionId),
      ]);
    }
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    const sessions: SessionData[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Quantum State Caching
   */
  async cacheQuantumState(
    circuitId: string,
    stateVector: number[],
    fidelity: number,
    coherenceTime: number,
    ttl: number = 300, // 5 minutes due to quantum decoherence
  ): Promise<void> {
    const stateKey = `quantum:state:${circuitId}`;

    const quantumState: QuantumStateCache = {
      circuitId,
      stateVector,
      fidelity,
      coherenceTime,
      timestamp: Date.now(),
    };

    await this.set(stateKey, quantumState, {
      ttl,
      tags: ["quantum_state", "quantum"],
    });

    // Track quantum coherence
    await this.redis.zadd(
      "quantum:coherence_tracking",
      Date.now(),
      `${circuitId}:${fidelity}`,
    );
  }

  async getQuantumState(circuitId: string): Promise<QuantumStateCache | null> {
    const stateKey = `quantum:state:${circuitId}`;
    const state = await this.get<QuantumStateCache>(stateKey);

    if (state) {
      // Check if quantum state is still coherent
      const timeDiff = Date.now() - state.timestamp;
      const coherenceDecay = Math.exp(-timeDiff / (state.coherenceTime * 1000));

      if (coherenceDecay < 0.9) {
        // State has decohere too much, remove from cache
        await this.del(stateKey);
        return null;
      }

      // Update fidelity based on decoherence
      state.fidelity *= coherenceDecay;
    }

    return state;
  }

  /**
   * Real-time Price Caching
   */
  async cachePricing(
    symbol: string,
    price: number,
    change: number,
    volume: number,
    source: string,
    ttl: number = 60, // 1 minute
  ): Promise<void> {
    const priceKey = `price:${symbol}`;
    const priceHistoryKey = `price_history:${symbol}`;

    const pricingData: RealTimePricing = {
      symbol,
      price,
      change,
      volume,
      timestamp: Date.now(),
      source,
    };

    await Promise.all([
      this.set(priceKey, pricingData, { ttl, tags: ["pricing", symbol] }),
      this.redis.zadd(priceHistoryKey, Date.now(), JSON.stringify(pricingData)),
      this.redis.zremrangebyrank(priceHistoryKey, 0, -1001), // Keep last 1000 entries
      this.redis.expire(priceHistoryKey, 86400), // 24 hours
    ]);
  }

  async getPricing(symbol: string): Promise<RealTimePricing | null> {
    const priceKey = `price:${symbol}`;
    return await this.get<RealTimePricing>(priceKey);
  }

  async getPriceHistory(
    symbol: string,
    fromTime?: number,
    toTime?: number,
  ): Promise<RealTimePricing[]> {
    const priceHistoryKey = `price_history:${symbol}`;

    const start = fromTime || 0;
    const end = toTime || Date.now();

    const history = await this.redis.zrangebyscore(
      priceHistoryKey,
      start,
      end,
      "WITHSCORES",
    );

    const prices: RealTimePricing[] = [];
    for (let i = 0; i < history.length; i += 2) {
      try {
        const priceData = JSON.parse(history[i]);
        prices.push(priceData);
      } catch (error) {
        console.error("Error parsing price history:", error);
      }
    }

    return prices;
  }

  /**
   * Portfolio & Vault Caching
   */
  async cacheVaultData(
    vaultId: string,
    vaultData: any,
    ttl: number = 300, // 5 minutes
  ): Promise<void> {
    const vaultKey = `vault:${vaultId}`;
    await this.set(vaultKey, vaultData, { ttl, tags: ["vault", vaultId] });
  }

  async getVaultData(vaultId: string): Promise<any> {
    const vaultKey = `vault:${vaultId}`;
    return await this.get(vaultKey);
  }

  async invalidateVaultCache(vaultId: string): Promise<void> {
    const vaultKey = `vault:${vaultId}`;
    await this.del(vaultKey);
  }

  /**
   * Rate Limiting
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const windowKey = `${key}:${window}`;

    const current = await this.redis.incr(windowKey);

    if (current === 1) {
      await this.redis.expire(windowKey, Math.ceil(windowMs / 1000));
    }

    const remaining = Math.max(0, limit - current);
    const resetTime = (window + 1) * windowMs;

    return {
      allowed: current <= limit,
      remaining,
      resetTime,
    };
  }

  /**
   * Pub/Sub for Real-time Updates
   */
  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on("message", (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message);
      }
    });
  }

  async publish(channel: string, message: any): Promise<number> {
    return await this.publisher.publish(channel, JSON.stringify(message));
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  /**
   * Cache Management
   */
  async invalidateByTag(tag: string): Promise<number> {
    const tagKey = `tag:${tag}`;
    const keys = await this.redis.smembers(tagKey);

    if (keys.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    keys.forEach((key) => pipeline.del(key));
    pipeline.del(tagKey);

    const results = await pipeline.exec();
    return results ? results.length - 1 : 0; // Subtract 1 for the tag key itself
  }

  async getMemoryUsage(): Promise<{
    used: string;
    peak: string;
    fragmentation: string;
  }> {
    const info = await this.redis.memory("usage");
    const stats = await this.redis.info("memory");

    const lines = stats.split("\r\n");
    const memoryStats: any = {};

    lines.forEach((line) => {
      const [key, value] = line.split(":");
      if (key && value) {
        memoryStats[key] = value;
      }
    });

    return {
      used: memoryStats.used_memory_human || "Unknown",
      peak: memoryStats.used_memory_peak_human || "Unknown",
      fragmentation: memoryStats.mem_fragmentation_ratio || "Unknown",
    };
  }

  async getStats(): Promise<{
    connections: number;
    operations: number;
    hitRate: number;
    aiInferences: number;
    quantumStates: number;
    activeSessions: number;
  }> {
    const pipeline = this.redis.pipeline();

    pipeline.get("stats:ai:total_hits");
    pipeline.get("stats:ai:total_misses");
    pipeline.get("stats:ai:total_inferences");
    pipeline.zcard("quantum:coherence_tracking");
    pipeline.dbsize();

    const results = await pipeline.exec();

    const hits = parseInt((results?.[0]?.[1] as string) || "0");
    const misses = parseInt((results?.[1]?.[1] as string) || "0");
    const aiInferences = parseInt((results?.[2]?.[1] as string) || "0");
    const quantumStates = parseInt((results?.[3]?.[1] as string) || "0");
    const totalKeys = parseInt((results?.[4]?.[1] as string) || "0");

    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;

    return {
      connections: 3, // redis, subscriber, publisher
      operations: hits + misses,
      hitRate,
      aiInferences,
      quantumStates,
      activeSessions: totalKeys, // Approximation
    };
  }

  /**
   * Utility Methods
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    latency: number;
    memory: any;
    connections: boolean;
  }> {
    const start = Date.now();

    try {
      await this.redis.ping();
      const latency = Date.now() - start;
      const memory = await this.getMemoryUsage();

      return {
        status: "healthy",
        latency,
        memory,
        connections: this.isConnected,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: -1,
        memory: null,
        connections: false,
      };
    }
  }
}

// Export singleton instance
export const redisCache = RedisCache.getInstance();
export default RedisCache;
