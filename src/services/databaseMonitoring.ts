/**
 * Database Monitoring System
 * Real-time performance monitoring and alerting for QuantumVest database infrastructure
 */

import {
  databaseArchitecture,
  DatabaseCluster,
  PerformanceMetrics,
} from "./databaseArchitecture";

export interface MonitoringAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  type: "performance" | "security" | "capacity" | "availability" | "quantum";
  title: string;
  message: string;
  cluster_id?: string;
  table_name?: string;
  metric_value: number;
  threshold_value: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolution_time?: Date;
  action_taken?: string;
}

export interface PerformanceThreshold {
  metric: string;
  warning_threshold: number;
  critical_threshold: number;
  comparison: "greater_than" | "less_than" | "equals";
  enabled: boolean;
}

export interface MonitoringMetric {
  id: string;
  cluster_id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  quantum_enhanced: boolean;
}

export interface DatabaseHealthScore {
  overall_score: number;
  performance_score: number;
  availability_score: number;
  security_score: number;
  quantum_coherence_score: number;
  last_calculated: Date;
  components: {
    cpu_health: number;
    memory_health: number;
    disk_health: number;
    network_health: number;
    query_performance: number;
    replication_health: number;
    backup_health: number;
    quantum_fidelity: number;
  };
}

export interface QueryAnalysis {
  query_id: string;
  sql_hash: string;
  execution_count: number;
  total_time: number;
  average_time: number;
  min_time: number;
  max_time: number;
  last_execution: Date;
  rows_examined_avg: number;
  rows_returned_avg: number;
  cache_hit_ratio: number;
  optimization_recommendation: string[];
  quantum_optimizable: boolean;
}

export interface CapacityForecast {
  resource_type:
    | "cpu"
    | "memory"
    | "storage"
    | "connections"
    | "quantum_states";
  current_usage: number;
  current_capacity: number;
  utilization_percentage: number;
  growth_rate_per_day: number;
  projected_full_capacity_date: Date;
  recommended_scaling_action: string;
  confidence_level: number;
}

export interface SecurityMonitoringEvent {
  id: string;
  event_type:
    | "authentication_failure"
    | "privilege_escalation"
    | "data_access"
    | "sql_injection"
    | "quantum_tampering";
  severity: "critical" | "high" | "medium" | "low";
  user_id?: string;
  ip_address: string;
  user_agent: string;
  details: Record<string, any>;
  timestamp: Date;
  investigated: boolean;
  threat_level: number;
}

export interface QuantumMonitoringMetrics {
  fidelity_drift: number;
  entanglement_degradation: number;
  coherence_time_variance: number;
  quantum_error_rate: number;
  state_preparation_accuracy: number;
  measurement_accuracy: number;
  quantum_volume_efficiency: number;
  error_correction_overhead: number;
}

export class DatabaseMonitoring {
  private static instance: DatabaseMonitoring;
  private alerts: Map<string, MonitoringAlert> = new Map();
  private metrics: Map<string, MonitoringMetric[]> = new Map();
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private healthScores: Map<string, DatabaseHealthScore> = new Map();
  private queryAnalytics: Map<string, QueryAnalysis> = new Map();
  private securityEvents: SecurityMonitoringEvent[] = [];
  private quantumMetrics: QuantumMonitoringMetrics;
  private isMonitoring: boolean = false;
  private monitoringInterval: number = 30000; // 30 seconds

  private constructor() {
    this.initializeDefaultThresholds();
    this.initializeQuantumMetrics();
  }

  static getInstance(): DatabaseMonitoring {
    if (!DatabaseMonitoring.instance) {
      DatabaseMonitoring.instance = new DatabaseMonitoring();
    }
    return DatabaseMonitoring.instance;
  }

