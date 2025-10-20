/**
 * Critical Frontend Performance Optimization System
 * Comprehensive performance monitoring and optimization for QuantumVest
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Zap,
  Activity,
  Gauge,
  Wifi,
  HardDrive,
  Cpu,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface PerformanceMetrics {
  coreWebVitals: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
  resourceMetrics: {
    jsSize: number;
    cssSize: number;
    imageSize: number;
    totalSize: number;
  };
  networkMetrics: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  memoryMetrics: {
    used: number;
    total: number;
    percentage: number;
  };
  bundleMetrics: {
    chunkCount: number;
    lazyLoaded: number;
    totalComponents: number;
  };
}

interface OptimizationSuggestion {
  type: "critical" | "warning" | "info";
  category: "performance" | "security" | "accessibility" | "seo";
  title: string;
  description: string;
  action: () => void;
  impact: "high" | "medium" | "low";
}

const CriticalPerformanceOptimizer: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationScore, setOptimizationScore] = useState(0);

  // Collect performance metrics
  const collectMetrics = useCallback(async () => {
    try {
      // Core Web Vitals
      const coreWebVitals = await getCoreWebVitals();

      // Resource metrics
      const resourceMetrics = getResourceMetrics();

      // Network metrics
      const networkMetrics = getNetworkMetrics();

      // Memory metrics
      const memoryMetrics = getMemoryMetrics();

      // Bundle metrics
      const bundleMetrics = getBundleMetrics();

      const newMetrics: PerformanceMetrics = {
        coreWebVitals,
        resourceMetrics,
        networkMetrics,
        memoryMetrics,
        bundleMetrics,
      };

      setMetrics(newMetrics);
      generateOptimizationSuggestions(newMetrics);
      calculateOptimizationScore(newMetrics);
    } catch (error) {
      console.error("Failed to collect performance metrics:", error);
    }
  }, []);

  // Get Core Web Vitals
  const getCoreWebVitals = (): Promise<PerformanceMetrics["coreWebVitals"]> => {
    return new Promise((resolve) => {
      let fcp = 0;
      let lcp = 0;
      let fid = 0;
      let cls = 0;

      // First Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        fcp = entries[0]?.startTime || 0;
      }).observe({ entryTypes: ["paint"] });

      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        lcp = entries[entries.length - 1]?.startTime || 0;
      }).observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        fid = entries[0]?.processingStart - entries[0]?.startTime || 0;
      }).observe({ entryTypes: ["first-input"] });

      // Cumulative Layout Shift
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        cls = entries.reduce((sum, entry) => sum + entry.value, 0);
      }).observe({ entryTypes: ["layout-shift"] });

      setTimeout(() => resolve({ fcp, lcp, fid, cls }), 3000);
    });
  };

  // Get resource metrics
  const getResourceMetrics = (): PerformanceMetrics["resourceMetrics"] => {
    const resources = performance.getEntriesByType("resource");

    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;

    resources.forEach((resource: any) => {
      const size = resource.transferSize || 0;

      if (resource.name.includes(".js")) {
        jsSize += size;
      } else if (resource.name.includes(".css")) {
        cssSize += size;
      } else if (
        resource.name.includes(".png") ||
        resource.name.includes(".jpg") ||
        resource.name.includes(".svg")
      ) {
        imageSize += size;
      }
    });

    return {
      jsSize,
      cssSize,
      imageSize,
      totalSize: jsSize + cssSize + imageSize,
    };
  };

  // Get network metrics
  const getNetworkMetrics = (): PerformanceMetrics["networkMetrics"] => {
    const connection = (navigator as any)?.connection || {};
    return {
      effectiveType: connection.effectiveType || "unknown",
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
    };
  };

  // Get memory metrics
  const getMemoryMetrics = (): PerformanceMetrics["memoryMetrics"] => {
    const memory = (performance as any)?.memory;
    if (!memory) {
      return { used: 0, total: 0, percentage: 0 };
    }

    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  };

  // Get bundle metrics
  const getBundleMetrics = (): PerformanceMetrics["bundleMetrics"] => {
    // Estimate based on script tags and dynamic imports
    const scripts = document.querySelectorAll("script[src]");
    const componentCount = document.querySelectorAll("[data-component]").length;

    return {
      chunkCount: scripts.length,
      lazyLoaded: Math.floor(scripts.length * 0.6), // Estimated
      totalComponents: componentCount || 50, // Fallback estimate
    };
  };

  // Generate optimization suggestions
  const generateOptimizationSuggestions = (metrics: PerformanceMetrics) => {
    const newSuggestions: OptimizationSuggestion[] = [];

    // Performance suggestions
    if (metrics.coreWebVitals.lcp > 2500) {
      newSuggestions.push({
        type: "critical",
        category: "performance",
        title: "Slow Largest Contentful Paint",
        description: `LCP is ${metrics.coreWebVitals.lcp}ms (target: <2.5s)`,
        action: () => optimizeLCP(),
        impact: "high",
      });
    }

    if (metrics.resourceMetrics.totalSize > 1024 * 1024) {
      newSuggestions.push({
        type: "warning",
        category: "performance",
        title: "Large Bundle Size",
        description: `Total size: ${(metrics.resourceMetrics.totalSize / 1024 / 1024).toFixed(2)}MB`,
        action: () => optimizeBundleSize(),
        impact: "high",
      });
    }

    if (metrics.memoryMetrics.percentage > 80) {
      newSuggestions.push({
        type: "critical",
        category: "performance",
        title: "High Memory Usage",
        description: `Memory usage at ${metrics.memoryMetrics.percentage.toFixed(1)}%`,
        action: () => optimizeMemoryUsage(),
        impact: "medium",
      });
    }

    if (
      metrics.networkMetrics.effectiveType === "slow-2g" ||
      metrics.networkMetrics.effectiveType === "2g"
    ) {
      newSuggestions.push({
        type: "warning",
        category: "performance",
        title: "Slow Network Connection",
        description: "Enable data saver mode for better experience",
        action: () => enableDataSaverMode(),
        impact: "high",
      });
    }

    // Security suggestions
    newSuggestions.push({
      type: "info",
      category: "security",
      title: "Enable Content Security Policy",
      description: "Add CSP headers for better security",
      action: () => configureCSP(),
      impact: "medium",
    });

    // Accessibility suggestions
    newSuggestions.push({
      type: "info",
      category: "accessibility",
      title: "Improve Color Contrast",
      description: "Ensure WCAG AA compliance",
      action: () => improveContrast(),
      impact: "low",
    });

    setSuggestions(newSuggestions);
  };

  // Calculate optimization score
  const calculateOptimizationScore = (metrics: PerformanceMetrics) => {
    let score = 100;

    // LCP scoring
    if (metrics.coreWebVitals.lcp > 4000) score -= 30;
    else if (metrics.coreWebVitals.lcp > 2500) score -= 15;

    // FCP scoring
    if (metrics.coreWebVitals.fcp > 3000) score -= 20;
    else if (metrics.coreWebVitals.fcp > 1800) score -= 10;

    // CLS scoring
    if (metrics.coreWebVitals.cls > 0.25) score -= 25;
    else if (metrics.coreWebVitals.cls > 0.1) score -= 10;

    // Bundle size scoring
    if (metrics.resourceMetrics.totalSize > 2 * 1024 * 1024) score -= 20;
    else if (metrics.resourceMetrics.totalSize > 1024 * 1024) score -= 10;

    // Memory scoring
    if (metrics.memoryMetrics.percentage > 90) score -= 15;
    else if (metrics.memoryMetrics.percentage > 80) score -= 8;

    setOptimizationScore(Math.max(0, score));
  };

  // Optimization actions
  const optimizeLCP = () => {
    // Preload critical resources
    const criticalImages = document.querySelectorAll("img[data-critical]");
    criticalImages.forEach((img) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = img.getAttribute("src") || "";
      document.head.appendChild(link);
    });
  };

  const optimizeBundleSize = () => {
    // Lazy load non-critical components
    const nonCriticalComponents = document.querySelectorAll("[data-lazy]");
    nonCriticalComponents.forEach((component) => {
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Load component
              observer.unobserve(entry.target);
            }
          });
        });
        observer.observe(component);
      }
    });
  };

  const optimizeMemoryUsage = () => {
    // Clear unnecessary data
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        // Cleanup operations
        const unusedElements = document.querySelectorAll("[data-cleanup]");
        unusedElements.forEach((el) => el.remove());
      });
    }
  };

  const enableDataSaverMode = () => {
    // Enable data saver optimizations
    document.body.classList.add("data-saver-mode");

    // Disable animations
    document.body.style.setProperty("--animation-duration", "0s");

    // Reduce image quality
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      const src = img.src;
      if (src.includes("w_")) {
        img.src = src.replace(/w_\d+/, "w_400"); // Reduce image width
      }
    });
  };

  const configureCSP = () => {
    console.log("CSP configuration recommended for production deployment");
  };

  const improveContrast = () => {
    // Apply high contrast theme
    document.body.classList.add("high-contrast");
  };

  // Auto-optimization
  const runAutoOptimization = async () => {
    setIsOptimizing(true);

    try {
      // Run critical optimizations
      await optimizeLCP();
      await optimizeBundleSize();

      // Recheck metrics
      setTimeout(() => {
        collectMetrics();
        setIsOptimizing(false);
      }, 2000);
    } catch (error) {
      console.error("Auto-optimization failed:", error);
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    collectMetrics();

    // Set up periodic monitoring
    const interval = setInterval(collectMetrics, 30000);
    return () => clearInterval(interval);
  }, [collectMetrics]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Collecting performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold">
              <span className={getScoreColor(optimizationScore)}>
                {optimizationScore}
              </span>
              <span className="text-gray-400">/100</span>
            </div>
            <Badge variant={getScoreBadgeVariant(optimizationScore)}>
              {optimizationScore >= 90
                ? "Excellent"
                : optimizationScore >= 70
                  ? "Good"
                  : "Needs Improvement"}
            </Badge>
          </div>
          <Progress value={optimizationScore} className="h-3" />

          <div className="mt-4 flex gap-2">
            <Button onClick={collectMetrics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Metrics
            </Button>
            <Button
              onClick={runAutoOptimization}
              disabled={isOptimizing}
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isOptimizing ? "Optimizing..." : "Auto-Optimize"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(metrics.coreWebVitals.fcp / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-gray-600">FCP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(metrics.coreWebVitals.lcp / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-gray-600">LCP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.coreWebVitals.fid.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">FID</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.coreWebVitals.cls.toFixed(3)}
              </div>
              <div className="text-sm text-gray-600">CLS</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Resource Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>JavaScript</span>
              <span className="font-mono">
                {(metrics.resourceMetrics.jsSize / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex justify-between">
              <span>CSS</span>
              <span className="font-mono">
                {(metrics.resourceMetrics.cssSize / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex justify-between">
              <span>Images</span>
              <span className="font-mono">
                {(metrics.resourceMetrics.imageSize / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total</span>
              <span className="font-mono">
                {(metrics.resourceMetrics.totalSize / 1024 / 1024).toFixed(2)}{" "}
                MB
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Alert
                key={index}
                className={
                  suggestion.type === "critical"
                    ? "border-red-200 bg-red-50"
                    : suggestion.type === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-blue-200 bg-blue-50"
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {suggestion.type === "critical" && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      {suggestion.type === "warning" && (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      {suggestion.type === "info" && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="font-semibold">{suggestion.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.impact} impact
                      </Badge>
                    </div>
                    <AlertDescription>
                      {suggestion.description}
                    </AlertDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={suggestion.action}
                    className="ml-2"
                  >
                    Fix
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriticalPerformanceOptimizer;
