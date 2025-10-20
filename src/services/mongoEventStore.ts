/**
 * MongoDB Event Store
 * Scalable user events, analytics, and time-series data storage
 */

import { MongoClient, Db, Collection, CreateIndexesOptions } from "mongodb";

export interface UserEvent {
  _id?: string;
  userId: string;
  sessionId: string;
  eventType: EventType;
  eventName: string;
  timestamp: Date;

  // Event data
  data: Record<string, any>;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    country?: string;
    platform?: string;
    deviceType?: string;
    referrer?: string;
    source?: string;
  };

  // Context
  vaultId?: string;
  transactionId?: string;
  assetId?: string;

  // Analytics
  category: string;
  action: string;
  label?: string;
  value?: number;

  // Performance
  duration?: number;
  responseTime?: number;

  // A/B Testing
  experimentId?: string;
  variantId?: string;

  // Processing
  processed: boolean;
  processedAt?: Date;
  version: number;
}

export interface AnalyticsData {
  _id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  aggregationType: "daily" | "weekly" | "monthly";

  // User behavior metrics
  sessionsCount: number;
  pageViews: number;
  uniqueEvents: number;
  totalTimeSpent: number; // in seconds
  bounceRate: number;

  // Investment metrics
  transactionsCount: number;
  totalInvested: number;
  portfolioValue: number;
  riskScore: number;
  performanceReturn: number;

  // Engagement metrics
  featuresUsed: string[];
  clicksCount: number;
  documentsViewed: number;
  reportsGenerated: number;

  // Cultural/Impact metrics
  impactScore: number;
  culturalAlignment: number;
  esgEngagement: number;

  // Device/platform
  deviceTypes: Record<string, number>;
  platforms: Record<string, number>;
  countries: Record<string, number>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAggregation {
  _id: any;
  count: number;
  uniqueUsers: number;
  totalValue: number;
  avgValue: number;
  data: Record<string, any>;
}

export interface PerformanceMetric {
  _id?: string;
  endpoint: string;
  method: string;
  timestamp: Date;

  // Performance data
  responseTime: number;
  statusCode: number;
  contentLength: number;

  // Request context
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;

  // Database performance
  dbQueryTime?: number;
  dbConnections?: number;
  cacheHitRate?: number;

  // Error details
  errorType?: string;
  errorMessage?: string;
  stackTrace?: string;
}

export interface SystemMetric {
  _id?: string;
  timestamp: Date;
  metricType: "system" | "business" | "technical";

  // System metrics
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  networkIO?: number;

  // Business metrics
  activeUsers?: number;
  totalInvestments?: number;
  transactionVolume?: number;
  revenueGenerated?: number;

  // Technical metrics
  apiCalls?: number;
  errorRate?: number;
  uptime?: number;
  deploymentVersion?: string;

  // Custom metrics
  customMetrics?: Record<string, number>;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 1 | 0>;
  filter?: Record<string, any>;
}

export class MongoEventStore {
  private static instance: MongoEventStore;
  private client: MongoClient;
  private db: Db;
  private isConnected: boolean = false;

  // Collections
  private eventsCollection: Collection<UserEvent>;
  private analyticsCollection: Collection<AnalyticsData>;
  private performanceCollection: Collection<PerformanceMetric>;
  private systemMetricsCollection: Collection<SystemMetric>;

  private constructor() {
    this.initializeConnection();
  }

  static getInstance(): MongoEventStore {
    if (!MongoEventStore.instance) {
      MongoEventStore.instance = new MongoEventStore();
    }
    return MongoEventStore.instance;
  }

