/**
 * Critical API Gateway and Management System
 * Enterprise-grade API infrastructure for QuantumVest platform
 */

import { supabase } from "@/integrations/supabase/client";

// Core API Types and Interfaces
export interface APIEndpoint {
  id: string;
  path: string;
  method: HTTPMethod;
  handler: APIHandler;
  config: EndpointConfig;
  middleware: APIMiddleware[];
  documentation: APIDocumentation;
}

export interface EndpointConfig {
  authentication: boolean;
  authorization?: {
    roles: string[];
    permissions: string[];
  };
  rateLimit: {
    requests: number;
    windowMs: number;
    strategy: "sliding" | "fixed";
  };
  cache: {
    enabled: boolean;
    ttl: number;
    strategy: "memory" | "redis" | "hybrid";
  };
  validation: {
    request?: any; // JSON Schema
    response?: any; // JSON Schema
  };
  monitoring: {
    alerts: boolean;
    metrics: string[];
    logging: "basic" | "detailed" | "debug";
  };
}

export interface APIRequest {
  id: string;
  method: HTTPMethod;
  path: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body: any;
  user?: AuthenticatedUser;
  session?: UserSession;
  timestamp: number;
  ip: string;
  userAgent: string;
  correlationId: string;
}

export interface APIResponse {
  status: number;
  data?: any;
  error?: APIError;
  headers: Record<string, string>;
  metadata: {
    requestId: string;
    timestamp: number;
    processingTime: number;
    cached: boolean;
    version: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  correlationId?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  subscription: {
    tier: "free" | "starter" | "professional" | "enterprise";
    features: string[];
    limits: Record<string, number>;
  };
  metadata: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  lastActivity: number;
  permissions: string[];
  context: Record<string, any>;
}

export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";
export type APIHandler = (request: APIRequest) => Promise<APIResponse>;
export type APIMiddleware = (
  request: APIRequest,
  next: () => Promise<APIResponse>,
) => Promise<APIResponse>;

export interface APIDocumentation {
  summary: string;
  description: string;
  tags: string[];
  parameters: ParameterDoc[];
  responses: ResponseDoc[];
  examples: ExampleDoc[];
  deprecated?: boolean;
  version: string;
}

export interface ParameterDoc {
  name: string;
  in: "query" | "path" | "header" | "body";
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface ResponseDoc {
  status: number;
  description: string;
  schema?: any;
  examples?: any;
}

export interface ExampleDoc {
  name: string;
  description: string;
  request: any;
  response: any;
}

// API Performance and Monitoring
export interface APIMetrics {
  endpoint: string;
  method: string;
  requests: {
    total: number;
    successful: number;
    failed: number;
    rateLimited: number;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  errors: {
    rate: number;
    types: Record<string, number>;
    lastError?: APIError;
  };
  cache: {
    hitRate: number;
    missRate: number;
    invalidations: number;
  };
  timestamps: {
    firstRequest: number;
    lastRequest: number;
    periodStart: number;
    periodEnd: number;
  };
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  version: string;
  services: ServiceStatus[];
  resources: ResourceUsage;
  alerts: Alert[];
}

export interface ServiceStatus {
  name: string;
  status: "up" | "down" | "degraded";
  responseTime: number;
  lastCheck: number;
  dependencies: string[];
  metrics: Record<string, any>;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  connections: {
    active: number;
    total: number;
  };
}

export interface Alert {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata: Record<string, any>;
}

// Critical API Gateway Implementation
export class CriticalAPIGateway {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private middleware: APIMiddleware[] = [];
  private metrics: Map<string, APIMetrics> = new Map();
  private cache: Map<string, any> = new Map();
  private rateLimits: Map<string, number[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private health: SystemHealth;

  constructor() {
    this.health = this.initializeHealth();
    this.initializeCriticalEndpoints();
    this.initializeMiddleware();
    this.startHealthMonitoring();
  }

  // Core API Management
  async registerEndpoint(endpoint: APIEndpoint): Promise<void> {
    const key = `${endpoint.method}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);

    // Initialize metrics for endpoint
    this.metrics.set(key, {
      endpoint: endpoint.path,
      method: endpoint.method,
      requests: { total: 0, successful: 0, failed: 0, rateLimited: 0 },
      performance: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
      },
      errors: { rate: 0, types: {} },
      cache: { hitRate: 0, missRate: 0, invalidations: 0 },
      timestamps: {
        firstRequest: 0,
        lastRequest: 0,
        periodStart: Date.now(),
        periodEnd: 0,
      },
    });

    console.log(`Registered endpoint: ${endpoint.method} ${endpoint.path}`);
  }

  async handleRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const key = `${request.method}:${request.path}`;
    const endpoint = this.endpoints.get(key);

    if (!endpoint) {
      return this.createErrorResponse(
        404,
        "ENDPOINT_NOT_FOUND",
        "Endpoint not found",
        request.id,
      );
    }

    try {
      // Apply middleware chain
      const response = await this.applyMiddleware(request, endpoint);

      // Update metrics
      this.updateMetrics(key, startTime, response.status);

      return response;
    } catch (error) {
      const errorResponse = this.createErrorResponse(
        500,
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Unknown error",
        request.id,
      );

      this.updateMetrics(key, startTime, errorResponse.status);
      return errorResponse;
    }
  }

  private async applyMiddleware(
    request: APIRequest,
    endpoint: APIEndpoint,
  ): Promise<APIResponse> {
    let middlewareIndex = 0;
    const allMiddleware = [...this.middleware, ...endpoint.middleware];

    const next = async (): Promise<APIResponse> => {
      if (middlewareIndex < allMiddleware.length) {
        const middleware = allMiddleware[middlewareIndex++];
        return middleware(request, next);
      } else {
        return endpoint.handler(request);
      }
    };

    return next();
  }

  // Authentication and Authorization
  async authenticateRequest(
    request: APIRequest,
  ): Promise<AuthenticatedUser | null> {
    const authHeader = request.headers["authorization"];
    if (!authHeader) return null;

    try {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) return null;

      // Get user profile and permissions
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      return {
        id: user.id,
        email: user.email || "",
        roles: profile?.roles || ["user"],
        permissions: profile?.permissions || [],
        subscription: profile?.subscription || {
          tier: "free",
          features: [],
          limits: {},
        },
        metadata: profile?.metadata || {},
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return null;
    }
  }

  async authorizeRequest(
    user: AuthenticatedUser,
    requiredPermissions: string[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) return true;

    return requiredPermissions.some(
      (permission) =>
        user.permissions.includes(permission) || user.roles.includes("admin"),
    );
  }

  // Rate Limiting
  async checkRateLimit(
    request: APIRequest,
    config: EndpointConfig["rateLimit"],
  ): Promise<boolean> {
    const key = `${request.user?.id || request.ip}:${request.path}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let requests = this.rateLimits.get(key) || [];
    requests = requests.filter((timestamp) => timestamp > windowStart);

    if (requests.length >= config.requests) {
      return false;
    }

    requests.push(now);
    this.rateLimits.set(key, requests);
    return true;
  }

  // Caching System
  async getFromCache(key: string): Promise<any | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (cached.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  async setCache(key: string, data: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl * 1000,
    });
  }

