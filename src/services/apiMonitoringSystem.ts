/**
 * Comprehensive API Monitoring and Analytics System
 * Real-time monitoring, performance tracking, and analytics for QuantumVest APIs
 */

// Core Monitoring Types
export interface APIMetrics {
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  region?: string;
  errorType?: string;
  cached: boolean;
}

export interface PerformanceMetrics {
  endpoint: string;
  period: {
    start: number;
    end: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
  };
  performance: {
    avgResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  errors: {
    rate: number;
    types: Record<string, number>;
    trends: ErrorTrend[];
  };
  traffic: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    peakRps: number;
    peakTime: number;
  };
  users: {
    uniqueUsers: number;
    anonymousUsers: number;
    authenticatedUsers: number;
    topUsers: UserMetric[];
  };
  geography: {
    regions: Record<string, number>;
    countries: Record<string, number>;
    cities: Record<string, number>;
  };
}

export interface ErrorTrend {
  timestamp: number;
  errorCount: number;
  errorRate: number;
  topErrors: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export interface UserMetric {
  userId: string;
  requests: number;
  avgResponseTime: number;
  errorRate: number;
  lastSeen: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  actions: AlertAction[];
  cooldown: number; // minutes
  lastTriggered?: number;
}

export interface AlertCondition {
  metric:
    | "response_time"
    | "error_rate"
    | "requests_per_second"
    | "availability";
  operator: "greater_than" | "less_than" | "equals" | "not_equals";
  value: number;
  duration: number; // minutes
  aggregation: "avg" | "max" | "min" | "sum" | "count";
}

export interface AlertAction {
  type: "email" | "webhook" | "slack" | "sms" | "pagerduty";
  configuration: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertRule["severity"];
  title: string;
  description: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

export interface HealthStatus {
  overall: "healthy" | "degraded" | "unhealthy";
  services: Record<string, ServiceHealth>;
  dependencies: Record<string, DependencyHealth>;
  infrastructure: InfrastructureHealth;
  lastUpdated: number;
}

export interface ServiceHealth {
  status: "up" | "down" | "degraded";
  responseTime: number;
  errorRate: number;
  availability: number;
  lastCheck: number;
  dependencies: string[];
}

export interface DependencyHealth {
  name: string;
  status: "available" | "unavailable" | "degraded";
  responseTime: number;
  lastCheck: number;
  version?: string;
  endpoint?: string;
}

export interface InfrastructureHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
    latency: number;
  };
  database: {
    connections: number;
    queryTime: number;
    lockWaits: number;
  };
}

export interface SecurityMetrics {
  period: {
    start: number;
    end: number;
  };
  threats: {
    detected: number;
    blocked: number;
    mitigated: number;
  };
  attacks: {
    ddos: number;
    bruteForce: number;
    sqlInjection: number;
    xss: number;
    csrf: number;
  };
  authentication: {
    successfulLogins: number;
    failedLogins: number;
    suspiciousActivities: number;
    accountLockouts: number;
  };
  rateLimit: {
    violations: number;
    blockedRequests: number;
    topViolators: Array<{
      ip: string;
      requests: number;
      blocked: number;
    }>;
  };
}