  private async initializeConnection(): Promise<void> {
    try {
      const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017";
      const dbName = process.env.MONGODB_DB_NAME || "quantumvest_events";

      this.client = new MongoClient(mongoUrl, {
        maxPoolSize: 50,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;

      // Initialize collections
      this.eventsCollection = this.db.collection<UserEvent>("user_events");
      this.analyticsCollection =
        this.db.collection<AnalyticsData>("analytics_data");
      this.performanceCollection = this.db.collection<PerformanceMetric>(
        "performance_metrics",
      );
      this.systemMetricsCollection =
        this.db.collection<SystemMetric>("system_metrics");

      // Create indexes
      await this.createIndexes();

      console.log("✅ MongoDB Event Store connected");
    } catch (error) {
      console.error("❌ MongoDB Event Store connection failed:", error);
      this.isConnected = false;
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // User events indexes
      await this.eventsCollection.createIndexes([
        { key: { userId: 1, timestamp: -1 } },
        { key: { eventType: 1, timestamp: -1 } },
        { key: { sessionId: 1 } },
        { key: { timestamp: -1 } },
        { key: { processed: 1 } },
        { key: { "metadata.country": 1 } },
        { key: { vaultId: 1, timestamp: -1 } },
        { key: { category: 1, action: 1 } },
        { key: { experimentId: 1, variantId: 1 } },
      ]);

      // Analytics indexes
      await this.analyticsCollection.createIndexes([
        { key: { userId: 1, date: -1 } },
        { key: { date: -1, aggregationType: 1 } },
        { key: { userId: 1, aggregationType: 1 } },
      ]);

      // Performance metrics indexes
      await this.performanceCollection.createIndexes([
        { key: { endpoint: 1, timestamp: -1 } },
        { key: { timestamp: -1 } },
        { key: { statusCode: 1, timestamp: -1 } },
        { key: { responseTime: -1 } },
      ]);

      // System metrics indexes
      await this.systemMetricsCollection.createIndexes([
        { key: { timestamp: -1 } },
        { key: { metricType: 1, timestamp: -1 } },
      ]);

      console.log("✅ MongoDB indexes created");
    } catch (error) {
      console.error("❌ Failed to create MongoDB indexes:", error);
    }
  }

  /**
   * Record user event
   */
  async recordEvent(
    event: Omit<UserEvent, "_id" | "timestamp" | "processed" | "version">,
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const eventDoc: UserEvent = {
        ...event,
        timestamp: new Date(),
        processed: false,
        version: 1,
      };

      const result = await this.eventsCollection.insertOne(eventDoc);
      return result.insertedId.toString();
    } catch (error) {
      console.error("Failed to record event:", error);
      throw new Error(`Failed to record event: ${error}`);
    }
  }

  /**
   * Record multiple events in batch
   */
  async recordEvents(
    events: Omit<UserEvent, "_id" | "timestamp" | "processed" | "version">[],
  ): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const eventDocs: UserEvent[] = events.map((event) => ({
        ...event,
        timestamp: new Date(),
        processed: false,
        version: 1,
      }));

      const result = await this.eventsCollection.insertMany(eventDocs);
      return Object.values(result.insertedIds).map((id) => id.toString());
    } catch (error) {
      console.error("Failed to record events:", error);
      throw new Error(`Failed to record events: ${error}`);
    }
  }

  /**
   * Get user events
   */
  async getUserEvents(
    userId: string,
    options: QueryOptions & {
      startDate?: Date;
      endDate?: Date;
      eventTypes?: EventType[];
    } = {},
  ): Promise<UserEvent[]> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const filter: any = { userId };

      if (options.startDate || options.endDate) {
        filter.timestamp = {};
        if (options.startDate) filter.timestamp.$gte = options.startDate;
        if (options.endDate) filter.timestamp.$lte = options.endDate;
      }

      if (options.eventTypes && options.eventTypes.length > 0) {
        filter.eventType = { $in: options.eventTypes };
      }

      if (options.filter) {
        Object.assign(filter, options.filter);
      }

      const cursor = this.eventsCollection.find(filter);

      if (options.sort) cursor.sort(options.sort);
      else cursor.sort({ timestamp: -1 });

      if (options.skip) cursor.skip(options.skip);
      if (options.limit) cursor.limit(options.limit);
      if (options.projection) cursor.project(options.projection);