  // Circuit Breaker Pattern
  async callWithCircuitBreaker<T>(
    serviceId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    let breaker = this.circuitBreakers.get(serviceId);

    if (!breaker) {
      breaker = new CircuitBreaker();
      this.circuitBreakers.set(serviceId, breaker);
    }

    return breaker.execute(operation);
  }

  // Critical Endpoint Definitions
  private initializeCriticalEndpoints(): void {
    // Investment Data API
    this.registerEndpoint({
      id: "get-portfolio-data",
      path: "/api/portfolio/:userId",
      method: "GET",
      handler: this.getPortfolioData.bind(this),
      config: {
        authentication: true,
        authorization: {
          roles: ["user", "investor"],
          permissions: ["portfolio:read"],
        },
        rateLimit: { requests: 100, windowMs: 60000, strategy: "sliding" },
        cache: { enabled: true, ttl: 300, strategy: "memory" },
        validation: {},
        monitoring: {
          alerts: true,
          metrics: ["response_time", "cache_hit"],
          logging: "detailed",
        },
      },
      middleware: [
        this.authMiddleware,
        this.rateLimitMiddleware,
        this.cacheMiddleware,
      ],
      documentation: {
        summary: "Get user portfolio data",
        description:
          "Retrieve comprehensive portfolio information for authenticated user",
        tags: ["portfolio", "investment"],
        parameters: [
          {
            name: "userId",
            in: "path",
            type: "string",
            required: true,
            description: "User identifier",
          },
        ],
        responses: [
          { status: 200, description: "Portfolio data retrieved successfully" },
          { status: 401, description: "Unauthorized" },
          { status: 404, description: "Portfolio not found" },
        ],
        examples: [],
        version: "1.0",
      },
    });

    // Quantum Computing API
    this.registerEndpoint({
      id: "quantum-circuit-optimization",
      path: "/api/quantum/optimize",
      method: "POST",
      handler: this.optimizeQuantumCircuit.bind(this),
      config: {
        authentication: true,
        authorization: {
          roles: ["developer", "quantum-engineer"],
          permissions: ["quantum:execute"],
        },
        rateLimit: { requests: 10, windowMs: 60000, strategy: "fixed" },
        cache: { enabled: false, ttl: 0, strategy: "memory" },
        validation: {},
        monitoring: {
          alerts: true,
          metrics: ["processing_time", "accuracy"],
          logging: "debug",
        },
      },
      middleware: [
        this.authMiddleware,
        this.rateLimitMiddleware,
        this.validationMiddleware,
      ],
      documentation: {
        summary: "Optimize quantum circuit",
        description:
          "Apply quantum optimization algorithms to improve circuit efficiency",
        tags: ["quantum", "optimization"],
        parameters: [],
        responses: [],
        examples: [],
        version: "1.0",
      },
    });

    // Real-time Analytics API
    this.registerEndpoint({
      id: "real-time-analytics",
      path: "/api/analytics/realtime",
      method: "GET",
      handler: this.getRealtimeAnalytics.bind(this),
      config: {
        authentication: true,
        authorization: {
          roles: ["analyst", "admin"],
          permissions: ["analytics:read"],
        },
        rateLimit: { requests: 1000, windowMs: 60000, strategy: "sliding" },
        cache: { enabled: true, ttl: 30, strategy: "memory" },
        validation: {},
        monitoring: {
          alerts: true,
          metrics: ["latency", "data_freshness"],
          logging: "basic",
        },
      },
      middleware: [this.authMiddleware, this.rateLimitMiddleware],
      documentation: {
        summary: "Get real-time analytics data",
        description: "Stream real-time analytics and performance metrics",
        tags: ["analytics", "real-time"],
        parameters: [],
        responses: [],
        examples: [],
        version: "1.0",
      },
    });

    // AI/ML Model API
    this.registerEndpoint({
      id: "ml-model-inference",
      path: "/api/ml/inference/:modelId",
      method: "POST",
      handler: this.runMLInference.bind(this),
      config: {
        authentication: true,
        authorization: {
          roles: ["user", "developer"],
          permissions: ["ml:inference"],
        },
        rateLimit: { requests: 50, windowMs: 60000, strategy: "sliding" },
        cache: { enabled: true, ttl: 600, strategy: "hybrid" },
        validation: {},
        monitoring: {
          alerts: true,
          metrics: ["accuracy", "latency"],
          logging: "detailed",
        },
      },
      middleware: [
        this.authMiddleware,
        this.rateLimitMiddleware,
        this.cacheMiddleware,
      ],
      documentation: {
        summary: "Run ML model inference",
        description:
          "Execute machine learning model inference with provided input data",
        tags: ["ml", "ai", "inference"],
        parameters: [],
        responses: [],
        examples: [],
        version: "1.0",
      },
    });

    // Blockchain Integration API
    this.registerEndpoint({
      id: "blockchain-transaction",
      path: "/api/blockchain/transaction",
      method: "POST",
      handler: this.processBlockchainTransaction.bind(this),
      config: {
        authentication: true,
        authorization: {
          roles: ["investor", "institution"],
          permissions: ["blockchain:transact"],
        },
        rateLimit: { requests: 20, windowMs: 60000, strategy: "fixed" },
        cache: { enabled: false, ttl: 0, strategy: "memory" },
        validation: {},
        monitoring: {
          alerts: true,
          metrics: ["confirmation_time", "gas_cost"],
          logging: "detailed",
        },
      },
      middleware: [
        this.authMiddleware,
        this.rateLimitMiddleware,
        this.validationMiddleware,
      ],
      documentation: {
        summary: "Process blockchain transaction",
        description:
          "Execute secure blockchain transactions for investment operations",
        tags: ["blockchain", "transaction", "crypto"],
        parameters: [],
        responses: [],
        examples: [],
        version: "1.0",
      },
    });
  }