// API Monitoring System Implementation
export class APIMonitoringSystem {
  private metrics: APIMetrics[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private healthStatus: HealthStatus;
  private isMonitoring = false;
  private metricsRetentionDays = 30;

  constructor() {
    this.healthStatus = this.initializeHealthStatus();
    this.initializeDefaultAlertRules();
    this.startMonitoring();
  }

  // Metrics Collection
  recordMetric(metric: APIMetrics): void {
    metric.timestamp = Date.now();
    this.metrics.push(metric);

    // Clean old metrics
    this.cleanOldMetrics();

    // Check alert rules
    this.checkAlertRules(metric);

    // Update health status
    this.updateHealthStatus();
  }

  recordAPICall(
    endpoint: string,
    method: string,
    status: number,
    responseTime: number,
    options: {
      userId?: string;
      userAgent?: string;
      ip?: string;
      cached?: boolean;
      error?: string;
    } = {},
  ): void {
    const metric: APIMetrics = {
      endpoint,
      method,
      status,
      responseTime,
      timestamp: Date.now(),
      userId: options.userId,
      userAgent: options.userAgent,
      ip: options.ip,
      cached: options.cached || false,
      errorType: options.error,
    };

    this.recordMetric(metric);
  }

  // Performance Analytics
  getPerformanceMetrics(
    endpoint?: string,
    timeRange: { start: number; end: number } = {
      start: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
      end: Date.now(),
    },
  ): PerformanceMetrics {
    let filteredMetrics = this.metrics.filter(
      (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
    );

    if (endpoint) {
      filteredMetrics = filteredMetrics.filter((m) => m.endpoint === endpoint);
    }

    return this.calculatePerformanceMetrics(filteredMetrics, timeRange);
  }

  private calculatePerformanceMetrics(
    metrics: APIMetrics[],
    period: { start: number; end: number },
  ): PerformanceMetrics {
    const successful = metrics.filter((m) => m.status >= 200 && m.status < 400);
    const failed = metrics.filter((m) => m.status >= 400);
    const cached = metrics.filter((m) => m.cached);

    const responseTimes = metrics
      .map((m) => m.responseTime)
      .sort((a, b) => a - b);
    const uniqueUsers = new Set(
      metrics.filter((m) => m.userId).map((m) => m.userId),
    );
    const anonymousUsers = metrics.filter((m) => !m.userId).length;

    // Calculate percentiles
    const p50 = this.calculatePercentile(responseTimes, 50);
    const p95 = this.calculatePercentile(responseTimes, 95);
    const p99 = this.calculatePercentile(responseTimes, 99);

    // Calculate traffic metrics
    const durationMinutes = (period.end - period.start) / (1000 * 60);
    const durationSeconds = durationMinutes * 60;
    const durationHours = durationMinutes / 60;

    // Error trends
    const errorTrends = this.calculateErrorTrends(failed, period);

    // Geography analysis
    const geography = this.calculateGeographyMetrics(metrics);

    // Top users
    const topUsers = this.calculateTopUsers(metrics);

    return {
      endpoint: "all",
      period,
      requests: {
        total: metrics.length,
        successful: successful.length,
        failed: failed.length,
        cached: cached.length,
      },
      performance: {
        avgResponseTime:
          responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) /
              responseTimes.length
            : 0,
        p50ResponseTime: p50,
        p95ResponseTime: p95,
        p99ResponseTime: p99,
        minResponseTime: responseTimes[0] || 0,
        maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      },
      errors: {
        rate: metrics.length > 0 ? failed.length / metrics.length : 0,
        types: this.calculateErrorTypes(failed),
        trends: errorTrends,
      },
      traffic: {
        requestsPerSecond:
          durationSeconds > 0 ? metrics.length / durationSeconds : 0,
        requestsPerMinute:
          durationMinutes > 0 ? metrics.length / durationMinutes : 0,
        requestsPerHour: durationHours > 0 ? metrics.length / durationHours : 0,
        peakRps: this.calculatePeakRps(metrics),
        peakTime: this.calculatePeakTime(metrics),
      },
      users: {
        uniqueUsers: uniqueUsers.size,
        anonymousUsers,
        authenticatedUsers: uniqueUsers.size,
        topUsers,
      },
      geography,
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private calculateErrorTypes(
    errorMetrics: APIMetrics[],
  ): Record<string, number> {
    const types: Record<string, number> = {};

    errorMetrics.forEach((metric) => {
      const statusClass = Math.floor(metric.status / 100) * 100;
      const key = statusClass.toString();
      types[key] = (types[key] || 0) + 1;
    });

    return types;
  }

  private calculateErrorTrends(
    errorMetrics: APIMetrics[],
    period: { start: number; end: number },
  ): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    const bucketSize = 5 * 60 * 1000; // 5-minute buckets

    for (let time = period.start; time < period.end; time += bucketSize) {
      const bucketErrors = errorMetrics.filter(
        (m) => m.timestamp >= time && m.timestamp < time + bucketSize,
      );

      const totalRequests = this.metrics.filter(
        (m) => m.timestamp >= time && m.timestamp < time + bucketSize,
      ).length;

      trends.push({
        timestamp: time,
        errorCount: bucketErrors.length,
        errorRate: totalRequests > 0 ? bucketErrors.length / totalRequests : 0,
        topErrors: this.getTopErrors(bucketErrors),
      });
    }

    return trends;
  }

  private getTopErrors(
    errorMetrics: APIMetrics[],
  ): Array<{ type: string; count: number; percentage: number }> {
    const errorTypes = this.calculateErrorTypes(errorMetrics);
    const total = errorMetrics.length;

    return Object.entries(errorTypes)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateGeographyMetrics(
    metrics: APIMetrics[],
  ): PerformanceMetrics["geography"] {
    // Mock geography calculation - in production, would use IP geolocation
    return {
      regions: {
        "North America": Math.floor(metrics.length * 0.4),
        Europe: Math.floor(metrics.length * 0.3),
        Asia: Math.floor(metrics.length * 0.2),
        Other: Math.floor(metrics.length * 0.1),
      },
      countries: {
        "United States": Math.floor(metrics.length * 0.35),
        "United Kingdom": Math.floor(metrics.length * 0.15),
        Germany: Math.floor(metrics.length * 0.1),
        Japan: Math.floor(metrics.length * 0.08),
        Other: Math.floor(metrics.length * 0.32),
      },
      cities: {
        "New York": Math.floor(metrics.length * 0.15),
        London: Math.floor(metrics.length * 0.12),
        Tokyo: Math.floor(metrics.length * 0.08),
        "San Francisco": Math.floor(metrics.length * 0.1),
        Other: Math.floor(metrics.length * 0.55),
      },
    };
  }

  private calculateTopUsers(metrics: APIMetrics[]): UserMetric[] {
    const userStats = new Map<
      string,
      {
        requests: number;
        responseTimes: number[];
        errors: number;
        lastSeen: number;
      }
    >();

    metrics.forEach((metric) => {
      if (!metric.userId) return;

      const stats = userStats.get(metric.userId) || {
        requests: 0,
        responseTimes: [],
        errors: 0,
        lastSeen: 0,
      };

      stats.requests++;
      stats.responseTimes.push(metric.responseTime);
      if (metric.status >= 400) stats.errors++;
      stats.lastSeen = Math.max(stats.lastSeen, metric.timestamp);

      userStats.set(metric.userId, stats);
    });

    return Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        requests: stats.requests,
        avgResponseTime:
          stats.responseTimes.reduce((sum, time) => sum + time, 0) /
          stats.responseTimes.length,
        errorRate: stats.errors / stats.requests,
        lastSeen: stats.lastSeen,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
  }

  private calculatePeakRps(metrics: APIMetrics[]): number {
    const buckets = new Map<number, number>();
    const bucketSize = 1000; // 1-second buckets

    metrics.forEach((metric) => {
      const bucket = Math.floor(metric.timestamp / bucketSize) * bucketSize;
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    });

    return Math.max(...Array.from(buckets.values()), 0);
  }

  private calculatePeakTime(metrics: APIMetrics[]): number {
    const buckets = new Map<number, number>();
    const bucketSize = 60 * 1000; // 1-minute buckets

    metrics.forEach((metric) => {
      const bucket = Math.floor(metric.timestamp / bucketSize) * bucketSize;
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    });

    let peakTime = 0;
    let peakCount = 0;

    buckets.forEach((count, time) => {
      if (count > peakCount) {
        peakCount = count;
        peakTime = time;
      }
    });

    return peakTime;
  }

  // Alert Management
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  private checkAlertRules(metric: APIMetrics): void {
    this.alertRules.forEach((rule, ruleId) => {
      if (!rule.enabled) return;

      // Check cooldown
      if (
        rule.lastTriggered &&
        Date.now() - rule.lastTriggered < rule.cooldown * 60 * 1000
      ) {
        return;
      }

      const shouldTrigger = this.evaluateAlertCondition(rule.condition, metric);

      if (shouldTrigger) {
        this.triggerAlert(rule, metric);
      }
    });
  }

  private evaluateAlertCondition(
    condition: AlertCondition,
    metric: APIMetrics,
  ): boolean {
    let value: number;

    switch (condition.metric) {
      case "response_time":
        value = metric.responseTime;
        break;
      case "error_rate":
        const recentMetrics = this.getRecentMetrics(condition.duration);
        const errorCount = recentMetrics.filter((m) => m.status >= 400).length;
        value =
          recentMetrics.length > 0 ? errorCount / recentMetrics.length : 0;
        break;
      case "requests_per_second":
        const rpsMetrics = this.getRecentMetrics(1); // Last minute
        value = rpsMetrics.length / 60;
        break;
      case "availability":
        const availMetrics = this.getRecentMetrics(condition.duration);
        const successCount = availMetrics.filter(
          (m) => m.status >= 200 && m.status < 400,
        ).length;
        value =
          availMetrics.length > 0 ? successCount / availMetrics.length : 1;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case "greater_than":
        return value > condition.value;
      case "less_than":
        return value < condition.value;
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      default:
        return false;
    }
  }

  private getRecentMetrics(durationMinutes: number): APIMetrics[] {
    const cutoff = Date.now() - durationMinutes * 60 * 1000;
    return this.metrics.filter((m) => m.timestamp >= cutoff);
  }

  private triggerAlert(rule: AlertRule, metric: APIMetrics): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      value: metric.responseTime, // Simplified - would calculate based on condition
      threshold: rule.threshold,
      timestamp: Date.now(),
      resolved: false,
      metadata: {
        endpoint: metric.endpoint,
        method: metric.method,
        status: metric.status,
      },
    };

    this.activeAlerts.set(alert.id, alert);
    rule.lastTriggered = Date.now();

    // Execute alert actions
    this.executeAlertActions(rule.actions, alert);

    console.warn("Alert triggered:", alert);
  }

  private executeAlertActions(actions: AlertAction[], alert: Alert): void {
    actions.forEach((action) => {
      switch (action.type) {
        case "webhook":
          this.sendWebhook(action.configuration.url, alert);
          break;
        case "email":
          this.sendEmail(action.configuration.recipients, alert);
          break;
        // Add other action types as needed
      }
    });
  }

  private async sendWebhook(url: string, alert: Alert): Promise<void> {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.error("Failed to send webhook:", error);
    }
  }

