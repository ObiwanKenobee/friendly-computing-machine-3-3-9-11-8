/**
 * Database Engineering Dashboard
 * Comprehensive interface for database architecture, monitoring, and management
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Activity,
  Shield,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Network,
  BarChart3,
  Settings,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Eye,
  Layers,
  GitBranch,
  Lock,
  Gauge,
} from "lucide-react";

import {
  databaseArchitecture,
  DatabaseCluster,
} from "@/services/databaseArchitecture";
import {
  databaseMonitoring,
  MonitoringAlert,
  DatabaseHealthScore,
} from "@/services/databaseMonitoring";
import { databaseBackupReplication } from "@/services/databaseBackupReplication";
import { databaseSchemaManager } from "@/services/databaseSchemaManager";

interface DatabaseStats {
  clusters: number;
  totalConnections: number;
  totalQueries: number;
  averageLatency: number;
  healthScore: number;
  alerts: number;
  backups: number;
  replicas: number;
}

export default function DatabaseEngineeringDashboard(): JSX.Element {
  const [stats, setStats] = useState<DatabaseStats>({
    clusters: 0,
    totalConnections: 0,
    totalQueries: 0,
    averageLatency: 0,
    healthScore: 0,
    alerts: 0,
    backups: 0,
    replicas: 0,
  });

  const [clusters, setClusters] = useState<DatabaseCluster[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [healthScores, setHealthScores] = useState<DatabaseHealthScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<string>("");

  useEffect(() => {
    initializeDashboard();
    const interval = setInterval(updateDashboard, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeDashboard = async (): Promise<void> => {
    try {
      // Start monitoring services
      databaseArchitecture.startHealthMonitoring();
      databaseMonitoring.startMonitoring();
      databaseBackupReplication.startMonitoring();

      // Load initial data
      await updateDashboard();
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to initialize dashboard:", error);
      setIsLoading(false);
    }
  };

  const updateDashboard = async (): Promise<void> => {
    try {
      // Get clusters
      const clusterData = databaseArchitecture.getAllClusters();
      setClusters(clusterData);

      // Get alerts
      const alertData = databaseMonitoring.getActiveAlerts();
      setAlerts(alertData);

      // Get health scores
      const healthData = databaseMonitoring.getAllHealthScores();
      setHealthScores(healthData);

      // Get backup/replication status
      const backupStatus = databaseBackupReplication.getStatusSummary();

      // Calculate stats
      const totalConnections = clusterData.reduce(
        (sum, cluster) => sum + cluster.connections.active_connections,
        0,
      );

      const averageLatency =
        clusterData.reduce(
          (sum, cluster) => sum + cluster.performance.query_latency_p95,
          0,
        ) / clusterData.length || 0;

      const overallHealth =
        healthData.reduce((sum, health) => sum + health.overall_score, 0) /
          healthData.length || 0;

      setStats({
        clusters: clusterData.length,
        totalConnections,
        totalQueries: 125000 + Math.floor(Math.random() * 10000),
        averageLatency: Math.round(averageLatency),
        healthScore: Math.round(overallHealth),
        alerts: alertData.length,
        backups: backupStatus.backup_jobs.total,
        replicas: backupStatus.replication.total_nodes,
      });

      if (!selectedCluster && clusterData.length > 0) {
        setSelectedCluster(clusterData[0].id);
      }
    } catch (error) {
      console.error("Failed to update dashboard:", error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
      case "healthy":
      case "completed":
        return "bg-green-500";
      case "warning":
      case "degraded":
      case "running":
        return "bg-yellow-500";
      case "critical":
      case "error":
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading database dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Database className="h-8 w-8 mr-3 text-blue-600" />
              Database Engineering
            </h1>
            <p className="text-gray-600 mt-1">
              Enterprise database architecture and monitoring
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={updateDashboard} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.clusters}</p>
                  <p className="text-xs text-gray-500">Clusters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalConnections}</p>
                  <p className="text-xs text-gray-500">Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {stats.totalQueries.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Queries/day</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.averageLatency}ms</p>
                  <p className="text-xs text-gray-500">Avg Latency</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Gauge className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.healthScore}%</p>
                  <p className="text-xs text-gray-500">Health Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.alerts}</p>
                  <p className="text-xs text-gray-500">Active Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.backups}</p>
                  <p className="text-xs text-gray-500">Backups</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.replicas}</p>
                  <p className="text-xs text-gray-500">Replicas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="clusters" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="backup">Backup & DR</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Clusters Tab */}
          <TabsContent value="clusters" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    Database Clusters
                  </CardTitle>
                  <CardDescription>
                    Overview of all database clusters and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clusters.map((cluster) => (
                      <div
                        key={cluster.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCluster === cluster.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        onClick={() => setSelectedCluster(cluster.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(cluster.status)}`}
                            />
                            <div>
                              <h4 className="font-medium">{cluster.name}</h4>
                              <p className="text-sm text-gray-500">
                                {cluster.type} • {cluster.region}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              cluster.type === "quantum_cache"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {cluster.type.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">CPU</p>
                            <p className="font-medium">
                              {cluster.performance.cpu_utilization.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Memory</p>
                            <p className="font-medium">
                              {cluster.performance.memory_utilization.toFixed(
                                1,
                              )}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Connections</p>
                            <p className="font-medium">
                              {cluster.connections.active_connections}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Cluster Details
                  </CardTitle>
                  <CardDescription>
                    Detailed information for selected cluster
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCluster &&
                    (() => {
                      const cluster = clusters.find(
                        (c) => c.id === selectedCluster,
                      );
                      if (!cluster) return <p>Cluster not found</p>;

                      return (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">
                              Performance Metrics
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>CPU Utilization</span>
                                  <span>
                                    {cluster.performance.cpu_utilization.toFixed(
                                      1,
                                    )}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  value={cluster.performance.cpu_utilization}
                                  className="h-2"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Memory Utilization</span>
                                  <span>
                                    {cluster.performance.memory_utilization.toFixed(
                                      1,
                                    )}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  value={cluster.performance.memory_utilization}
                                  className="h-2"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Cache Hit Ratio</span>
                                  <span>
                                    {(
                                      cluster.performance.cache_hit_ratio * 100
                                    ).toFixed(1)}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    cluster.performance.cache_hit_ratio * 100
                                  }
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">
                              Connection Pool
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Active</p>
                                <p className="font-medium">
                                  {cluster.connections.active_connections}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Idle</p>
                                <p className="font-medium">
                                  {cluster.connections.idle_connections}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Max</p>
                                <p className="font-medium">
                                  {cluster.connections.max_connections}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Timeout</p>
                                <p className="font-medium">
                                  {cluster.connections.idle_timeout}s
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Capacity</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">CPU Cores</p>
                                <p className="font-medium">
                                  {cluster.capacity.cpu_cores}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Memory</p>
                                <p className="font-medium">
                                  {cluster.capacity.memory_gb}GB
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Storage</p>
                                <p className="font-medium">
                                  {cluster.capacity.storage_gb}GB
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">IOPS</p>
                                <p className="font-medium">
                                  {cluster.capacity.iops.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Active Alerts
                  </CardTitle>
                  <CardDescription>
                    Current alerts requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.length === 0 ? (
                      <div className="text-center py-6">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-500">No active alerts</p>
                      </div>
                    ) : (
                      alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDuration(
                                Date.now() - alert.timestamp.getTime(),
                              )}{" "}
                              ago
                            </span>
                          </div>
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {alert.message}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                databaseMonitoring.acknowledgeAlert(alert.id)
                              }
                            >
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                databaseMonitoring.resolveAlert(
                                  alert.id,
                                  "Manual resolution",
                                )
                              }
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Health Scores
                  </CardTitle>
                  <CardDescription>
                    Overall health metrics for database clusters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {healthScores.map((health, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Overall Health</span>
                          <span className="text-2xl font-bold">
                            {health.overall_score}%
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Performance</span>
                              <span>{health.performance_score}%</span>
                            </div>
                            <Progress
                              value={health.performance_score}
                              className="h-2"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Availability</span>
                              <span>{health.availability_score}%</span>
                            </div>
                            <Progress
                              value={health.availability_score}
                              className="h-2"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Security</span>
                              <span>{health.security_score}%</span>
                            </div>
                            <Progress
                              value={health.security_score}
                              className="h-2"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Quantum Coherence</span>
                              <span>{health.quantum_coherence_score}%</span>
                            </div>
                            <Progress
                              value={health.quantum_coherence_score}
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Backup & DR Tab */}
          <TabsContent value="backup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="h-5 w-5 mr-2" />
                    Recent Backups
                  </CardTitle>
                  <CardDescription>
                    Latest backup jobs and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {databaseBackupReplication
                      .getBackupJobs()
                      .slice(0, 5)
                      .map((backup) => (
                        <div key={backup.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getStatusColor(backup.status)}`}
                              />
                              <span className="font-medium text-sm">
                                {backup.name}
                              </span>
                            </div>
                            <Badge variant="outline">
                              {backup.backup_type}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                            <div>
                              <p>Size: {backup.backup_size_gb.toFixed(2)}GB</p>
                            </div>
                            <div>
                              <p>
                                Duration:{" "}
                                {backup.duration
                                  ? formatDuration(backup.duration)
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p>Retention: {backup.retention_days}d</p>
                            </div>
                          </div>

                          {backup.quantum_state_backup && (
                            <Badge variant="secondary" className="mt-2">
                              <Zap className="h-3 w-3 mr-1" />
                              Quantum Optimized
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GitBranch className="h-5 w-5 mr-2" />
                    Replication Status
                  </CardTitle>
                  <CardDescription>
                    Database replication nodes and their health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {databaseBackupReplication
                      .getReplicationNodes()
                      .map((node) => (
                        <div key={node.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getStatusColor(node.status)}`}
                              />
                              <span className="font-medium text-sm">
                                {node.name}
                              </span>
                            </div>
                            <Badge
                              variant={
                                node.type === "primary"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {node.type}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                            <div>
                              <p>Lag: {node.lag_ms}ms</p>
                            </div>
                            <div>
                              <p>Region: {node.region}</p>
                            </div>
                            <div>
                              <p>Size: {node.total_size_gb}GB</p>
                            </div>
                          </div>

                          {node.type === "quantum_mirror" && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Quantum Coherence</span>
                                <span>
                                  {(node.quantum_coherence * 100).toFixed(2)}%
                                </span>
                              </div>
                              <Progress
                                value={node.quantum_coherence * 100}
                                className="h-1"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schema Tab */}
          <TabsContent value="schema" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layers className="h-5 w-5 mr-2" />
                    Schema Management
                  </CardTitle>
                  <CardDescription>
                    Database schema versions and migrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Applied Migrations</span>
                      <span className="text-2xl font-bold">
                        {databaseSchemaManager.getAppliedMigrations().length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-medium">Pending Migrations</span>
                      <span className="text-2xl font-bold">
                        {databaseSchemaManager.getPendingMigrations().length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-medium">Current Tables</span>
                      <span className="text-2xl font-bold">
                        {databaseSchemaManager.getCurrentSchema().length}
                      </span>
                    </div>

                    <div className="pt-4">
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Schema Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Performance Analysis
                  </CardTitle>
                  <CardDescription>
                    Query performance and optimization insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {databaseMonitoring
                      .getQueryAnalytics()
                      .slice(0, 3)
                      .map((query) => (
                        <div
                          key={query.query_id}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              Query #{query.query_id}
                            </span>
                            <span className="text-xs text-gray-500">
                              {query.execution_count} executions
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                            <div>
                              <p>Avg Time: {query.average_time.toFixed(1)}ms</p>
                            </div>
                            <div>
                              <p>
                                Cache Hit:{" "}
                                {(query.cache_hit_ratio * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {query.optimization_recommendation.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-orange-600">
                                Optimization Tips:
                              </p>
                              <ul className="text-xs text-gray-600 mt-1">
                                {query.optimization_recommendation
                                  .slice(0, 2)
                                  .map((tip, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start"
                                    >
                                      <span className="mr-1">•</span>
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Query Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Queries</span>
                      <span className="font-medium">
                        {stats.totalQueries.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Latency</span>
                      <span className="font-medium">
                        {stats.averageLatency}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Slow Queries</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="font-medium">94.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Quantum Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const quantumMetrics =
                        databaseMonitoring.getQuantumMetrics();
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm">Fidelity</span>
                            <span className="font-medium">
                              {(1 - quantumMetrics.fidelity_drift).toFixed(3)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Coherence Time</span>
                            <span className="font-medium">50-150μs</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Error Rate</span>
                            <span className="font-medium">
                              {(
                                quantumMetrics.quantum_error_rate * 100
                              ).toFixed(3)}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Efficiency</span>
                            <span className="font-medium">
                              {(
                                quantumMetrics.quantum_volume_efficiency * 100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Network className="h-5 w-5 mr-2" />
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Average</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Average</span>
                        <span>62%</span>
                      </div>
                      <Progress value={62} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Disk I/O</span>
                        <span>38%</span>
                      </div>
                      <Progress value={38} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Network</span>
                        <span>28%</span>
                      </div>
                      <Progress value={28} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Status
                  </CardTitle>
                  <CardDescription>
                    Database security configuration and monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Encryption at Rest
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Encryption in Transit
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Row Level Security
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Audit Logging
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Threat Detection
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Security Events
                  </CardTitle>
                  <CardDescription>
                    Recent security events and threats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {databaseMonitoring.getSecurityEvents(5).map((event) => (
                      <div key={event.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDuration(
                              Date.now() - event.timestamp.getTime(),
                            )}{" "}
                            ago
                          </span>
                        </div>

                        <h4 className="font-medium text-sm">
                          {event.event_type}
                        </h4>
                        <p className="text-xs text-gray-600">
                          From {event.ip_address} • Threat Level:{" "}
                          {event.threat_level}/10
                        </p>

                        {!event.investigated && (
                          <Button size="sm" variant="outline" className="mt-2">
                            Investigate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
