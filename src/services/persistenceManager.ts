/**
 * Persistence Manager
 * Unified orchestration of all data storage systems:
 * PostgreSQL (Prisma), Redis, IPFS, MongoDB
 */

import { PrismaClient } from "@prisma/client";
import { redisCache } from "./redisCache";
import { ipfsService } from "./ipfsService";
import { mongoEventStore } from "./mongoEventStore";
import { databaseArchitecture } from "./databaseArchitecture";

export interface PersistenceConfig {
  postgresql: {
    enabled: boolean;
    url: string;
    maxConnections: number;
  };
  redis: {
    enabled: boolean;
    url: string;
    defaultTTL: number;
  };
  ipfs: {
    enabled: boolean;
    gateway: string;
    pinningEnabled: boolean;
  };
  mongodb: {
    enabled: boolean;
    url: string;
    dbName: string;
  };
}

export interface HealthStatus {
  overall: "healthy" | "degraded" | "unhealthy";
  services: {
    postgresql: { status: string; latency: number; connections: number };
    redis: { status: string; latency: number; memory: string };
    ipfs: { status: string; connected: boolean; peers: number };
    mongodb: { status: string; connected: boolean; collections: number };
  };
  lastChecked: Date;
}

export interface DataOperation {
  id: string;
  type: "create" | "read" | "update" | "delete" | "backup";
  entity: string;
  storage: "postgresql" | "redis" | "ipfs" | "mongodb";
  userId?: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
}

export interface BackupStrategy {
  postgresql: {
    frequency: "hourly" | "daily" | "weekly";
    retention: number;
    compression: boolean;
  };
  mongodb: {
    frequency: "daily" | "weekly";
    retention: number;
    incremental: boolean;
  };
  redis: {
    frequency: "hourly" | "daily";
    retention: number;
    snapshotEnabled: boolean;
  };
  ipfs: {
    pinning: boolean;
    replication: number;
    filecoinDeals: boolean;
  };
}