  private sendEmail(recipients: string[], alert: Alert): void {
    // Implementation would integrate with email service
    console.log("Email alert sent to:", recipients, alert);
  }

  // Health Monitoring
  private updateHealthStatus(): void {
    const recentMetrics = this.getRecentMetrics(5); // Last 5 minutes
    const errorRate =
      recentMetrics.length > 0
        ? recentMetrics.filter((m) => m.status >= 400).length /
          recentMetrics.length
        : 0;

    const avgResponseTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
          recentMetrics.length
        : 0;

    // Determine overall health
    let overall: HealthStatus["overall"] = "healthy";
    if (errorRate > 0.1 || avgResponseTime > 2000) {
      overall = "degraded";
    }
    if (errorRate > 0.25 || avgResponseTime > 5000) {
      overall = "unhealthy";
    }

    this.healthStatus = {
      ...this.healthStatus,
      overall,
      lastUpdated: Date.now(),
    };
  }

  // Security Monitoring
  getSecurityMetrics(timeRange: {
    start: number;
    end: number;
  }): SecurityMetrics {
    const metrics = this.metrics.filter(
      (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
    );

    // Analyze for security threats
    const threats = this.analyzeSecurityThreats(metrics);
    const attacks = this.analyzeAttackPatterns(metrics);
    const authentication = this.analyzeAuthenticationMetrics(metrics);
    const rateLimit = this.analyzeRateLimitMetrics(metrics);

    return {
      period: timeRange,
      threats,
      attacks,
      authentication,
      rateLimit,
    };
  }

  private analyzeSecurityThreats(
    metrics: APIMetrics[],
  ): SecurityMetrics["threats"] {
    // Mock implementation - would integrate with security tools
    return {
      detected: Math.floor(Math.random() * 10),
      blocked: Math.floor(Math.random() * 5),
      mitigated: Math.floor(Math.random() * 3),
    };
  }

  private analyzeAttackPatterns(
    metrics: APIMetrics[],
  ): SecurityMetrics["attacks"] {
    // Analysis would look for specific attack patterns
    return {
      ddos: 0,
      bruteForce: 0,
      sqlInjection: 0,
      xss: 0,
      csrf: 0,
    };
  }

  private analyzeAuthenticationMetrics(
    metrics: APIMetrics[],
  ): SecurityMetrics["authentication"] {
    const authMetrics = metrics.filter((m) => m.endpoint.includes("/auth"));
    const successful = authMetrics.filter((m) => m.status === 200).length;
    const failed = authMetrics.filter((m) => m.status >= 400).length;

    return {
      successfulLogins: successful,
      failedLogins: failed,
      suspiciousActivities: Math.floor(failed * 0.1),
      accountLockouts: Math.floor(failed * 0.05),
    };
  }

  private analyzeRateLimitMetrics(
    metrics: APIMetrics[],
  ): SecurityMetrics["rateLimit"] {
    const rateLimitViolations = metrics.filter((m) => m.status === 429);

    return {
      violations: rateLimitViolations.length,
      blockedRequests: rateLimitViolations.length,
      topViolators: this.getTopRateLimitViolators(rateLimitViolations),
    };
  }

  private getTopRateLimitViolators(
    violations: APIMetrics[],
  ): Array<{ ip: string; requests: number; blocked: number }> {
    const violators = new Map<string, { requests: number; blocked: number }>();

    violations.forEach((violation) => {
      if (!violation.ip) return;

      const stats = violators.get(violation.ip) || { requests: 0, blocked: 0 };
      stats.requests++;
      stats.blocked++;
      violators.set(violation.ip, stats);
    });

    return Array.from(violators.entries())
      .map(([ip, stats]) => ({ ip, ...stats }))
      .sort((a, b) => b.blocked - a.blocked)
      .slice(0, 10);
  }

  // Utility Methods
  private cleanOldMetrics(): void {
    const cutoff = Date.now() - this.metricsRetentionDays * 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
  }

  private initializeHealthStatus(): HealthStatus {
    return {
      overall: "healthy",
      services: {},
      dependencies: {},
      infrastructure: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { inbound: 0, outbound: 0, latency: 0 },
        database: { connections: 0, queryTime: 0, lockWaits: 0 },
      },
      lastUpdated: Date.now(),
    };
  }