  private initializeDefaultThresholds(): void {
    const defaultThresholds: PerformanceThreshold[] = [
      {
        metric: "cpu_utilization",
        warning_threshold: 70,
        critical_threshold: 90,
        comparison: "greater_than",
        enabled: true,
      },
      {
        metric: "memory_utilization",
        warning_threshold: 80,
        critical_threshold: 95,
        comparison: "greater_than",
        enabled: true,
      },
      {
        metric: "query_latency_p95",
        warning_threshold: 1000,
        critical_threshold: 5000,
        comparison: "greater_than",
        enabled: true,
      },
      {
        metric: "connection_count",
        warning_threshold: 800,
        critical_threshold: 950,
        comparison: "greater_than",
        enabled: true,
      },
      {
        metric: "cache_hit_ratio",
        warning_threshold: 0.8,
        critical_threshold: 0.6,
        comparison: "less_than",
        enabled: true,
      },
      {
        metric: "deadlocks",
        warning_threshold: 5,
        critical_threshold: 20,
        comparison: "greater_than",
        enabled: true,
      },
      {
        metric: "quantum_fidelity",
        warning_threshold: 0.95,
        critical_threshold: 0.9,
        comparison: "less_than",
        enabled: true,
      },
    ];

    defaultThresholds.forEach((threshold) => {
      this.thresholds.set(threshold.metric, threshold);
    });
  }

  private initializeQuantumMetrics(): void {
    this.quantumMetrics = {
      fidelity_drift: 0.02,
      entanglement_degradation: 0.05,
      coherence_time_variance: 0.1,
      quantum_error_rate: 0.001,
      state_preparation_accuracy: 0.998,
      measurement_accuracy: 0.995,
      quantum_volume_efficiency: 0.85,
      error_correction_overhead: 0.15,
    };
  }

  /**
   * Start monitoring all database clusters
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log("Starting database monitoring...");

    // Start periodic monitoring
    setInterval(() => {
      this.collectMetrics();
    }, this.monitoringInterval);

    // Start health score calculation
    setInterval(() => {
      this.calculateHealthScores();
    }, 60000); // Every minute

    // Start query analysis
    setInterval(() => {
      this.analyzeQueries();
    }, 300000); // Every 5 minutes

    // Start capacity forecasting
    setInterval(() => {
      this.generateCapacityForecasts();
    }, 3600000); // Every hour

    // Start quantum monitoring
    setInterval(() => {
      this.monitorQuantumMetrics();
    }, 10000); // Every 10 seconds for quantum coherence
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log("Database monitoring stopped");
  }

  /**
   * Collect metrics from all clusters
   */
  private async collectMetrics(): Promise<void> {
    const clusters = databaseArchitecture.getAllClusters();

    for (const cluster of clusters) {
      await this.collectClusterMetrics(cluster);
    }

    this.evaluateThresholds();
  }

  private async collectClusterMetrics(cluster: DatabaseCluster): Promise<void> {
    const timestamp = new Date();
    const baseMetrics = cluster.performance;

    // Convert performance metrics to monitoring metrics
    const metrics: MonitoringMetric[] = [
      {
        id: `${cluster.id}_cpu_${timestamp.getTime()}`,
        cluster_id: cluster.id,
        metric_name: "cpu_utilization",
        metric_value: baseMetrics.cpu_utilization,
        metric_unit: "percentage",
        timestamp,
        tags: { cluster_type: cluster.type, region: cluster.region },
        quantum_enhanced: cluster.type === "quantum_cache",
      },
      {
        id: `${cluster.id}_memory_${timestamp.getTime()}`,
        cluster_id: cluster.id,
        metric_name: "memory_utilization",
        metric_value: baseMetrics.memory_utilization,
        metric_unit: "percentage",
        timestamp,
        tags: { cluster_type: cluster.type, region: cluster.region },
        quantum_enhanced: cluster.type === "quantum_cache",
      },
      {
        id: `${cluster.id}_latency_${timestamp.getTime()}`,
        cluster_id: cluster.id,
        metric_name: "query_latency_p95",
        metric_value: baseMetrics.query_latency_p95,
        metric_unit: "milliseconds",
        timestamp,
        tags: { cluster_type: cluster.type, region: cluster.region },
        quantum_enhanced: cluster.type === "quantum_cache",
      },
      {
        id: `${cluster.id}_connections_${timestamp.getTime()}`,
        cluster_id: cluster.id,
        metric_name: "connection_count",
        metric_value: baseMetrics.connection_count,
        metric_unit: "count",
        timestamp,
        tags: { cluster_type: cluster.type, region: cluster.region },
        quantum_enhanced: false,
      },
      {
        id: `${cluster.id}_cache_${timestamp.getTime()}`,
        cluster_id: cluster.id,
        metric_name: "cache_hit_ratio",
        metric_value: baseMetrics.cache_hit_ratio,
        metric_unit: "ratio",
        timestamp,
        tags: { cluster_type: cluster.type, region: cluster.region },
        quantum_enhanced: cluster.type === "quantum_cache",
      },
    ];

    // Store metrics
    metrics.forEach((metric) => {
      const clusterMetrics = this.metrics.get(cluster.id) || [];
      clusterMetrics.push(metric);

      // Keep only last 1000 metrics per cluster
      if (clusterMetrics.length > 1000) {
        clusterMetrics.splice(0, clusterMetrics.length - 1000);
      }

      this.metrics.set(cluster.id, clusterMetrics);
    });

    // Collect quantum-specific metrics for quantum clusters
    if (cluster.type === "quantum_cache") {
      await this.collectQuantumSpecificMetrics(cluster);
    }
  }