export class PersistenceManager {
  private static instance: PersistenceManager;
  private prisma: PrismaClient;
  private config: PersistenceConfig;
  private operations: Map<string, DataOperation> = new Map();
  private healthStatus: HealthStatus | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeConfig();
    this.initializePrisma();
  }

  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager();
    }
    return PersistenceManager.instance;
  }

  private initializeConfig(): void {
    this.config = {
      postgresql: {
        enabled: true,
        url:
          process.env.DATABASE_URL || "postgresql://localhost:5432/quantumvest",
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
      },
      redis: {
        enabled: true,
        url: process.env.REDIS_URL || "redis://localhost:6379",
        defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || "3600"),
      },
      ipfs: {
        enabled: true,
        gateway:
          process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/",
        pinningEnabled: process.env.IPFS_PINNING_ENABLED === "true",
      },
      mongodb: {
        enabled: true,
        url: process.env.MONGODB_URL || "mongodb://localhost:27017",
        dbName: process.env.MONGODB_DB_NAME || "quantumvest_events",
      },
    };
  }

  private initializePrisma(): void {
    this.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
      errorFormat: "pretty",
    });

    // Setup Prisma middleware for logging and caching
    this.prisma.$use(async (params, next) => {
      const start = Date.now();
      const operationId = this.generateOperationId();

      try {
        const result = await next(params);
        const duration = Date.now() - start;

        this.recordOperation({
          id: operationId,
          type: this.mapPrismaAction(params.action),
          entity: params.model || "unknown",
          storage: "postgresql",
          timestamp: new Date(),
          duration,
          success: true,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        this.recordOperation({
          id: operationId,
          type: this.mapPrismaAction(params.action),
          entity: params.model || "unknown",
          storage: "postgresql",
          timestamp: new Date(),
          duration,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        throw error;
      }
    });
  }

  /**
   * Initialize all persistence services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("🧬 Initializing Persistence Manager...");

      // Initialize all services in parallel
      const initPromises: Promise<void>[] = [];

      if (this.config.postgresql.enabled) {
        initPromises.push(this.initializePostgreSQL());
      }

      if (this.config.redis.enabled) {
        initPromises.push(this.initializeRedis());
      }

      if (this.config.ipfs.enabled) {
        initPromises.push(this.initializeIPFS());
      }

      if (this.config.mongodb.enabled) {
        initPromises.push(this.initializeMongoDB());
      }

      await Promise.all(initPromises);

      // Start health monitoring
      setInterval(() => this.updateHealthStatus(), 30000); // Every 30 seconds

      this.isInitialized = true;
      console.log("✅ Persistence Manager initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Persistence Manager:", error);
      throw error;
    }
  }

  private async initializePostgreSQL(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log("✅ PostgreSQL (Prisma) connected");
    } catch (error) {
      console.error("❌ PostgreSQL connection failed:", error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      await redisCache.connect();
      console.log("✅ Redis cache connected");
    } catch (error) {
      console.error("❌ Redis connection failed:", error);
      throw error;
    }
  }

  private async initializeIPFS(): Promise<void> {
    try {
      const health = await ipfsService.healthCheck();
      if (health.status === "healthy") {
        console.log("✅ IPFS service connected");
      } else {
        console.warn("⚠️ IPFS service degraded");
      }
    } catch (error) {
      console.error("❌ IPFS connection failed:", error);
      // Don't throw error - IPFS can be optional
    }
  }

  private async initializeMongoDB(): Promise<void> {
    try {
      const health = await mongoEventStore.healthCheck();
      if (health.status === "healthy") {
        console.log("✅ MongoDB Event Store connected");
      } else {
        console.warn("⚠️ MongoDB Event Store degraded");
      }
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      // Don't throw error - MongoDB can be optional for events
    }
  }

  /**
   * USER OPERATIONS - High-level user management
   */
  async createUser(userData: {
    email: string;
    username?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    [key: string]: any;
  }): Promise<any> {
    const operationId = this.generateOperationId();

    try {
      // Hash password (implement proper hashing)
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user in PostgreSQL
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          // Map additional fields as needed
        },
      });

      // Cache user data in Redis
      await redisCache.set(`user:${user.id}`, user, { ttl: 3600 });

      // Record event in MongoDB
      await mongoEventStore.recordEvent({
        userId: user.id,
        sessionId: operationId,
        eventType: "user_action",
        eventName: "user_created",
        category: "authentication",
        action: "create_account",
        data: { email: user.email },
        metadata: {},
      });

      return user;
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  }

  async getUser(
    userId: string,
    options: { useCache?: boolean } = {},
  ): Promise<any> {
    try {
      // Try cache first if enabled
      if (options.useCache !== false) {
        const cached = await redisCache.get(`user:${userId}`);
        if (cached) return cached;
      }

      // Get from PostgreSQL
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          vaults: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (user && options.useCache !== false) {
        // Cache for future requests
        await redisCache.set(`user:${userId}`, user, { ttl: 1800 });
      }

      return user;
    } catch (error) {
      console.error("Failed to get user:", error);
      throw error;
    }
  }

  /**
   * VAULT OPERATIONS - Investment vault management
   */
  async createVault(vaultData: {
    userId: string;
    name: string;
    description?: string;
    vaultType: string;
    strategy: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      const vault = await this.prisma.vault.create({
        data: {
          userId: vaultData.userId,
          name: vaultData.name,
          description: vaultData.description,
          vaultType: vaultData.vaultType as any,
          strategy: vaultData.strategy as any,
          minimumInvestment: vaultData.minimumInvestment || 0,
        },
      });

      // Invalidate user cache
      await redisCache.del(`user:${vaultData.userId}`);

      // Cache vault data
      await redisCache.cacheVaultData(vault.id, vault);

      // Record event
      await mongoEventStore.recordEvent({
        userId: vaultData.userId,
        sessionId: this.generateOperationId(),
        eventType: "vault_action",
        eventName: "vault_created",
        category: "investment",
        action: "create_vault",
        vaultId: vault.id,
        data: { vaultType: vault.vaultType, strategy: vault.strategy },
        metadata: {},
      });

      return vault;
    } catch (error) {
      console.error("Failed to create vault:", error);
      throw error;
    }
  }

  async getVault(
    vaultId: string,
    options: { includeAI?: boolean } = {},
  ): Promise<any> {
    try {
      // Try cache first
      const cached = await redisCache.getVaultData(vaultId);
      if (cached) return cached;

      // Get from PostgreSQL
      const vault = await this.prisma.vault.findUnique({
        where: { id: vaultId },
        include: {
          holdings: true,
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          agent: options.includeAI,
        },
      });

      if (vault) {
        // Cache vault data
        await redisCache.cacheVaultData(vaultId, vault, 300);
      }

      return vault;
    } catch (error) {
      console.error("Failed to get vault:", error);
      throw error;
    }
  }

  /**
   * TRANSACTION OPERATIONS
   */
  async createTransaction(transactionData: {
    userId: string;
    vaultId?: string;
    type: string;
    amount: number;
    [key: string]: any;
  }): Promise<any> {
    try {
      const transaction = await this.prisma.transaction.create({
        data: {
          userId: transactionData.userId,
          vaultId: transactionData.vaultId,
          type: transactionData.type as any,
          totalAmount: transactionData.amount,
          currency: transactionData.currency || "USD",
          status: "PENDING",
        },
      });

      // Invalidate related caches
      await Promise.all([
        redisCache.del(`user:${transactionData.userId}`),
        transactionData.vaultId &&
          redisCache.invalidateVaultCache(transactionData.vaultId),
      ]);

      // Record event
      await mongoEventStore.recordEvent({
        userId: transactionData.userId,
        sessionId: this.generateOperationId(),
        eventType: "transaction",
        eventName: "transaction_created",
        category: "financial",
        action: "create_transaction",
        vaultId: transactionData.vaultId,
        transactionId: transaction.id,
        value: transactionData.amount,
        data: { type: transaction.type, amount: transactionData.amount },
        metadata: {},
      });

      return transaction;
    } catch (error) {
      console.error("Failed to create transaction:", error);
      throw error;
    }
  }

  /**
   * DOCUMENT STORAGE - IPFS integration
   */
  async storeDocument(
    file: { name: string; content: Buffer; mimeType?: string },
    metadata: {
      userId?: string;
      vaultId?: string;
      type: "report" | "document" | "image" | "backup";
      encrypt?: boolean;
    },
  ): Promise<{ hash: string; url: string; size: number }> {
    try {
      const result = await ipfsService.uploadFile(
        {
          name: file.name,
          content: file.content,
          mimeType: file.mimeType,
        },
        {
          pin: true,
          encrypt: metadata.encrypt,
          metadata: {
            userId: metadata.userId,
            vaultId: metadata.vaultId,
            type: metadata.type,
          },
        },
      );

      // Record storage event
      if (metadata.userId) {
        await mongoEventStore.recordEvent({
          userId: metadata.userId,
          sessionId: this.generateOperationId(),
          eventType: "user_action",
          eventName: "document_stored",
          category: "storage",
          action: "store_document",
          vaultId: metadata.vaultId,
          data: {
            fileName: file.name,
            fileSize: result.size,
            ipfsHash: result.hash,
            documentType: metadata.type,
          },
          metadata: {},
        });
      }

      return result;
    } catch (error) {
      console.error("Failed to store document:", error);
      throw error;
    }
  }

  async retrieveDocument(
    hash: string,
    options: { decrypt?: boolean } = {},
  ): Promise<Buffer> {
    try {
      return await ipfsService.getFile(hash, {
        decrypt: options.decrypt,
        timeout: 30000,
      });
    } catch (error) {
      console.error("Failed to retrieve document:", error);
      throw error;
    }
  }

  /**
   * ANALYTICS & EVENTS
   */
  async recordUserEvent(eventData: {
    userId: string;
    sessionId: string;
    eventName: string;
    category: string;
    action: string;
    data?: Record<string, any>;
    metadata?: Record<string, any>;
    [key: string]: any;
  }): Promise<void> {
    try {
      await mongoEventStore.recordEvent({
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        eventType: "user_action",
        eventName: eventData.eventName,
        category: eventData.category,
        action: eventData.action,
        data: eventData.data || {},
        metadata: eventData.metadata || {},
        // Map additional fields as needed
      });
    } catch (error) {
      console.error("Failed to record user event:", error);
      // Don't throw error for analytics - it shouldn't break app flow
    }
  }

  async getUserAnalytics(
    userId: string,
    period: "daily" | "weekly" | "monthly",
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    try {
      return await mongoEventStore.getAnalyticsData(
        userId,
        period,
        startDate,
        endDate,
      );
    } catch (error) {
      console.error("Failed to get user analytics:", error);
      return [];
    }
  }

  /**
   * AI INFERENCE CACHING
   */
  async cacheAIResult(
    modelId: string,
    inputData: any,
    result: any,
    confidence: number,
    computeTime: number,
  ): Promise<void> {
    try {
      await redisCache.cacheAIInference(
        modelId,
        inputData,
        result,
        confidence,
        computeTime,
        3600, // 1 hour TTL
      );
    } catch (error) {
      console.error("Failed to cache AI result:", error);
    }
  }

  async getAIResult(modelId: string, inputData: any): Promise<any> {
    try {
      const cached = await redisCache.getAIInference(modelId, inputData);
      return cached?.outputData || null;
    } catch (error) {
      console.error("Failed to get AI result:", error);
      return null;
    }
  }

  /**
   * HEALTH MONITORING
   */
  private async updateHealthStatus(): Promise<void> {
    try {
      const [postgresqlHealth, redisHealth, ipfsHealth, mongodbHealth] =
        await Promise.all([
          this.checkPostgreSQLHealth(),
          this.checkRedisHealth(),
          this.checkIPFSHealth(),
          this.checkMongoDBHealth(),
        ]);

      this.healthStatus = {
        overall: this.calculateOverallHealth([
          postgresqlHealth.status,
          redisHealth.status,
          ipfsHealth.status,
          mongodbHealth.status,
        ]),
        services: {
          postgresql: postgresqlHealth,
          redis: redisHealth,
          ipfs: ipfsHealth,
          mongodb: mongodbHealth,
        },
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error("Failed to update health status:", error);
    }
  }

  private async checkPostgreSQLHealth(): Promise<any> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return {
        status: "healthy",
        latency,
        connections: 0, // Would need to query for actual connection count
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - start,
        connections: 0,
      };
    }
  }

  private async checkRedisHealth(): Promise<any> {
    try {
      const health = await redisCache.healthCheck();
      return {
        status: health.status,
        latency: health.latency,
        memory: health.memory?.used || "unknown",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: -1,
        memory: "unknown",
      };
    }
  }

  private async checkIPFSHealth(): Promise<any> {
    try {
      const health = await ipfsService.healthCheck();
      return {
        status: health.status,
        connected: health.connected,
        peers: health.peersConnected || 0,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        connected: false,
        peers: 0,
      };
    }
  }

  private async checkMongoDBHealth(): Promise<any> {
    try {
      const health = await mongoEventStore.healthCheck();
      return {
        status: health.status,
        connected: health.connected,
        collections: Object.keys(health.collections || {}).length,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        connected: false,
        collections: 0,
      };
    }
  }

  private calculateOverallHealth(
    statuses: string[],
  ): "healthy" | "degraded" | "unhealthy" {
    const healthyCount = statuses.filter((s) => s === "healthy").length;
    const total = statuses.length;

    if (healthyCount === total) return "healthy";
    if (healthyCount >= total / 2) return "degraded";
    return "unhealthy";
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus | null {
    return this.healthStatus;
  }

  /**
   * UTILITY METHODS
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordOperation(operation: DataOperation): void {
    this.operations.set(operation.id, operation);

    // Keep only last 1000 operations
    if (this.operations.size > 1000) {
      const firstKey = this.operations.keys().next().value;
      this.operations.delete(firstKey);
    }
  }

  private mapPrismaAction(action: string): DataOperation["type"] {
    switch (action) {
      case "create":
      case "createMany":
        return "create";
      case "findUnique":
      case "findFirst":
      case "findMany":
        return "read";
      case "update":
      case "updateMany":
      case "upsert":
        return "update";
      case "delete":
      case "deleteMany":
        return "delete";
      default:
        return "read";
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // Implement proper password hashing (bcrypt, argon2, etc.)
    // This is a placeholder
    return `hashed_${password}`;
  }

  /**
   * Get Prisma client for direct access
   */
  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Get operation statistics
   */
  getOperationStats(): {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
    byStorage: Record<string, number>;
  } {
    const operations = Array.from(this.operations.values());
    const total = operations.length;
    const successful = operations.filter((op) => op.success).length;
    const failed = total - successful;
    const averageDuration =
      total > 0
        ? operations.reduce((sum, op) => sum + op.duration, 0) / total
        : 0;

    const byStorage: Record<string, number> = {};
    operations.forEach((op) => {
      byStorage[op.storage] = (byStorage[op.storage] || 0) + 1;
    });

    return {
      total,
      successful,
      failed,
      averageDuration,
      byStorage,
    };
  }

  /**
   * Cleanup and close connections
   */
  async cleanup(): Promise<void> {
    try {
      await Promise.all([
        this.prisma.$disconnect(),
        redisCache.disconnect(),
        mongoEventStore.close(),
      ]);

      console.log("🧹 Persistence Manager cleanup completed");
    } catch (error) {
      console.error("❌ Failed to cleanup Persistence Manager:", error);
    }
  }
}

// Export singleton instance
export const persistenceManager = PersistenceManager.getInstance();
export default PersistenceManager;