  private initializeDefaultAlertRules(): void {
    // High response time alert
    this.addAlertRule({
      id: "high_response_time",
      name: "High Response Time",
      description: "API response time is above threshold",
      condition: {
        metric: "response_time",
        operator: "greater_than",
        value: 2000,
        duration: 5,
        aggregation: "avg",
      },
      threshold: 2000,
      severity: "high",
      enabled: true,
      actions: [
        {
          type: "webhook",
          configuration: { url: "/api/alerts/webhook" },
        },
      ],
      cooldown: 15,
    });

    // High error rate alert
    this.addAlertRule({
      id: "high_error_rate",
      name: "High Error Rate",
      description: "API error rate is above threshold",
      condition: {
        metric: "error_rate",
        operator: "greater_than",
        value: 0.1,
        duration: 5,
        aggregation: "avg",
      },
      threshold: 0.1,
      severity: "critical",
      enabled: true,
      actions: [
        {
          type: "webhook",
          configuration: { url: "/api/alerts/webhook" },
        },
      ],
      cooldown: 10,
    });
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Start periodic health checks
    setInterval(() => {
      this.updateHealthStatus();
    }, 30000); // Every 30 seconds

    // Start periodic cleanup
    setInterval(
      () => {
        this.cleanOldMetrics();
      },
      60 * 60 * 1000,
    ); // Every hour
  }

  // Public API
  public getHealthStatus(): HealthStatus {
    return this.healthStatus;
  }

  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolved,
    );
  }

  public getMetricsSummary(): {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    uniqueEndpoints: number;
  } {
    const recentMetrics = this.getRecentMetrics(60); // Last hour
    const errors = recentMetrics.filter((m) => m.status >= 400);
    const uniqueEndpoints = new Set(recentMetrics.map((m) => m.endpoint));

    return {
      totalRequests: recentMetrics.length,
      avgResponseTime:
        recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
            recentMetrics.length
          : 0,
      errorRate:
        recentMetrics.length > 0 ? errors.length / recentMetrics.length : 0,
      uniqueEndpoints: uniqueEndpoints.size,
    };
  }

  public exportMetrics(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = [
        "timestamp",
        "endpoint",
        "method",
        "status",
        "responseTime",
        "userId",
        "cached",
      ];
      const rows = this.metrics.map((m) => [
        m.timestamp,
        m.endpoint,
        m.method,
        m.status,
        m.responseTime,
        m.userId || "",
        m.cached,
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }

    return JSON.stringify(this.metrics, null, 2);
  }
}

// Export singleton instance
export const apiMonitoringSystem = new APIMonitoringSystem();
export default APIMonitoringSystem;