  private async collectQuantumSpecificMetrics(
    cluster: DatabaseCluster,
  ): Promise<void> {
    const timestamp = new Date();

    // Simulate quantum-specific metrics collection
    const quantumMetrics: MonitoringMetric[] = [
      {
        id: `${cluster.id}_quantum_fidelity_${timestamp.getTime()}`,
        cluster_id: cluster.id,
        metric_name: "quantum_fidelity",
        metric_value: 0.95 + Math.random() * 0.04, // Simulate fidelity between 0.95-0.99
        metric_unit: "fidelity",
        timestamp,
        tags: { type: "quantum", measurement: "fidelity" },
        quantum_enhanced: true,
      },
      {
        id: `${cluster.id}_coherence_time_${timestamp.getTime()}`,
        cluster_id: cluster.id,
        metric_name: "coherence_time",
        metric_value: 50 + Math.random() * 100, // Simulate coherence time in microseconds
        metric_unit: "microseconds",
        timestamp,
        tags: { type: "quantum", measurement: "coherence" },
        quantum_enhanced: true,
      },
      {
        id: `${cluster.id}_entanglement_rate_${timestamp.getTime()}`,
        cluster_id: cluster.id,
        metric_name: "entanglement_rate",
        metric_value: Math.random() * 0.1, // Simulate entanglement degradation rate
        metric_unit: "rate",
        timestamp,
        tags: { type: "quantum", measurement: "entanglement" },
        quantum_enhanced: true,
      },
    ];

    quantumMetrics.forEach((metric) => {
      const clusterMetrics = this.metrics.get(cluster.id) || [];
      clusterMetrics.push(metric);
      this.metrics.set(cluster.id, clusterMetrics);
    });
  }

  private evaluateThresholds(): void {
    for (const [clusterId, metrics] of this.metrics) {
      const latestMetrics = metrics.slice(-10); // Last 10 metrics

      latestMetrics.forEach((metric) => {
        const threshold = this.thresholds.get(metric.metric_name);
        if (!threshold || !threshold.enabled) return;

        const shouldAlert = this.checkThreshold(metric.metric_value, threshold);
        if (shouldAlert) {
          this.createAlert(metric, threshold, shouldAlert);
        }
      });
    }
  }

  private checkThreshold(
    value: number,
    threshold: PerformanceThreshold,
  ): "warning" | "critical" | null {
    if (threshold.comparison === "greater_than") {
      if (value >= threshold.critical_threshold) return "critical";
      if (value >= threshold.warning_threshold) return "warning";
    } else if (threshold.comparison === "less_than") {
      if (value <= threshold.critical_threshold) return "critical";
      if (value <= threshold.warning_threshold) return "warning";
    }
    return null;
  }

