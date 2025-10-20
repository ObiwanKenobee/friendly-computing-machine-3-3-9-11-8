/**
 * Backend Development Dashboard
 * Comprehensive backend monitoring and management dashboard for QuantumVest
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Server,
  Database,
  Activity,
  Shield,
  Zap,
  Monitor,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  Network,
  Lock,
  Globe,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  Download,
  Upload,
  Eye,
  Code,
  GitBranch,
  Package,
} from "lucide-react";

interface BackendMetrics {
  services: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  database: {
    connections: {
      active: number;
      idle: number;
      max: number;
      utilization: number;
    };
    performance: {
      queryTime: number;
      throughput: number;
      slowQueries: number;
    };
    storage: {
      used: number;
      total: number;
      growth: number;
    };
  };
  infrastructure: {
    kubernetes: {
      nodes: number;
      pods: number;
      services: number;
      deployments: number;
    };
    resources: {
      cpu: number;
      memory: number;
      storage: number;
      network: number;
    };
  };
  security: {
    threats: number;
    vulnerabilities: number;
    compliance: number;
    incidents: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
}

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  responseTime: number;
  errorRate: number;
  version: string;
  lastDeployment: Date;
  dependencies: string[];
}

const BackendDevelopmentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<BackendMetrics>({
    services: { total: 82, healthy: 78, degraded: 3, unhealthy: 1 },
    database: {
      connections: { active: 45, idle: 15, max: 100, utilization: 60 },
      performance: { queryTime: 25, throughput: 1200, slowQueries: 3 },
      storage: { used: 2.4, total: 10, growth: 12 },
    },
    infrastructure: {
      kubernetes: { nodes: 12, pods: 156, services: 82, deployments: 45 },
      resources: { cpu: 65, memory: 72, storage: 45, network: 38 },
    },
    security: { threats: 2, vulnerabilities: 0, compliance: 98, incidents: 0 },
    performance: {
      responseTime: 185,
      throughput: 850,
      errorRate: 0.12,
      uptime: 99.97,
    },
  });

  const [services, setServices] = useState<ServiceHealth[]>([
    {
      name: "criticalAPIGateway",
      status: "healthy",
      uptime: 99.98,
      responseTime: 125,
      errorRate: 0.05,
      version: "v2.1.0",
      lastDeployment: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dependencies: ["productionDatabaseService", "enterpriseAuthService"],
    },
    {
      name: "quantumAlgebraService",
      status: "healthy",
      uptime: 99.95,
      responseTime: 245,
      errorRate: 0.08,
      version: "v1.5.2",
      lastDeployment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dependencies: ["quantumScheduler", "mlModelService"],
    },
    {
      name: "paymentProcessingService",
      status: "degraded",
      uptime: 99.85,
      responseTime: 420,
      errorRate: 0.25,
      version: "v1.8.1",
      lastDeployment: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dependencies: ["enterpriseAuthService", "auditLogService"],
    },
    {
      name: "enterpriseAuthService",
      status: "healthy",
      uptime: 99.99,
      responseTime: 95,
      errorRate: 0.02,
      version: "v3.2.0",
      lastDeployment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dependencies: ["productionDatabaseService", "mfaService"],
    },
    {
      name: "blockchainService",
      status: "healthy",
      uptime: 99.92,
      responseTime: 165,
      errorRate: 0.15,
      version: "v2.0.1",
      lastDeployment: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      dependencies: ["walletService", "auditLogService"],
    },
  ]);

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      if (isMonitoring) {
        updateMetrics();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const updateMetrics = () => {
    // Simulate real-time metric updates
    setMetrics((prev) => ({
      ...prev,
      database: {
        ...prev.database,
        connections: {
          ...prev.database.connections,
          active: Math.floor(Math.random() * 20) + 40,
          utilization: Math.floor(Math.random() * 20) + 55,
        },
        performance: {
          ...prev.database.performance,
          queryTime: Math.floor(Math.random() * 10) + 20,
          throughput: Math.floor(Math.random() * 200) + 1100,
        },
      },
      performance: {
        ...prev.performance,
        responseTime: Math.floor(Math.random() * 50) + 160,
        throughput: Math.floor(Math.random() * 100) + 800,
        errorRate: Math.random() * 0.2,
      },
    }));

    setLastUpdate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "degraded":
        return "text-yellow-600";
      case "unhealthy":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case "degraded":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>
        );
      case "unhealthy":
        return <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const restartService = (serviceName: string) => {
    console.log(`Restarting service: ${serviceName}`);
    // In a real implementation, this would trigger a service restart
  };

  const deployService = (serviceName: string) => {
    console.log(`Deploying service: ${serviceName}`);
    // In a real implementation, this would trigger a deployment
  };

  const scaleService = (serviceName: string, replicas: number) => {
    console.log(`Scaling service ${serviceName} to ${replicas} replicas`);
    // In a real implementation, this would scale the service
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backend Development Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? "outline" : "default"}
          >
            {isMonitoring ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isMonitoring ? "Pause" : "Resume"} Monitoring
          </Button>
          <Button onClick={updateMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4 text-green-600" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.services.healthy}/{metrics.services.total}
            </div>
            <div className="text-sm text-gray-600">Healthy Services</div>
            <Progress
              value={(metrics.services.healthy / metrics.services.total) * 100}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-blue-600" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.database.connections.utilization}%
            </div>
            <div className="text-sm text-gray-600">Connection Utilization</div>
            <Progress
              value={metrics.database.connections.utilization}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-purple-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.performance.responseTime}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="text-xs text-green-600 mt-1">
              ↓ 15ms from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-orange-600" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.security.compliance}%
            </div>
            <div className="text-sm text-gray-600">Compliance Score</div>
            <div className="text-xs text-green-600 mt-1">
              {metrics.security.incidents === 0
                ? "No incidents"
                : `${metrics.security.incidents} incidents`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Response Time</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {metrics.performance.responseTime}ms
                      </span>
                      <Badge variant="outline" className="text-green-600">
                        ↓ 8%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Throughput</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {metrics.performance.throughput} req/s
                      </span>
                      <Badge variant="outline" className="text-blue-600">
                        ↑ 12%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Error Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {metrics.performance.errorRate.toFixed(2)}%
                      </span>
                      <Badge variant="outline" className="text-green-600">
                        ↓ 5%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Uptime</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {metrics.performance.uptime}%
                      </span>
                      <Badge variant="outline" className="text-green-600">
                        ↑ 0.02%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resource Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>CPU</span>
                      <span>{metrics.infrastructure.resources.cpu}%</span>
                    </div>
                    <Progress
                      value={metrics.infrastructure.resources.cpu}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Memory</span>
                      <span>{metrics.infrastructure.resources.memory}%</span>
                    </div>
                    <Progress
                      value={metrics.infrastructure.resources.memory}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Storage</span>
                      <span>{metrics.infrastructure.resources.storage}%</span>
                    </div>
                    <Progress
                      value={metrics.infrastructure.resources.storage}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Network</span>
                      <span>{metrics.infrastructure.resources.network}%</span>
                    </div>
                    <Progress
                      value={metrics.infrastructure.resources.network}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Payment Service Degraded:</strong> Response time
                    increased to 420ms (threshold: 300ms)
                  </AlertDescription>
                </Alert>
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Database Backup Completed:</strong> Daily backup
                    finished successfully at 02:00 UTC
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Service Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-semibold">
                            {service.name}
                          </code>
                          {getStatusBadge(service.status)}
                          <Badge variant="outline">{service.version}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Uptime: {service.uptime}% | Response:{" "}
                          {service.responseTime}ms | Errors: {service.errorRate}
                          %
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restartService(service.name)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Restart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deployService(service.name)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Deploy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => scaleService(service.name, 3)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Scale
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Active</span>
                    <span className="font-mono">
                      {metrics.database.connections.active}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Idle</span>
                    <span className="font-mono">
                      {metrics.database.connections.idle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max</span>
                    <span className="font-mono">
                      {metrics.database.connections.max}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Utilization</span>
                    <span className="font-mono">
                      {metrics.database.connections.utilization}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Avg Query Time</span>
                    <span className="font-mono">
                      {metrics.database.performance.queryTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Throughput</span>
                    <span className="font-mono">
                      {metrics.database.performance.throughput} q/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slow Queries</span>
                    <span className="font-mono">
                      {metrics.database.performance.slowQueries}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Used</span>
                    <span className="font-mono">
                      {metrics.database.storage.used} GB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-mono">
                      {metrics.database.storage.total} GB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth Rate</span>
                    <span className="font-mono">
                      {metrics.database.storage.growth}%/month
                    </span>
                  </div>
                  <Progress
                    value={
                      (metrics.database.storage.used /
                        metrics.database.storage.total) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Kubernetes Cluster
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.infrastructure.kubernetes.nodes}
                    </div>
                    <div className="text-sm text-gray-600">Nodes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.infrastructure.kubernetes.pods}
                    </div>
                    <div className="text-sm text-gray-600">Pods</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.infrastructure.kubernetes.services}
                    </div>
                    <div className="text-sm text-gray-600">Services</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {metrics.infrastructure.kubernetes.deployments}
                    </div>
                    <div className="text-sm text-gray-600">Deployments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Node Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="h-4 w-4" />
                      <span>CPU Usage</span>
                      <span className="ml-auto">
                        {metrics.infrastructure.resources.cpu}%
                      </span>
                    </div>
                    <Progress
                      value={metrics.infrastructure.resources.cpu}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="h-4 w-4" />
                      <span>Memory Usage</span>
                      <span className="ml-auto">
                        {metrics.infrastructure.resources.memory}%
                      </span>
                    </div>
                    <Progress
                      value={metrics.infrastructure.resources.memory}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="h-4 w-4" />
                      <span>Network I/O</span>
                      <span className="ml-auto">
                        {metrics.infrastructure.resources.network}%
                      </span>
                    </div>
                    <Progress
                      value={metrics.infrastructure.resources.network}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-red-600" />
                  Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.security.threats}
                </div>
                <div className="text-sm text-gray-600">Active Threats</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Vulnerabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.security.vulnerabilities}
                </div>
                <div className="text-sm text-gray-600">
                  Open Vulnerabilities
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.security.compliance}%
                </div>
                <div className="text-sm text-gray-600">Compliance Score</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.security.incidents}
                </div>
                <div className="text-sm text-gray-600">Security Incidents</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Deployment Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-semibold">Build Stage</div>
                      <div className="text-sm text-gray-600">
                        All services built successfully
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Completed
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-semibold">Test Stage</div>
                      <div className="text-sm text-gray-600">
                        All tests passed (1,247 tests)
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Completed
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                    <div>
                      <div className="font-semibold">Deploy Stage</div>
                      <div className="text-sm text-gray-600">
                        Rolling deployment in progress
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    In Progress
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackendDevelopmentDashboard;