  // Middleware Implementation
  private authMiddleware: APIMiddleware = async (
    request: APIRequest,
    next: () => Promise<APIResponse>,
  ) => {
    const user = await this.authenticateRequest(request);
    if (!user) {
      return this.createErrorResponse(
        401,
        "UNAUTHORIZED",
        "Authentication required",
        request.id,
      );
    }
    request.user = user;
    return next();
  };

  private rateLimitMiddleware: APIMiddleware = async (
    request: APIRequest,
    next: () => Promise<APIResponse>,
  ) => {
    const endpoint = this.endpoints.get(`${request.method}:${request.path}`);
    if (!endpoint) return next();

    const allowed = await this.checkRateLimit(
      request,
      endpoint.config.rateLimit,
    );
    if (!allowed) {
      return this.createErrorResponse(
        429,
        "RATE_LIMITED",
        "Rate limit exceeded",
        request.id,
      );
    }
    return next();
  };

  private cacheMiddleware: APIMiddleware = async (
    request: APIRequest,
    next: () => Promise<APIResponse>,
  ) => {
    if (request.method !== "GET") return next();

    const cacheKey = `${request.method}:${request.path}:${JSON.stringify(request.query)}`;
    const cached = await this.getFromCache(cacheKey);

    if (cached) {
      return {
        ...cached,
        metadata: { ...cached.metadata, cached: true },
      };
    }

    const response = await next();

    if (response.status === 200) {
      const endpoint = this.endpoints.get(`${request.method}:${request.path}`);
      if (endpoint?.config.cache.enabled) {
        await this.setCache(cacheKey, response, endpoint.config.cache.ttl);
      }
    }

    return response;
  };

