/**
 * Enhanced Mobile Experience System
 * Advanced mobile optimizations and responsive design for QuantumVest
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  WifiOff,
  Battery,
  Sun,
  Moon,
  Zap,
  Settings,
  Download,
  Upload,
  Signal,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Vibrate,
} from "lucide-react";

interface MobileMetrics {
  deviceType: "mobile" | "tablet" | "desktop";
  orientation: "portrait" | "landscape";
  screenSize: { width: number; height: number };
  touchSupport: boolean;
  networkStatus: "online" | "offline" | "slow";
  connectionType: string;
  batteryLevel?: number;
  isCharging?: boolean;
  deviceMemory?: number;
  pixelRatio: number;
}

interface MobileOptimizations {
  dataSaver: boolean;
  reducedMotion: boolean;
  darkMode: boolean;
  fontSize: number;
  touchOptimized: boolean;
  offlineMode: boolean;
  priorityLoading: boolean;
  gestureNavigation: boolean;
  hapticFeedback: boolean;
  smartZoom: boolean;
}

const EnhancedMobileExperience: React.FC = () => {
  const [metrics, setMetrics] = useState<MobileMetrics | null>(null);
  const [optimizations, setOptimizations] = useState<MobileOptimizations>({
    dataSaver: false,
    reducedMotion: false,
    darkMode: false,
    fontSize: 16,
    touchOptimized: true,
    offlineMode: false,
    priorityLoading: true,
    gestureNavigation: true,
    hapticFeedback: true,
    smartZoom: false,
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState<number>(0);

  // Collect mobile device metrics
  const collectMobileMetrics = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const deviceType: MobileMetrics["deviceType"] =
      width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";

    const orientation: MobileMetrics["orientation"] =
      width > height ? "landscape" : "portrait";

    const touchSupport =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    const networkStatus: MobileMetrics["networkStatus"] = navigator.onLine
      ? getConnectionQuality()
      : "offline";

    const connection = (navigator as any)?.connection;
    const connectionType = connection?.effectiveType || "unknown";

    const pixelRatio = window.devicePixelRatio || 1;

    // Battery API (experimental)
    let batteryLevel: number | undefined;
    let isCharging: boolean | undefined;
    let deviceMemory: number | undefined;

    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryLevel = battery.level * 100;
        isCharging = battery.charging;
      });
    }

    // Device Memory API (experimental)
    if ("deviceMemory" in navigator) {
      deviceMemory = (navigator as any).deviceMemory;
    }

    setMetrics({
      deviceType,
      orientation,
      screenSize: { width, height },
      touchSupport,
      networkStatus,
      connectionType,
      batteryLevel,
      isCharging,
      deviceMemory,
      pixelRatio,
    });
  }, []);

  // Determine connection quality
  const getConnectionQuality = (): "online" | "slow" => {
    const connection = (navigator as any)?.connection;
    if (!connection) return "online";

    const slowTypes = ["slow-2g", "2g"];
    return slowTypes.includes(connection.effectiveType) ? "slow" : "online";
  };

  // Measure network speed
  const measureNetworkSpeed = useCallback(async () => {
    const startTime = Date.now();
    try {
      // Load a small test resource
      await fetch("/favicon.ico");
      const endTime = Date.now();
      const speed = 1000 / (endTime - startTime); // Rough speed calculation
      setNetworkSpeed(speed);
    } catch (error) {
      setNetworkSpeed(0);
    }
  }, []);

  // Apply mobile optimizations
  const applyOptimization = (key: keyof MobileOptimizations, value: any) => {
    setOptimizations((prev) => ({ ...prev, [key]: value }));

    switch (key) {
      case "dataSaver":
        applyDataSaverMode(value);
        break;
      case "reducedMotion":
        applyReducedMotion(value);
        break;
      case "darkMode":
        applyDarkMode(value);
        break;
      case "fontSize":
        applyFontSize(value);
        break;
      case "touchOptimized":
        applyTouchOptimizations(value);
        break;
      case "offlineMode":
        applyOfflineMode(value);
        break;
      case "priorityLoading":
        applyPriorityLoading(value);
        break;
      case "gestureNavigation":
        applyGestureNavigation(value);
        break;
      case "hapticFeedback":
        applyHapticFeedback(value);
        break;
      case "smartZoom":
        applySmartZoom(value);
        break;
    }
  };

  // Optimization implementations
  const applyDataSaverMode = (enabled: boolean) => {
    const body = document.body;
    if (enabled) {
      body.classList.add("data-saver-mode");
      // Reduce image quality
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        if (img.src && !img.dataset.originalSrc) {
          img.dataset.originalSrc = img.src;
          // Reduce image quality for data saving
          if (img.src.includes("w_")) {
            img.src = img.src.replace(/w_\d+/, "w_300");
          }
        }
      });
    } else {
      body.classList.remove("data-saver-mode");
      // Restore original images
      const images = document.querySelectorAll("img[data-original-src]");
      images.forEach((img) => {
        if (img.dataset.originalSrc) {
          img.src = img.dataset.originalSrc;
          delete img.dataset.originalSrc;
        }
      });
    }
  };

  const applyReducedMotion = (enabled: boolean) => {
    const root = document.documentElement;
    if (enabled) {
      root.style.setProperty("--animation-duration", "0.01s");
      root.style.setProperty("--transition-duration", "0.01s");
    } else {
      root.style.removeProperty("--animation-duration");
      root.style.removeProperty("--transition-duration");
    }
  };

  const applyDarkMode = (enabled: boolean) => {
    document.documentElement.classList.toggle("dark", enabled);
  };

  const applyFontSize = (size: number) => {
    document.documentElement.style.fontSize = `${size}px`;
  };

  const applyTouchOptimizations = (enabled: boolean) => {
    const body = document.body;
    if (enabled) {
      body.classList.add("touch-optimized");
      // Increase touch target sizes
      const style = document.createElement("style");
      style.textContent = `
        .touch-optimized button,
        .touch-optimized a,
        .touch-optimized input,
        .touch-optimized select {
          min-height: 44px;
          min-width: 44px;
          padding: 12px;
        }
        .touch-optimized {
          touch-action: manipulation;
          -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
      `;
      document.head.appendChild(style);
    } else {
      body.classList.remove("touch-optimized");
    }
  };

  const applyOfflineMode = (enabled: boolean) => {
    if (enabled) {
      // Enable service worker for offline caching
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js");
      }
    }
  };

  const applyPriorityLoading = (enabled: boolean) => {
    if (enabled) {
      // Lazy load non-critical content
      const images = document.querySelectorAll("img[data-src]");
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || "";
            observer.unobserve(img);
          }
        });
      });
      images.forEach((img) => observer.observe(img));
    }
  };

  const applyGestureNavigation = (enabled: boolean) => {
    if (enabled) {
      // Add swipe navigation
      let startX = 0;
      let startY = 0;

      const handleTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (!startX || !startY) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;

        const deltaX = endX - startX;
        const deltaY = endY - startY;

        // Swipe detection
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            // Swipe right - go back
            window.history.back();
          } else {
            // Swipe left - go forward
            window.history.forward();
          }
        }
      };

      document.addEventListener("touchstart", handleTouchStart);
      document.addEventListener("touchend", handleTouchEnd);
    }
  };

  const applyHapticFeedback = (enabled: boolean) => {
    if (enabled && "vibrate" in navigator) {
      // Add haptic feedback to buttons
      const buttons = document.querySelectorAll("button");
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          navigator.vibrate(10); // Light haptic feedback
        });
      });
    }
  };

  const applySmartZoom = (enabled: boolean) => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (enabled) {
      viewport?.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=3, user-scalable=yes",
      );
    } else {
      viewport?.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      );
    }
  };

  // Auto-optimize based on device metrics
  const autoOptimizeForDevice = useCallback(() => {
    if (!metrics) return;

    setIsOptimizing(true);

    const newOptimizations: Partial<MobileOptimizations> = {};

    // Auto-enable data saver on slow connections
    if (metrics.networkStatus === "slow" || networkSpeed < 1) {
      newOptimizations.dataSaver = true;
    }

    // Auto-enable reduced motion on low-end devices
    if (metrics.deviceMemory && metrics.deviceMemory < 4) {
      newOptimizations.reducedMotion = true;
    }

    // Auto-enable dark mode based on battery level
    if (
      metrics.batteryLevel &&
      metrics.batteryLevel < 20 &&
      !metrics.isCharging
    ) {
      newOptimizations.darkMode = true;
    }

    // Auto-adjust font size based on screen size
    if (metrics.deviceType === "mobile") {
      newOptimizations.fontSize = 14;
      newOptimizations.touchOptimized = true;
    } else if (metrics.deviceType === "tablet") {
      newOptimizations.fontSize = 16;
    }

    // Auto-enable offline mode on poor connectivity
    if (
      metrics.networkStatus === "offline" ||
      metrics.networkStatus === "slow"
    ) {
      newOptimizations.offlineMode = true;
    }

    setOptimizations((prev) => ({ ...prev, ...newOptimizations }));

    // Apply optimizations
    Object.entries(newOptimizations).forEach(([key, value]) => {
      applyOptimization(key as keyof MobileOptimizations, value);
    });

    setTimeout(() => setIsOptimizing(false), 1000);
  }, [metrics, networkSpeed]);

  // PWA Installation
  const installPWA = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // Show PWA install prompt
        const event = new CustomEvent("beforeinstallprompt");
        window.dispatchEvent(event);
      });
    }
  };

  useEffect(() => {
    collectMobileMetrics();
    measureNetworkSpeed();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(collectMobileMetrics, 100);
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", collectMobileMetrics);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", collectMobileMetrics);
    };
  }, [collectMobileMetrics, measureNetworkSpeed]);

  const getDeviceIcon = () => {
    if (!metrics) return <Smartphone className="h-5 w-5" />;
    switch (metrics.deviceType) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      case "desktop":
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getNetworkIcon = () => {
    if (!metrics) return <Wifi className="h-4 w-4" />;
    switch (metrics.networkStatus) {
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "slow":
        return <Signal className="h-4 w-4 text-yellow-500" />;
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />;
    }
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Smartphone className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Analyzing device capabilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getDeviceIcon()}
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Device Type</div>
              <div className="font-semibold capitalize">
                {metrics.deviceType}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Screen Size</div>
              <div className="font-semibold">
                {metrics.screenSize.width} × {metrics.screenSize.height}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Orientation</div>
              <div className="font-semibold capitalize">
                {metrics.orientation}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Touch Support</div>
              <div className="font-semibold">
                {metrics.touchSupport ? "Yes" : "No"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Pixel Ratio</div>
              <div className="font-semibold">{metrics.pixelRatio}x</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Connection</div>
              <div className="flex items-center gap-1">
                {getNetworkIcon()}
                <span className="font-semibold capitalize">
                  {metrics.connectionType}
                </span>
              </div>
            </div>
          </div>

          {/* Battery Information */}
          {metrics.batteryLevel !== undefined && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  <span className="text-sm">Battery</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {Math.round(metrics.batteryLevel)}%
                  </span>
                  {metrics.isCharging && (
                    <Zap className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Optimizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mobile Optimizations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Saver */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Data Saver Mode</div>
              <div className="text-sm text-gray-600">
                Reduce data usage by optimizing images and content
              </div>
            </div>
            <Switch
              checked={optimizations.dataSaver}
              onCheckedChange={(checked) =>
                applyOptimization("dataSaver", checked)
              }
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Reduced Motion</div>
              <div className="text-sm text-gray-600">
                Minimize animations for better performance
              </div>
            </div>
            <Switch
              checked={optimizations.reducedMotion}
              onCheckedChange={(checked) =>
                applyOptimization("reducedMotion", checked)
              }
            />
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Dark Mode</div>
              <div className="text-sm text-gray-600">
                Reduce eye strain and save battery
              </div>
            </div>
            <Switch
              checked={optimizations.darkMode}
              onCheckedChange={(checked) =>
                applyOptimization("darkMode", checked)
              }
            />
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Font Size</div>
              <div className="text-sm text-gray-600">
                {optimizations.fontSize}px
              </div>
            </div>
            <Slider
              value={[optimizations.fontSize]}
              onValueChange={([value]) => applyOptimization("fontSize", value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          {/* Touch Optimized */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Touch Optimized</div>
              <div className="text-sm text-gray-600">
                Larger touch targets for better usability
              </div>
            </div>
            <Switch
              checked={optimizations.touchOptimized}
              onCheckedChange={(checked) =>
                applyOptimization("touchOptimized", checked)
              }
            />
          </div>

          {/* Gesture Navigation */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Gesture Navigation</div>
              <div className="text-sm text-gray-600">
                Swipe gestures for navigation
              </div>
            </div>
            <Switch
              checked={optimizations.gestureNavigation}
              onCheckedChange={(checked) =>
                applyOptimization("gestureNavigation", checked)
              }
            />
          </div>

          {/* Haptic Feedback */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Haptic Feedback</div>
              <div className="text-sm text-gray-600">
                Vibration feedback for interactions
              </div>
            </div>
            <Switch
              checked={optimizations.hapticFeedback}
              onCheckedChange={(checked) =>
                applyOptimization("hapticFeedback", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={autoOptimizeForDevice}
              disabled={isOptimizing}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isOptimizing ? "Optimizing..." : "Auto-Optimize"}
            </Button>

            <Button
              onClick={installPWA}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Install App
            </Button>

            <Button
              onClick={() =>
                applyOptimization("offlineMode", !optimizations.offlineMode)
              }
              variant="outline"
              className="flex items-center gap-2"
            >
              {optimizations.offlineMode ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              {optimizations.offlineMode ? "Online Mode" : "Offline Mode"}
            </Button>

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">Performance Insights:</div>
            <ul className="text-sm space-y-1">
              {metrics.networkStatus === "slow" && (
                <li>
                  • Slow network detected - consider enabling data saver mode
                </li>
              )}
              {metrics.batteryLevel && metrics.batteryLevel < 20 && (
                <li>• Low battery - dark mode can help extend battery life</li>
              )}
              {metrics.deviceMemory && metrics.deviceMemory < 4 && (
                <li>
                  • Limited memory - reduced motion can improve performance
                </li>
              )}
              {networkSpeed < 1 && (
                <li>• Poor connectivity - offline mode recommended</li>
              )}
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EnhancedMobileExperience;
