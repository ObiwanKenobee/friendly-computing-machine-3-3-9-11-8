/**
 * Comprehensive API Documentation and Testing System
 * Advanced OpenAPI documentation generation and automated testing for QuantumVest
 */

import { APIEndpoint, APIDocumentation } from "./criticalAPIGateway";

// Core API Documentation System
export class APIDocumentationSystem {
  private spec: any;
  private endpoints: Map<string, APIEndpoint> = new Map();

  constructor() {
    this.spec = this.initializeOpenAPISpec();
  }

  // Generate OpenAPI specification
  generateOpenAPISpec(endpoints: APIEndpoint[]): any {
    this.spec.paths = {};

    endpoints.forEach((endpoint) => {
      this.addEndpointToSpec(endpoint);
    });

    return this.spec;
  }

  private addEndpointToSpec(endpoint: APIEndpoint): void {
    const pathKey = endpoint.path.replace(/:(\w+)/g, "{$1}");

    if (!this.spec.paths[pathKey]) {
      this.spec.paths[pathKey] = {};
    }

    const operation = {
      operationId: endpoint.id,
      summary: endpoint.documentation.summary,
      description: endpoint.documentation.description,
      tags: endpoint.documentation.tags,
      parameters: this.convertParameters(endpoint.documentation.parameters),
      responses: this.convertResponses(endpoint.documentation.responses),
      security: endpoint.config.authentication ? [{ BearerAuth: [] }] : [],
      deprecated: endpoint.documentation.deprecated || false,
    };

    if (["POST", "PUT", "PATCH"].includes(endpoint.method)) {
      (operation as any).requestBody = {
        description: "Request payload",
        content: {
          "application/json": {
            schema: { type: "object" },
            example: endpoint.documentation.examples[0]?.request || {},
          },
        },
        required: true,
      };
    }

    this.spec.paths[pathKey][endpoint.method.toLowerCase()] = operation;
  }

  private convertParameters(params: any[]): any[] {
    return params.map((param) => ({
      name: param.name,
      in: param.in,
      description: param.description,
      required: param.required,
      schema: {
        type: param.type,
        example: param.example,
      },
    }));
  }

  private convertResponses(responses: any[]): any {
    const result: any = {};

    responses.forEach((response) => {
      result[response.status.toString()] = {
        description: response.description,
        content: {
          "application/json": {
            schema: response.schema || { type: "object" },
            example: response.examples || {},
          },
        },
      };
    });

    return result;
  }

  generateHTMLDocumentation(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuantumVest API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .custom-header h1 { margin: 0; font-size: 2.5rem; }
        .custom-header p { margin: 0.5rem 0 0 0; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>QuantumVest API</h1>
        <p>Enterprise-grade investment platform API documentation</p>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api/docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                validatorUrl: null,
                tryItOutEnabled: true
            });
        };
    </script>
</body>
</html>`;
  }

  generateTypeScriptSDK(): string {
    return `
// API Types and Interfaces
export interface APIResponse<T = any> {
  data?: T;
  error?: APIError;
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
  correlationId?: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  totalValue: number;
  investments: Investment[];
  performanceMetrics: PerformanceMetrics;
  lastUpdated: string;
}

export interface Investment {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export class QuantumVestAPIClient {
  private baseURL: string;
  private authToken?: string;

  constructor(baseURL = '/api', authToken?: string) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = this.baseURL + endpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.authToken) {
      headers.Authorization = 'Bearer ' + this.authToken;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error('API Error: ' + response.status + ' ' + response.statusText);
    }