  private validationMiddleware: APIMiddleware = async (
    request: APIRequest,
    next: () => Promise<APIResponse>,
  ) => {
    // Implementation for request/response validation
    return next();
  };

  // API Handler Implementations
  private async getPortfolioData(request: APIRequest): Promise<APIResponse> {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return this.createErrorResponse(
          401,
          "UNAUTHORIZED",
          "User not authenticated",
          request.id,
        );
      }

      // Fetch portfolio data from Supabase
      const { data: portfolio, error } = await supabase
        .from("portfolios")
        .select(
          `
          *,
          investments(*),
          performance_metrics(*)
        `,
        )
        .eq("user_id", userId)
        .single();

      if (error) {
        return this.createErrorResponse(
          404,
          "PORTFOLIO_NOT_FOUND",
          "Portfolio not found",
          request.id,
        );
      }

      return this.createSuccessResponse(portfolio, request.id);
    } catch (error) {
      return this.createErrorResponse(
        500,
        "INTERNAL_ERROR",
        "Failed to fetch portfolio data",
        request.id,
      );
    }
  }

  private async optimizeQuantumCircuit(
    request: APIRequest,
  ): Promise<APIResponse> {
    try {
      const { circuit, optimization_level } = request.body;

      // Simulate quantum circuit optimization
      const optimizedCircuit = {
        ...circuit,
        gates: circuit.gates.length * 0.8, // Simulate 20% reduction
        depth: circuit.depth * 0.7, // Simulate depth optimization
        fidelity: Math.min(0.99, circuit.fidelity * 1.05), // Simulate fidelity improvement
        optimization_applied: optimization_level || "standard",
      };

      return this.createSuccessResponse(
        {
          original_circuit: circuit,
          optimized_circuit: optimizedCircuit,
          optimization_metrics: {
            gate_reduction: "20%",
            depth_reduction: "30%",
            fidelity_improvement: "5%",
          },
        },
        request.id,
      );
    } catch (error) {
      return this.createErrorResponse(
        500,
        "OPTIMIZATION_FAILED",
        "Quantum circuit optimization failed",
        request.id,
      );
    }
  }

  private async getRealtimeAnalytics(
    request: APIRequest,
  ): Promise<APIResponse> {
    try {
      // Generate mock real-time analytics data
      const analytics = {
        timestamp: Date.now(),
        metrics: {
          active_users: Math.floor(Math.random() * 1000) + 500,
          api_requests_per_second: Math.floor(Math.random() * 100) + 50,
          response_time_p95: Math.floor(Math.random() * 200) + 100,
          error_rate: Math.random() * 0.05,
          quantum_jobs_running: Math.floor(Math.random() * 20) + 5,
          ml_inference_count: Math.floor(Math.random() * 500) + 100,
        },
        alerts: [],
        system_health: "healthy",
      };

      return this.createSuccessResponse(analytics, request.id);
    } catch (error) {
      return this.createErrorResponse(
        500,
        "ANALYTICS_ERROR",
        "Failed to fetch analytics data",
        request.id,
      );
    }
  }

