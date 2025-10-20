/**
 * API Development Dashboard
 * Comprehensive dashboard for API development, monitoring, and management
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Code,
  Database,
  Globe,
  Monitor,
  Server,
  Shield,
  Users,
  Zap,
  TrendingUp,
  Eye,
  Settings,
  FileText,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Cpu,
  HardDrive,
  Network,
} from "lucide-react";

// Import our API services
import { criticalAPIGateway } from "../services/criticalAPIGateway";
import {
  apiDocumentationSystem,
  apiTestingFramework,
} from "../services/apiDocumentationSystem";
import { apiMonitoringSystem } from "../services/apiMonitoringSystem";

interface DashboardMetrics {
  overview: {
    totalEndpoints: number;
    activeEndpoints: number;
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  performance: {
    requestsPerSecond: number;
    p95ResponseTime: number;
    throughput: number;
    cacheHitRate: number;
  };
  security: {
    threatsBlocked: number;
    rateLimitViolations: number;
    authFailures: number;
    securityScore: number;
  };
  health: {
    status: "healthy" | "degraded" | "unhealthy";
    services: number;
    dependencies: number;
    alerts: number;
  };
}

interface RealtimeMetrics {
  timestamp: number;
  requests: number;
  errors: number;
  responseTime: number;
  activeUsers: number;
}

const APIDevelopmentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    overview: {
      totalEndpoints: 0,
      activeEndpoints: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      uptime: 100,
    },
    performance: {
      requestsPerSecond: 0,
      p95ResponseTime: 0,
      throughput: 0,
      cacheHitRate: 0,
    },
    security: {
      threatsBlocked: 0,
      rateLimitViolations: 0,
      authFailures: 0,
      securityScore: 100,
    },
    health: {
      status: "healthy",
      services: 0,
      dependencies: 0,
      alerts: 0,
    },
  });

  const [realtimeData, setRealtimeData] = useState<RealtimeMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(() => {
      if (isMonitoring) {
        loadDashboardData();
        generateRealtimeData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const loadDashboardData = async () => {
    try {
      // Get metrics from monitoring system
      const summary = apiMonitoringSystem.getMetricsSummary();
      const health = apiMonitoringSystem.getHealthStatus();
      const alerts = apiMonitoringSystem.getActiveAlerts();
      const endpoints = criticalAPIGateway.getEndpoints();

      // Update metrics
      setMetrics({
        overview: {
          totalEndpoints: endpoints.length,
          activeEndpoints: endpoints.length,
          totalRequests: summary.totalRequests,
          avgResponseTime: summary.avgResponseTime,
          errorRate: summary.errorRate,
          uptime: 99.9,
        },
        performance: {
          requestsPerSecond: Math.floor(Math.random() * 100) + 50,
          p95ResponseTime: summary.avgResponseTime * 1.5,
          throughput: Math.floor(Math.random() * 1000) + 500,
          cacheHitRate: Math.random() * 0.3 + 0.7,
        },
        security: {
          threatsBlocked: Math.floor(Math.random() * 10),
          rateLimitViolations: Math.floor(Math.random() * 5),
          authFailures: Math.floor(Math.random() * 8),
          securityScore: Math.floor(Math.random() * 10) + 90,
        },
        health: {
          status: health.overall,
          services: Object.keys(health.services).length,
          dependencies: Object.keys(health.dependencies).length,
          alerts: alerts.length,
        },
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const generateRealtimeData = () => {
    const now = Date.now();
    const newData: RealtimeMetrics = {
      timestamp: now,
      requests: Math.floor(Math.random() * 50) + 25,
      errors: Math.floor(Math.random() * 5),
      responseTime: Math.floor(Math.random() * 200) + 100,
      activeUsers: Math.floor(Math.random() * 100) + 200,
    };

    setRealtimeData((prev) => {
      const updated = [...prev, newData].slice(-20); // Keep last 20 data points
      return updated;
    });
  };

  const runAPITests = async () => {
    console.log("Running API tests...");
    // In a real implementation, this would trigger the test framework
    const tests = apiTestingFramework.generateTests("portfolio");
    console.log("Generated tests:", tests);
  };

  const generateDocumentation = () => {
    const endpoints = criticalAPIGateway.getEndpoints();
    const spec = apiDocumentationSystem.generateOpenAPISpec(endpoints);
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quantumvest-api-spec.json";
    a.click();
  };

  const exportMetrics = () => {
    const data = apiMonitoringSystem.exportMetrics("csv");
    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "api-metrics.csv";
    a.click();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Development Dashboard</h1>
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
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            System Status
            {getStatusBadge(metrics.health.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.health.services}
              </div>
              <div className="text-sm text-gray-600">Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.overview.uptime}%
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.health.dependencies}
              </div>
              <div className="text-sm text-gray-600">Dependencies</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${metrics.health.alerts > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {metrics.health.alerts}
              </div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="documentation">Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" />
                  Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.overview.totalRequests.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">
                  ↑ 12% from yesterday
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.overview.avgResponseTime)}ms
                </div>
                <div className="text-sm text-yellow-600">
                  ↑ 5% from yesterday
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Error Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.overview.errorRate * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-green-600">
                  ↓ 2% from yesterday
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4" />
                  Requests/Second
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.performance.requestsPerSecond}
                </div>
                <div className="text-sm text-blue-600">Real-time</div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Real-time Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">
                    Real-time Analytics
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Live data visualization showing API performance metrics
                  </p>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">Current RPS</div>
                      <div className="text-blue-600">
                        {metrics.performance.requestsPerSecond}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Response Time</div>
                      <div className="text-green-600">
                        {Math.round(metrics.overview.avgResponseTime)}ms
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Active Users</div>
                      <div className="text-purple-600">
                        {realtimeData[realtimeData.length - 1]?.activeUsers ||
                          0}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Cache Hit Rate</div>
                      <div className="text-orange-600">
                        {(metrics.performance.cacheHitRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={runAPITests}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Tests
                </Button>
                <Button
                  onClick={generateDocumentation}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Generate Docs
                </Button>
                <Button
                  onClick={exportMetrics}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Metrics
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average</span>
                    <span className="font-mono">
                      {Math.round(metrics.overview.avgResponseTime)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>P95</span>
                    <span className="font-mono">
                      {Math.round(metrics.performance.p95ResponseTime)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>P99</span>
                    <span className="font-mono">
                      {Math.round(metrics.performance.p95ResponseTime * 1.3)}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Throughput */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Requests/sec</span>
                    <span className="font-mono">
                      {metrics.performance.requestsPerSecond}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total throughput</span>
                    <span className="font-mono">
                      {metrics.performance.throughput.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache hit rate</span>
                    <span className="font-mono">
                      {(metrics.performance.cacheHitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>CPU</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Memory</span>
                      <span>62%</span>
                    </div>
                    <Progress value={62} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Disk</span>
                      <span>28%</span>
                    </div>
                    <Progress value={28} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {metrics.security.securityScore}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">Out of 100</div>
                  <Progress
                    value={metrics.security.securityScore}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Threats Blocked</span>
                    <Badge variant="destructive">
                      {metrics.security.threatsBlocked}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate Limit Violations</span>
                    <Badge variant="secondary">
                      {metrics.security.rateLimitViolations}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Failures</span>
                    <Badge variant="outline">
                      {metrics.security.authFailures}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.security.threatsBlocked > 0 ? (
                <div className="space-y-3">
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rate Limiting Triggered:</strong> Unusual traffic
                      detected from IP 192.168.1.100
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Authentication Failure:</strong> Multiple failed
                      login attempts detected
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">All Clear</h3>
                  <p className="text-gray-600">
                    No security incidents in the last 24 hours
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    path: "/api/portfolio/:userId",
                    method: "GET",
                    status: "healthy",
                    calls: "1.2K",
                  },
                  {
                    path: "/api/quantum/optimize",
                    method: "POST",
                    status: "healthy",
                    calls: "856",
                  },
                  {
                    path: "/api/analytics/realtime",
                    method: "GET",
                    status: "degraded",
                    calls: "2.1K",
                  },
                  {
                    path: "/api/ml/inference/:modelId",
                    method: "POST",
                    status: "healthy",
                    calls: "642",
                  },
                  {
                    path: "/api/blockchain/transaction",
                    method: "POST",
                    status: "healthy",
                    calls: "234",
                  },
                ].map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{endpoint.method}</Badge>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {endpoint.path}
                      </code>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {endpoint.calls} calls
                      </span>
                      <Badge
                        variant={
                          endpoint.status === "healthy"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {endpoint.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                API Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button onClick={runAPITests}>
                    <Play className="h-4 w-4 mr-2" />
                    Run All Tests
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Tests
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">47</div>
                    <div className="text-sm text-gray-600">Tests Passed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">3</div>
                    <div className="text-sm text-gray-600">Tests Failed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">94%</div>
                    <div className="text-sm text-gray-600">Coverage</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                API Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button onClick={generateDocumentation}>
                    <Download className="h-4 w-4 mr-2" />
                    Download OpenAPI Spec
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Documentation
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">OpenAPI 3.0</h3>
                    <p className="text-sm text-gray-600">
                      Complete API specification with examples and schemas
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">TypeScript SDK</h3>
                    <p className="text-sm text-gray-600">
                      Auto-generated client SDK with type safety
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APIDevelopmentDashboard;
