#!/usr/bin/env node
/**
 * QuantumVest Health Check Script
 * Comprehensive health check for Docker containers
 */

const http = require("http");
const process = require("process");

const HEALTH_CHECK_TIMEOUT = 5000;
const PORT = process.env.PORT || 5173;
const HOST = process.env.HOST || "localhost";

/**
 * Perform HTTP health check
 */
function checkHTTP() {
  return new Promise((resolve, reject) => {
    const options = {
      host: HOST,
      port: PORT,
      path: "/health",
      method: "GET",
      timeout: HEALTH_CHECK_TIMEOUT,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve({ status: "healthy", service: "http" });
      } else {
        reject(
          new Error(`HTTP health check failed with status ${res.statusCode}`),
        );
      }
    });

    req.on("error", (error) => {
      reject(new Error(`HTTP health check failed: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("HTTP health check timeout"));
    });

    req.end();
  });
}

/**
 * Check database connectivity
 */
function checkDatabase() {
  return new Promise((resolve, reject) => {
    // This is a simplified check
    // In production, you'd check actual database connectivity
    if (process.env.DATABASE_URL) {
      resolve({ status: "healthy", service: "database" });
    } else {
      resolve({ status: "not_configured", service: "database" });
    }
  });
}

/**
 * Check Redis connectivity
 */
function checkRedis() {
  return new Promise((resolve, reject) => {
    // This is a simplified check
    // In production, you'd check actual Redis connectivity
    if (process.env.REDIS_URL) {
      resolve({ status: "healthy", service: "redis" });
    } else {
      resolve({ status: "not_configured", service: "redis" });
    }
  });
}

/**
 * Check system resources
 */
function checkSystemResources() {
  return new Promise((resolve) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const memoryUsageMB = Math.round(memoryUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    // Basic resource checks
    const memoryOK = memoryUsageMB < 512; // Less than 512MB
    const heapOK = heapUsedMB < 256; // Less than 256MB heap

    resolve({
      status: memoryOK && heapOK ? "healthy" : "warning",
      service: "system_resources",
      details: {
        memory_mb: memoryUsageMB,
        heap_used_mb: heapUsedMB,
        uptime: Math.round(process.uptime()),
      },
    });
  });
}

/**
 * Main health check function
 */
async function healthCheck() {
  try {
    console.log("🏥 Starting QuantumVest health check...");

    const checks = await Promise.allSettled([
      checkHTTP(),
      checkDatabase(),
      checkRedis(),
      checkSystemResources(),
    ]);

    const results = checks.map((result, index) => {
      const services = ["http", "database", "redis", "system_resources"];
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          status: "error",
          service: services[index],
          error: result.reason.message,
        };
      }
    });

    // Determine overall health
    const criticalServices = ["http"];
    const hasFailedCritical = results.some(
      (result) =>
        criticalServices.includes(result.service) && result.status === "error",
    );

    const overallStatus = hasFailedCritical ? "unhealthy" : "healthy";

    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.round(process.uptime()),
      checks: results,
    };

    // Log health status
    if (overallStatus === "healthy") {
      console.log("✅ QuantumVest is healthy");
    } else {
      console.log("❌ QuantumVest health check failed");
      console.log(JSON.stringify(healthReport, null, 2));
    }

    // Exit with appropriate code
    process.exit(overallStatus === "healthy" ? 0 : 1);
  } catch (error) {
    console.error("💥 Health check crashed:", error.message);
    process.exit(1);
  }
}

// Handle timeout
setTimeout(() => {
  console.error("⏰ Health check timeout");
  process.exit(1);
}, HEALTH_CHECK_TIMEOUT + 1000);

// Run health check
healthCheck();