  private async runMLInference(request: APIRequest): Promise<APIResponse> {
    try {
      const { modelId } = request.query;
      const { input_data } = request.body;

      // Simulate ML inference
      const inference_result = {
        model_id: modelId,
        prediction: Math.random() > 0.5 ? "positive" : "negative",
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        processing_time_ms: Math.floor(Math.random() * 500) + 100,
        model_version: "1.2.3",
        features_used: input_data ? Object.keys(input_data).length : 0,
      };

      return this.createSuccessResponse(inference_result, request.id);
    } catch (error) {
      return this.createErrorResponse(
        500,
        "INFERENCE_ERROR",
        "ML inference failed",
        request.id,
      );
    }
  }

  private async processBlockchainTransaction(
    request: APIRequest,
  ): Promise<APIResponse> {
    try {
      const { transaction_type, amount, recipient, metadata } = request.body;

      // Simulate blockchain transaction processing
      const transaction_result = {
        transaction_id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
        transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        block_number: null,
        gas_used: Math.floor(Math.random() * 100000) + 21000,
        gas_price: "20000000000", // 20 gwei
        confirmation_time_estimate: "2-5 minutes",
        network: "ethereum",
        timestamp: Date.now(),
      };

      return this.createSuccessResponse(transaction_result, request.id);
    } catch (error) {
      return this.createErrorResponse(
        500,
        "TRANSACTION_ERROR",
        "Blockchain transaction failed",
        request.id,
      );
    }
  }

  // Utility Methods
  private createSuccessResponse(data: any, requestId: string): APIResponse {
    return {
      status: 200,
      data,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
      metadata: {
        requestId,
        timestamp: Date.now(),
        processingTime: 0, // Will be calculated by caller
        cached: false,
        version: "1.0.0",
      },
    };
  }

  private createErrorResponse(
    status: number,
    code: string,
    message: string,
    requestId: string,
  ): APIResponse {
    return {
      status,
      error: { code, message, correlationId: requestId },
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
      metadata: {
        requestId,
        timestamp: Date.now(),
        processingTime: 0,
        cached: false,
        version: "1.0.0",
      },
    };
  }

  private updateMetrics(
    endpointKey: string,
    startTime: number,
    status: number,
  ): void {
    const metrics = this.metrics.get(endpointKey);
    if (!metrics) return;

    const processingTime = Date.now() - startTime;

    metrics.requests.total++;
    if (status >= 200 && status < 400) {
      metrics.requests.successful++;
    } else {
      metrics.requests.failed++;
    }

    // Update performance metrics
    if (
      metrics.performance.minResponseTime === 0 ||
      processingTime < metrics.performance.minResponseTime
    ) {
      metrics.performance.minResponseTime = processingTime;
    }
    if (processingTime > metrics.performance.maxResponseTime) {
      metrics.performance.maxResponseTime = processingTime;
    }

    // Simple moving average for response time
    metrics.performance.avgResponseTime =
      (metrics.performance.avgResponseTime * (metrics.requests.total - 1) +
        processingTime) /
      metrics.requests.total;

    metrics.timestamps.lastRequest = Date.now();
    if (metrics.timestamps.firstRequest === 0) {
      metrics.timestamps.firstRequest = Date.now();
    }
  }

  private initializeHealth(): SystemHealth {
    return {
      status: "healthy",
      uptime: 0,
      version: "1.0.0",
      services: [],
      resources: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { inbound: 0, outbound: 0 },
        connections: { active: 0, total: 0 },
      },
      alerts: [],
    };
  }

  private initializeMiddleware(): void {
    // Middleware is already defined above
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.updateSystemHealth();
    }, 30000); // Update every 30 seconds
  }

  private updateSystemHealth(): void {
    this.health.uptime = Date.now();
    // Update resource usage, service status, etc.
    // This would integrate with actual monitoring tools in production
  }

  // Public API Methods
  public getMetrics(): Map<string, APIMetrics> {
    return this.metrics;
  }

  public getHealth(): SystemHealth {
    return this.health;
  }

  public getEndpoints(): APIEndpoint[] {
    return Array.from(this.endpoints.values());
  }
}

// Circuit Breaker Implementation
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private readonly failureThreshold = 5;
  private readonly recoveryTimeMs = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await operation();
      if (this.state === "half-open") {
        this.state = "closed";
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = "open";
      }

      throw error;
    }
  }
}

// Export singleton instance
export const criticalAPIGateway = new CriticalAPIGateway();
export default CriticalAPIGateway;