    return response.json();
  }

  async getPortfolio(userId: string): Promise<APIResponse<Portfolio>> {
    return this.request<Portfolio>('/portfolio/' + userId);
  }

  async optimizeQuantumCircuit(circuit: any, optimizationLevel?: string): Promise<APIResponse<any>> {
    return this.request<any>('/quantum/optimize', {
      method: 'POST',
      body: JSON.stringify({ circuit, optimization_level: optimizationLevel })
    });
  }

  async getRealtimeAnalytics(): Promise<APIResponse<any>> {
    return this.request<any>('/analytics/realtime');
  }

  async runMLInference(modelId: string, inputData: any): Promise<APIResponse<any>> {
    return this.request<any>('/ml/inference/' + modelId, {
      method: 'POST',
      body: JSON.stringify({ input_data: inputData })
    });
  }

  async processBlockchainTransaction(
    transactionType: string,
    amount: number,
    recipient: string,
    metadata?: any
  ): Promise<APIResponse<any>> {
    return this.request<any>('/blockchain/transaction', {
      method: 'POST',
      body: JSON.stringify({
        transaction_type: transactionType,
        amount,
        recipient,
        metadata
      })
    });
  }
}

export const quantumVestAPI = new QuantumVestAPIClient();
export default QuantumVestAPIClient;
`;
  }

  private initializeOpenAPISpec(): any {
    return {
      openapi: "3.0.3",
      info: {
        title: "QuantumVest API",
        description:
          "Enterprise-grade investment platform API with quantum computing capabilities",
        version: "1.0.0",
        contact: {
          name: "QuantumVest API Team",
          email: "api@quantumvest.com",
          url: "https://quantumvest.com/contact",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url: "https://api.quantumvest.com",
          description: "Production server",
        },
        {
          url: "https://staging-api.quantumvest.com",
          description: "Staging server",
        },
        {
          url: "http://localhost:3000/api",
          description: "Development server",
        },
      ],
      paths: {},
      components: {
        schemas: {
          Portfolio: {
            type: "object",
            properties: {
              id: { type: "string", description: "Portfolio identifier" },
              userId: { type: "string", description: "User identifier" },
              totalValue: {
                type: "number",
                description: "Total portfolio value",
              },
              investments: {
                type: "array",
                items: { $ref: "#/components/schemas/Investment" },
              },
            },
            required: ["id", "userId", "totalValue"],
          },
          Investment: {
            type: "object",
            properties: {
              id: { type: "string" },
              symbol: { type: "string" },
              quantity: { type: "number" },
              averagePrice: { type: "number" },
              currentPrice: { type: "number" },
              totalValue: { type: "number" },
            },
          },
          Error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
            },
            required: ["code", "message"],
          },
        },
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ BearerAuth: [] }],
      tags: [
        { name: "portfolio", description: "Portfolio management operations" },
        { name: "quantum", description: "Quantum computing operations" },
        { name: "analytics", description: "Real-time analytics and metrics" },
        { name: "ml", description: "Machine learning and AI operations" },
        {
          name: "blockchain",
          description: "Blockchain and cryptocurrency operations",
        },
      ],
    };
  }

  exportOpenAPIJSON(): string {
    return JSON.stringify(this.spec, null, 2);
  }

  exportOpenAPIYAML(): string {
    return JSON.stringify(this.spec, null, 2);
  }
}

// API Testing Framework
export interface APITest {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  request: {
    headers: Record<string, string>;
    query: Record<string, any>;
    body?: any;
  };
  assertions: Array<{
    type: "status" | "header" | "body" | "response-time";
    field?: string;
    operator:
      | "equals"
      | "not-equals"
      | "contains"
      | "greater-than"
      | "less-than";
    expected: any;
    description: string;
  }>;
  timeout: number;
}

export interface TestResult {
  testId: string;
  status: "passed" | "failed" | "error";
  duration: number;
  assertions: Array<{
    passed: boolean;
    actual: any;
    message: string;
  }>;
  error?: string;
  timestamp: number;
}

export class APITestingFramework {
  private tests: Map<string, APITest> = new Map();
  private results: Map<string, TestResult> = new Map();

  addTest(test: APITest): void {
    this.tests.set(test.id, test);
  }

  async runTest(testId: string): Promise<TestResult> {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error("Test not found: " + testId);
    }

    const startTime = Date.now();

    try {
      const response = await this.makeRequest(test);
      const assertions = await this.runAssertions(test.assertions, response);
      const endTime = Date.now();

      const result: TestResult = {
        testId,
        status: assertions.every((a) => a.passed) ? "passed" : "failed",
        duration: endTime - startTime,
        assertions,
        timestamp: startTime,
      };

      this.results.set(testId, result);
      return result;
    } catch (error) {
      const result: TestResult = {
        testId,
        status: "error",
        duration: Date.now() - startTime,
        assertions: [],
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: startTime,
      };

      this.results.set(testId, result);
      return result;
    }
  }

  private async makeRequest(test: APITest): Promise<Response> {
    const url = new URL(test.endpoint, "http://localhost:3000");

    Object.entries(test.request.query).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const options: RequestInit = {
      method: test.method,
      headers: test.request.headers,
    };

    if (test.request.body) {
      options.body = JSON.stringify(test.request.body);
    }

    return fetch(url.toString(), options);
  }

  private async runAssertions(
    assertions: APITest["assertions"],
    response: Response,
  ): Promise<TestResult["assertions"]> {
    const results: TestResult["assertions"] = [];
    const responseBody = await response.json().catch(() => null);

    for (const assertion of assertions) {
      let actual: any;
      let passed = false;

      try {
        switch (assertion.type) {
          case "status":
            actual = response.status;
            break;
          case "header":
            actual = response.headers.get(assertion.field || "");
            break;
          case "body":
            actual = assertion.field
              ? this.getNestedValue(responseBody, assertion.field)
              : responseBody;
            break;
          case "response-time":
            actual = Date.now();
            break;
        }

        passed = this.evaluateAssertion(
          actual,
          assertion.operator,
          assertion.expected,
        );

        results.push({
          passed,
          actual,
          message: passed
            ? "Assertion passed: " + assertion.description
            : "Assertion failed: Expected " +
              assertion.expected +
              ", got " +
              actual,
        });
      } catch (error) {
        results.push({
          passed: false,
          actual: null,
          message:
            "Assertion error: " +
            (error instanceof Error ? error.message : "Unknown error"),
        });
      }
    }

    return results;
  }

  private evaluateAssertion(
    actual: any,
    operator: string,
    expected: any,
  ): boolean {
    switch (operator) {
      case "equals":
        return actual === expected;
      case "not-equals":
        return actual !== expected;
      case "contains":
        return String(actual).includes(String(expected));
      case "greater-than":
        return Number(actual) > Number(expected);
      case "less-than":
        return Number(actual) < Number(expected);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  generateTests(resource: string): APITest[] {
    return [
      {
        id: "create-" + resource,
        name: "Create " + resource,
        description: "Test creating a new " + resource,
        endpoint: "/api/" + resource,
        method: "POST",
        request: {
          headers: { "Content-Type": "application/json" },
          query: {},
          body: { name: "Test " + resource, description: "Test description" },
        },
        assertions: [
          {
            type: "status",
            operator: "equals",
            expected: 201,
            description: "Should return 201 Created",
          },
        ],
        timeout: 5000,
      },
      {
        id: "read-" + resource,
        name: "Read " + resource,
        description: "Test reading " + resource,
        endpoint: "/api/" + resource + "/1",
        method: "GET",
        request: { headers: {}, query: {} },
        assertions: [
          {
            type: "status",
            operator: "equals",
            expected: 200,
            description: "Should return 200 OK",
          },
        ],
        timeout: 5000,
      },
    ];
  }

  getResults(): TestResult[] {
    return Array.from(this.results.values());
  }

  exportResults(): string {
    return JSON.stringify(this.getResults(), null, 2);
  }
}

export const apiDocumentationSystem = new APIDocumentationSystem();
export const apiTestingFramework = new APITestingFramework();