  private createAlert(
    metric: MonitoringMetric,
    threshold: PerformanceThreshold,
    severity: "warning" | "critical",
  ): void {
    const alertId = `alert_${metric.cluster_id}_${metric.metric_name}_${Date.now()}`;

    const alert: MonitoringAlert = {
      id: alertId,
      severity: severity === "critical" ? "critical" : "high",
      type: metric.quantum_enhanced ? "quantum" : "performance",
      title: `${severity.toUpperCase()}: ${metric.metric_name} threshold exceeded`,
      message: `${metric.metric_name} is ${metric.metric_value}${metric.metric_unit}, exceeding ${severity} threshold of ${severity === "critical" ? threshold.critical_threshold : threshold.warning_threshold}${metric.metric_unit}`,
      cluster_id: metric.cluster_id,
      metric_value: metric.metric_value,
      threshold_value:
        severity === "critical"
          ? threshold.critical_threshold
          : threshold.warning_threshold,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.set(alertId, alert);

    // Auto-acknowledge low severity alerts after 5 minutes
    if (alert.severity === "medium" || alert.severity === "low") {
      setTimeout(() => {
        this.acknowledgeAlert(alertId);
      }, 300000);
    }

    console.warn(`Database Alert: ${alert.title} - ${alert.message}`);
  }

  private calculateHealthScores(): void {
    const clusters = databaseArchitecture.getAllClusters();

    clusters.forEach((cluster) => {
      const clusterMetrics = this.metrics.get(cluster.id) || [];
      const recentMetrics = clusterMetrics.slice(-20); // Last 20 metrics

      if (recentMetrics.length === 0) return;

      const healthScore = this.computeHealthScore(cluster, recentMetrics);
      this.healthScores.set(cluster.id, healthScore);
    });
  }

  private computeHealthScore(
    cluster: DatabaseCluster,
    metrics: MonitoringMetric[],
  ): DatabaseHealthScore {
    const metricsByName = new Map<string, number[]>();

    // Group metrics by name
    metrics.forEach((metric) => {
      const values = metricsByName.get(metric.metric_name) || [];
      values.push(metric.metric_value);
      metricsByName.set(metric.metric_name, values);
    });

    // Calculate component scores
    const cpuHealth = this.calculateComponentHealth(
      metricsByName.get("cpu_utilization") || [],
      0,
      100,
      true,
    );
    const memoryHealth = this.calculateComponentHealth(
      metricsByName.get("memory_utilization") || [],
      0,
      100,
      true,
    );
    const diskHealth = this.calculateComponentHealth(
      metricsByName.get("disk_utilization") || [],
      0,
      100,
      true,
    );
    const networkHealth = 100; // Simplified - would need network metrics
    const queryPerformance = this.calculateComponentHealth(
      metricsByName.get("query_latency_p95") || [],
      0,
      5000,
      true,
    );
    const replicationHealth = 95; // Simplified - would need replication lag metrics
    const backupHealth = 98; // Simplified - would need backup status
    const quantumFidelity =
      cluster.type === "quantum_cache"
        ? this.calculateComponentHealth(
            metricsByName.get("quantum_fidelity") || [],
            0.8,
            1.0,
            false,
          )
        : 100;

    const components = {
      cpu_health: cpuHealth,
      memory_health: memoryHealth,
      disk_health: diskHealth,
      network_health: networkHealth,
      query_performance: queryPerformance,
      replication_health: replicationHealth,
      backup_health: backupHealth,
      quantum_fidelity: quantumFidelity,
    };

    // Calculate overall scores
    const performanceScore = (cpuHealth + memoryHealth + queryPerformance) / 3;
    const availabilityScore =
      (networkHealth + replicationHealth + backupHealth) / 3;
    const securityScore = 95; // Simplified - would need security audit results
    const quantumCoherenceScore =
      cluster.type === "quantum_cache" ? quantumFidelity : 100;

    const overallScore =
      (performanceScore +
        availabilityScore +
        securityScore +
        quantumCoherenceScore) /
      4;

    return {
      overall_score: Math.round(overallScore),
      performance_score: Math.round(performanceScore),
      availability_score: Math.round(availabilityScore),
      security_score: Math.round(securityScore),
      quantum_coherence_score: Math.round(quantumCoherenceScore),
      last_calculated: new Date(),
      components,
    };
  }

  private calculateComponentHealth(
    values: number[],
    minValue: number,
    maxValue: number,
    lowerIsBetter: boolean,
  ): number {
    if (values.length === 0) return 100;

    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const normalizedValue = (avgValue - minValue) / (maxValue - minValue);

    if (lowerIsBetter) {
      return Math.max(0, Math.min(100, (1 - normalizedValue) * 100));
    } else {
      return Math.max(0, Math.min(100, normalizedValue * 100));
    }
  }

  private async analyzeQueries(): Promise<void> {
    // Simulate query analysis - in production, this would analyze actual query logs
    const sampleQueries = [
      "SELECT * FROM portfolios WHERE user_id = ?",
      "SELECT * FROM quantum_circuits WHERE num_qubits > ?",
      "INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)",
      "UPDATE portfolios SET total_value = ? WHERE id = ?",
    ];

    sampleQueries.forEach((sql, index) => {
      const queryId = `query_${index + 1}`;
      const analysis: QueryAnalysis = {
        query_id: queryId,
        sql_hash: btoa(sql).substring(0, 16),
        execution_count: Math.floor(Math.random() * 1000) + 100,
        total_time: Math.random() * 10000 + 1000,
        average_time: Math.random() * 100 + 10,
        min_time: Math.random() * 10 + 1,
        max_time: Math.random() * 1000 + 100,
        last_execution: new Date(),
        rows_examined_avg: Math.floor(Math.random() * 10000) + 100,
        rows_returned_avg: Math.floor(Math.random() * 1000) + 10,
        cache_hit_ratio: Math.random() * 0.3 + 0.7,
        optimization_recommendation: this.generateQueryOptimizationTips(sql),
        quantum_optimizable: sql.includes("quantum_"),
      };

      this.queryAnalytics.set(queryId, analysis);
    });
  }

  private generateQueryOptimizationTips(sql: string): string[] {
    const tips: string[] = [];

    if (sql.includes("SELECT *")) {
      tips.push("Avoid SELECT * - specify only required columns");
    }

    if (sql.includes("WHERE") && !sql.includes("INDEX")) {
      tips.push("Consider adding index for WHERE clause columns");
    }

    if (sql.includes("ORDER BY") && !sql.includes("LIMIT")) {
      tips.push("Add LIMIT clause to ORDER BY queries");
    }

    if (sql.includes("quantum_") && !sql.includes("vector")) {
      tips.push("Use vector similarity search for quantum state queries");
    }

    return tips;
  }

  private generateCapacityForecasts(): void {
    const clusters = databaseArchitecture.getAllClusters();

    clusters.forEach((cluster) => {
      // Generate CPU forecast
      const cpuForecast: CapacityForecast = {
        resource_type: "cpu",
        current_usage: cluster.performance.cpu_utilization,
        current_capacity: 100,
        utilization_percentage: cluster.performance.cpu_utilization,
        growth_rate_per_day: Math.random() * 2 + 0.5, // 0.5-2.5% per day
        projected_full_capacity_date: new Date(
          Date.now() +
            ((100 - cluster.performance.cpu_utilization) /
              (Math.random() * 2 + 0.5)) *
              86400000,
        ),
        recommended_scaling_action:
          cluster.performance.cpu_utilization > 70
            ? "Scale up CPU resources"
            : "No action needed",
        confidence_level: 0.85,
      };

      // Store forecast (simplified - would store in database in production)
      console.log(`Capacity forecast for ${cluster.id}:`, cpuForecast);
    });
  }

  private monitorQuantumMetrics(): void {
    // Update quantum metrics with simulated drift
    this.quantumMetrics.fidelity_drift += (Math.random() - 0.5) * 0.001;
    this.quantumMetrics.entanglement_degradation +=
      (Math.random() - 0.5) * 0.002;
    this.quantumMetrics.coherence_time_variance +=
      (Math.random() - 0.5) * 0.005;
    this.quantumMetrics.quantum_error_rate += (Math.random() - 0.5) * 0.0001;

    // Bound values to realistic ranges
    this.quantumMetrics.fidelity_drift = Math.max(
      0,
      Math.min(0.1, this.quantumMetrics.fidelity_drift),
    );
    this.quantumMetrics.entanglement_degradation = Math.max(
      0,
      Math.min(0.2, this.quantumMetrics.entanglement_degradation),
    );
    this.quantumMetrics.coherence_time_variance = Math.max(
      0,
      Math.min(0.5, this.quantumMetrics.coherence_time_variance),
    );
    this.quantumMetrics.quantum_error_rate = Math.max(
      0,
      Math.min(0.01, this.quantumMetrics.quantum_error_rate),
    );

    // Check for quantum degradation alerts
    if (this.quantumMetrics.fidelity_drift > 0.05) {
      this.createQuantumAlert(
        "Quantum fidelity drift detected",
        "high",
        this.quantumMetrics.fidelity_drift,
      );
    }

    if (this.quantumMetrics.entanglement_degradation > 0.1) {
      this.createQuantumAlert(
        "Entanglement degradation detected",
        "medium",
        this.quantumMetrics.entanglement_degradation,
      );
    }
  }

  private createQuantumAlert(
    message: string,
    severity: "critical" | "high" | "medium" | "low",
    value: number,
  ): void {
    const alertId = `quantum_alert_${Date.now()}`;

    const alert: MonitoringAlert = {
      id: alertId,
      severity,
      type: "quantum",
      title: "Quantum System Alert",
      message,
      metric_value: value,
      threshold_value: 0.05,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.set(alertId, alert);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.alerts.set(alertId, alert);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, actionTaken?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolution_time = new Date();
      alert.action_taken = actionTaken;
      this.alerts.set(alertId, alert);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values())
      .filter((alert) => !alert.resolved)
      .sort((a, b) => {
        const severityOrder = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
          info: 0,
        };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Get health score for a cluster
   */
  getClusterHealth(clusterId: string): DatabaseHealthScore | undefined {
    return this.healthScores.get(clusterId);
  }

  /**
   * Get all health scores
   */
  getAllHealthScores(): DatabaseHealthScore[] {
    return Array.from(this.healthScores.values());
  }

  /**
   * Get query analytics
   */
  getQueryAnalytics(): QueryAnalysis[] {
    return Array.from(this.queryAnalytics.values()).sort(
      (a, b) => b.average_time - a.average_time,
    );
  }

  /**
   * Get quantum metrics
   */
  getQuantumMetrics(): QuantumMonitoringMetrics {
    return { ...this.quantumMetrics };
  }

  /**
   * Get metrics for a specific cluster
   */
  getClusterMetrics(
    clusterId: string,
    metricName?: string,
  ): MonitoringMetric[] {
    const metrics = this.metrics.get(clusterId) || [];
    if (metricName) {
      return metrics.filter((m) => m.metric_name === metricName);
    }
    return metrics;
  }

  /**
   * Record security event
   */
  recordSecurityEvent(
    event: Omit<SecurityMonitoringEvent, "id" | "timestamp" | "investigated">,
  ): void {
    const securityEvent: SecurityMonitoringEvent = {
      id: `security_${Date.now()}`,
      timestamp: new Date(),
      investigated: false,
      ...event,
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 1000 security events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, this.securityEvents.length - 1000);
    }

    // Create alert for high severity security events
    if (event.severity === "critical" || event.severity === "high") {
      this.createSecurityAlert(securityEvent);
    }
  }

  private createSecurityAlert(event: SecurityMonitoringEvent): void {
    const alertId = `security_alert_${event.id}`;

    const alert: MonitoringAlert = {
      id: alertId,
      severity: event.severity,
      type: "security",
      title: `Security Event: ${event.event_type}`,
      message: `Security event detected from ${event.ip_address}: ${event.event_type}`,
      metric_value: event.threat_level,
      threshold_value: 5,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.set(alertId, alert);
  }

  /**
   * Get security events
   */
  getSecurityEvents(limit: number = 100): SecurityMonitoringEvent[] {
    return this.securityEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    total_alerts: number;
    active_alerts: number;
    critical_alerts: number;
    clusters_monitored: number;
    metrics_collected: number;
    uptime_percentage: number;
    last_metric_collection: Date;
  } {
    const totalAlerts = this.alerts.size;
    const activeAlerts = this.getActiveAlerts().length;
    const criticalAlerts = this.getActiveAlerts().filter(
      (a) => a.severity === "critical",
    ).length;
    const clustersMonitored = databaseArchitecture.getAllClusters().length;

    let totalMetrics = 0;
    for (const metrics of this.metrics.values()) {
      totalMetrics += metrics.length;
    }

    return {
      total_alerts: totalAlerts,
      active_alerts: activeAlerts,
      critical_alerts: criticalAlerts,
      clusters_monitored: clustersMonitored,
      metrics_collected: totalMetrics,
      uptime_percentage: 99.9, // Simplified calculation
      last_metric_collection: new Date(),
    };
  }
}

// Export singleton instance
export const databaseMonitoring = DatabaseMonitoring.getInstance();
export default DatabaseMonitoring;