      return await cursor.toArray();
    } catch (error) {
      console.error("Failed to get user events:", error);
      throw new Error(`Failed to get user events: ${error}`);
    }
  }

  /**
   * Get events by session
   */
  async getSessionEvents(sessionId: string): Promise<UserEvent[]> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      return await this.eventsCollection
        .find({ sessionId })
        .sort({ timestamp: 1 })
        .toArray();
    } catch (error) {
      console.error("Failed to get session events:", error);
      throw new Error(`Failed to get session events: ${error}`);
    }
  }

  /**
   * Aggregate events
   */
  async aggregateEvents(
    pipeline: any[],
    options: { allowDiskUse?: boolean } = {},
  ): Promise<EventAggregation[]> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const cursor = this.eventsCollection.aggregate(pipeline, {
        allowDiskUse: options.allowDiskUse || true,
      });

      return await cursor.toArray();
    } catch (error) {
      console.error("Failed to aggregate events:", error);
      throw new Error(`Failed to aggregate events: ${error}`);
    }
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(
    startDate: Date,
    endDate: Date,
    groupBy: "hour" | "day" | "week" | "month" = "day",
  ): Promise<EventAggregation[]> {
    const groupByFormats = {
      hour: {
        $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$timestamp" },
      },
      day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
      week: { $dateToString: { format: "%Y-W%U", date: "$timestamp" } },
      month: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
    };

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            period: groupByFormats[groupBy],
            eventType: "$eventType",
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
          totalValue: { $sum: { $ifNull: ["$value", 0] } },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          totalValue: 1,
          avgValue: { $divide: ["$totalValue", "$count"] },
        },
      },
      { $sort: { "_id.period": 1, "_id.eventType": 1 } },
    ];

    return await this.aggregateEvents(pipeline);
  }

  /**
   * Get user journey
   */
  async getUserJourney(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    events: UserEvent[];
    sessions: { sessionId: string; events: number; duration: number }[];
    funnelSteps: Record<string, number>;
  }> {
    const events = await this.getUserEvents(userId, {
      startDate,
      endDate,
      sort: { timestamp: 1 },
    });

    // Group by session
    const sessionMap = new Map<string, UserEvent[]>();
    events.forEach((event) => {
      if (!sessionMap.has(event.sessionId)) {
        sessionMap.set(event.sessionId, []);
      }
      sessionMap.get(event.sessionId)!.push(event);
    });

    // Calculate session statistics
    const sessions = Array.from(sessionMap.entries()).map(
      ([sessionId, sessionEvents]) => {
        const firstEvent = sessionEvents[0];
        const lastEvent = sessionEvents[sessionEvents.length - 1];
        const duration =
          lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();

        return {
          sessionId,
          events: sessionEvents.length,
          duration: Math.round(duration / 1000), // in seconds
        };
      },
    );

    // Calculate funnel steps
    const funnelSteps: Record<string, number> = {};
    events.forEach((event) => {
      const stepKey = `${event.category}_${event.action}`;
      funnelSteps[stepKey] = (funnelSteps[stepKey] || 0) + 1;
    });

    return { events, sessions, funnelSteps };
  }

  /**
   * Store analytics data
   */
  async storeAnalyticsData(
    analytics: Omit<AnalyticsData, "_id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const analyticsDoc: AnalyticsData = {
        ...analytics,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.analyticsCollection.replaceOne(
        {
          userId: analytics.userId,
          date: analytics.date,
          aggregationType: analytics.aggregationType,
        },
        analyticsDoc,
        { upsert: true },
      );

      return result.upsertedId?.toString() || "updated";
    } catch (error) {
      console.error("Failed to store analytics data:", error);
      throw new Error(`Failed to store analytics data: ${error}`);
    }
  }

  /**
   * Get analytics data
   */
  async getAnalyticsData(
    userId: string,
    aggregationType: "daily" | "weekly" | "monthly",
    startDate?: string,
    endDate?: string,
  ): Promise<AnalyticsData[]> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const filter: any = { userId, aggregationType };

      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = startDate;
        if (endDate) filter.date.$lte = endDate;
      }

      return await this.analyticsCollection
        .find(filter)
        .sort({ date: -1 })
        .toArray();
    } catch (error) {
      console.error("Failed to get analytics data:", error);
      throw new Error(`Failed to get analytics data: ${error}`);
    }
  }

  /**
   * Record performance metric
   */
  async recordPerformanceMetric(
    metric: Omit<PerformanceMetric, "_id" | "timestamp">,
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const metricDoc: PerformanceMetric = {
        ...metric,
        timestamp: new Date(),
      };

      const result = await this.performanceCollection.insertOne(metricDoc);
      return result.insertedId.toString();
    } catch (error) {
      console.error("Failed to record performance metric:", error);
      throw new Error(`Failed to record performance metric: ${error}`);
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    options: QueryOptions & {
      endpoint?: string;
      startDate?: Date;
      endDate?: Date;
      statusCode?: number;
    } = {},
  ): Promise<PerformanceMetric[]> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const filter: any = {};

      if (options.endpoint) filter.endpoint = options.endpoint;
      if (options.statusCode) filter.statusCode = options.statusCode;

      if (options.startDate || options.endDate) {
        filter.timestamp = {};
        if (options.startDate) filter.timestamp.$gte = options.startDate;
        if (options.endDate) filter.timestamp.$lte = options.endDate;
      }

      const cursor = this.performanceCollection.find(filter);

      if (options.sort) cursor.sort(options.sort);
      else cursor.sort({ timestamp: -1 });

      if (options.skip) cursor.skip(options.skip);
      if (options.limit) cursor.limit(options.limit);

      return await cursor.toArray();
    } catch (error) {
      console.error("Failed to get performance metrics:", error);
      throw new Error(`Failed to get performance metrics: ${error}`);
    }
  }

  /**
   * Record system metric
   */
  async recordSystemMetric(
    metric: Omit<SystemMetric, "_id" | "timestamp">,
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const metricDoc: SystemMetric = {
        ...metric,
        timestamp: new Date(),
      };

      const result = await this.systemMetricsCollection.insertOne(metricDoc);
      return result.insertedId.toString();
    } catch (error) {
      console.error("Failed to record system metric:", error);
      throw new Error(`Failed to record system metric: ${error}`);
    }
  }

  /**
   * Process unprocessed events
   */
  async processUnprocessedEvents(batchSize: number = 1000): Promise<number> {
    if (!this.isConnected) {
      throw new Error("MongoDB not connected");
    }

    try {
      const unprocessedEvents = await this.eventsCollection
        .find({ processed: false })
        .limit(batchSize)
        .toArray();

      if (unprocessedEvents.length === 0) {
        return 0;
      }

      // Process events (this is where you'd add your event processing logic)
      for (const event of unprocessedEvents) {
        await this.processEvent(event);
      }

      // Mark events as processed
      const eventIds = unprocessedEvents.map((event) => event._id);
      await this.eventsCollection.updateMany(
        { _id: { $in: eventIds } },
        { $set: { processed: true, processedAt: new Date() } },
      );

      return unprocessedEvents.length;
    } catch (error) {
      console.error("Failed to process unprocessed events:", error);
      throw new Error(`Failed to process unprocessed events: ${error}`);
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: UserEvent): Promise<void> {
    // Add your event processing logic here
    // For example: update user analytics, trigger notifications, etc.

    try {
      // Example: Update daily analytics
      const date = event.timestamp.toISOString().split("T")[0];

      await this.analyticsCollection.updateOne(
        { userId: event.userId, date, aggregationType: "daily" },
        {
          $inc: {
            uniqueEvents: 1,
            ...(event.value && { totalInvested: event.value }),
          },
          $addToSet: {
            featuresUsed: event.eventName,
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (error) {
      console.error(`Failed to process event ${event._id}:`, error);
    }
  }

  /**
   * Clean up old data
   */
  async cleanup(
    options: {
      eventsRetentionDays?: number;
      performanceRetentionDays?: number;
      analyticsRetentionDays?: number;
    } = {},
  ): Promise<{
    eventsDeleted: number;
    performanceDeleted: number;
    analyticsDeleted: number;
  }> {
    const eventsRetention = options.eventsRetentionDays || 365; // 1 year
    const performanceRetention = options.performanceRetentionDays || 90; // 3 months
    const analyticsRetention = options.analyticsRetentionDays || 730; // 2 years

    const now = new Date();
    const eventsCleanupDate = new Date(
      now.getTime() - eventsRetention * 24 * 60 * 60 * 1000,
    );
    const performanceCleanupDate = new Date(
      now.getTime() - performanceRetention * 24 * 60 * 60 * 1000,
    );
    const analyticsCleanupDate = new Date(
      now.getTime() - analyticsRetention * 24 * 60 * 60 * 1000,
    );

    try {
      const [eventsResult, performanceResult, analyticsResult] =
        await Promise.all([
          this.eventsCollection.deleteMany({
            timestamp: { $lt: eventsCleanupDate },
          }),
          this.performanceCollection.deleteMany({
            timestamp: { $lt: performanceCleanupDate },
          }),
          this.analyticsCollection.deleteMany({
            createdAt: { $lt: analyticsCleanupDate },
          }),
        ]);

      return {
        eventsDeleted: eventsResult.deletedCount,
        performanceDeleted: performanceResult.deletedCount,
        analyticsDeleted: analyticsResult.deletedCount,
      };
    } catch (error) {
      console.error("Failed to cleanup old data:", error);
      throw new Error(`Failed to cleanup old data: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    connected: boolean;
    collections: Record<string, boolean>;
    stats?: any;
  }> {
    try {
      if (!this.isConnected) {
        return {
          status: "unhealthy",
          connected: false,
          collections: {},
        };
      }

      // Test database connection
      await this.db.admin().ping();

      // Check collections
      const collections = {
        events: !!(await this.eventsCollection.findOne(
          {},
          { projection: { _id: 1 } },
        )),
        analytics: !!(await this.analyticsCollection.findOne(
          {},
          { projection: { _id: 1 } },
        )),
        performance: !!(await this.performanceCollection.findOne(
          {},
          { projection: { _id: 1 } },
        )),
        systemMetrics: !!(await this.systemMetricsCollection.findOne(
          {},
          { projection: { _id: 1 } },
        )),
      };

      const stats = await this.db.stats();

      return {
        status: "healthy",
        connected: this.isConnected,
        collections,
        stats: {
          dataSize: stats.dataSize,
          indexSize: stats.indexSize,
          storageSize: stats.storageSize,
          collections: stats.collections,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        connected: false,
        collections: {},
      };
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log("🔌 MongoDB Event Store disconnected");
    }
  }
}

// Event types enum
export enum EventType {
  PAGE_VIEW = "page_view",
  USER_ACTION = "user_action",
  TRANSACTION = "transaction",
  INVESTMENT = "investment",
  VAULT_ACTION = "vault_action",
  AUTHENTICATION = "authentication",
  NOTIFICATION = "notification",
  ERROR = "error",
  PERFORMANCE = "performance",
  CUSTOM = "custom",
}

// Export singleton instance
export const mongoEventStore = MongoEventStore.getInstance();
export default MongoEventStore;
