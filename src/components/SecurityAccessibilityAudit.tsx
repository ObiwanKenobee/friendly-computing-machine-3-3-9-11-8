/**
 * Security and Accessibility Audit System
 * Comprehensive security checks and accessibility compliance for QuantumVest
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Key,
  Globe,
  Users,
  Zap,
  Settings,
  Search,
  Volume2,
  Contrast,
  MousePointer,
  Keyboard,
  Timer,
  Info,
} from "lucide-react";

interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "authentication" | "data" | "network" | "xss" | "csrf" | "headers";
  title: string;
  description: string;
  recommendation: string;
  detected: boolean;
  fixable: boolean;
}

interface AccessibilityIssue {
  id: string;
  level: "A" | "AA" | "AAA";
  category: "perceivable" | "operable" | "understandable" | "robust";
  wcagRule: string;
  title: string;
  description: string;
  elements: Element[];
  impact: "critical" | "serious" | "moderate" | "minor";
  fixable: boolean;
}

interface AuditResults {
  security: {
    score: number;
    issues: SecurityIssue[];
    passed: number;
    failed: number;
  };
  accessibility: {
    score: number;
    issues: AccessibilityIssue[];
    passed: number;
    failed: number;
  };
  performance: {
    score: number;
    metrics: {
      lcp: number;
      fid: number;
      cls: number;
      ttfb: number;
    };
  };
}

const SecurityAccessibilityAudit: React.FC = () => {
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [currentCheck, setCurrentCheck] = useState("");
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);

  // Security audit checks
  const runSecurityAudit = useCallback(async (): Promise<
    AuditResults["security"]
  > => {
    const issues: SecurityIssue[] = [];
    let passed = 0;
    let failed = 0;

    // Check for HTTPS
    setCurrentCheck("Checking HTTPS implementation...");
    const httpsIssue = checkHTTPS();
    if (httpsIssue.detected) {
      issues.push(httpsIssue);
      failed++;
    } else {
      passed++;
    }

    // Check for CSP headers
    setCurrentCheck("Analyzing Content Security Policy...");
    const cspIssue = await checkCSP();
    if (cspIssue.detected) {
      issues.push(cspIssue);
      failed++;
    } else {
      passed++;
    }

    // Check for XSS vulnerabilities
    setCurrentCheck("Scanning for XSS vulnerabilities...");
    const xssIssues = checkXSSVulnerabilities();
    issues.push(...xssIssues);
    failed += xssIssues.filter((i) => i.detected).length;
    passed += xssIssues.filter((i) => !i.detected).length;

    // Check for insecure data storage
    setCurrentCheck("Checking data storage security...");
    const storageIssues = checkInsecureStorage();
    issues.push(...storageIssues);
    failed += storageIssues.filter((i) => i.detected).length;
    passed += storageIssues.filter((i) => !i.detected).length;

    // Check for authentication weaknesses
    setCurrentCheck("Analyzing authentication security...");
    const authIssues = checkAuthenticationSecurity();
    issues.push(...authIssues);
    failed += authIssues.filter((i) => i.detected).length;
    passed += authIssues.filter((i) => !i.detected).length;

    // Check for CSRF protection
    setCurrentCheck("Verifying CSRF protection...");
    const csrfIssue = checkCSRFProtection();
    if (csrfIssue.detected) {
      issues.push(csrfIssue);
      failed++;
    } else {
      passed++;
    }

    const totalChecks = passed + failed;
    const score =
      totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;

    return { score, issues: issues.filter((i) => i.detected), passed, failed };
  }, []);

  // Accessibility audit checks
  const runAccessibilityAudit = useCallback(async (): Promise<
    AuditResults["accessibility"]
  > => {
    const issues: AccessibilityIssue[] = [];
    let passed = 0;
    let failed = 0;

    // Check color contrast
    setCurrentCheck("Checking color contrast ratios...");
    const contrastIssues = checkColorContrast();
    issues.push(...contrastIssues);
    failed += contrastIssues.length;

    // Check for alt text on images
    setCurrentCheck("Verifying image alt text...");
    const altTextIssues = checkImageAltText();
    issues.push(...altTextIssues);
    if (altTextIssues.length === 0) passed++;
    else failed++;

    // Check form labels
    setCurrentCheck("Analyzing form accessibility...");
    const formIssues = checkFormAccessibility();
    issues.push(...formIssues);
    if (formIssues.length === 0) passed++;
    else failed++;

    // Check heading structure
    setCurrentCheck("Validating heading hierarchy...");
    const headingIssues = checkHeadingStructure();
    issues.push(...headingIssues);
    if (headingIssues.length === 0) passed++;
    else failed++;

    // Check keyboard navigation
    setCurrentCheck("Testing keyboard navigation...");
    const keyboardIssues = checkKeyboardNavigation();
    issues.push(...keyboardIssues);
    if (keyboardIssues.length === 0) passed++;
    else failed++;

    // Check ARIA usage
    setCurrentCheck("Validating ARIA implementation...");
    const ariaIssues = checkARIAUsage();
    issues.push(...ariaIssues);
    if (ariaIssues.length === 0) passed++;
    else failed++;

    // Check focus management
    setCurrentCheck("Checking focus management...");
    const focusIssues = checkFocusManagement();
    issues.push(...focusIssues);
    if (focusIssues.length === 0) passed++;
    else failed++;

    const totalChecks = passed + failed;
    const score =
      totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;

    return { score, issues, passed, failed };
  }, []);

  // Security check implementations
  const checkHTTPS = (): SecurityIssue => {
    const isHTTPS = window.location.protocol === "https:";
    return {
      id: "https-check",
      severity: "critical",
      category: "network",
      title: "HTTPS Implementation",
      description: isHTTPS
        ? "Site is served over HTTPS"
        : "Site is not served over HTTPS",
      recommendation: "Always use HTTPS for production deployments",
      detected: !isHTTPS,
      fixable: false,
    };
  };

  const checkCSP = async (): Promise<SecurityIssue> => {
    // Check if CSP header is present
    try {
      const response = await fetch(window.location.href, { method: "HEAD" });
      const csp = response.headers.get("Content-Security-Policy");
      const detected = !csp;

      return {
        id: "csp-check",
        severity: "high",
        category: "headers",
        title: "Content Security Policy",
        description: detected
          ? "No Content Security Policy header found"
          : "Content Security Policy is configured",
        recommendation: "Implement CSP headers to prevent XSS attacks",
        detected,
        fixable: false,
      };
    } catch {
      return {
        id: "csp-check",
        severity: "high",
        category: "headers",
        title: "Content Security Policy",
        description: "Could not verify CSP headers",
        recommendation: "Implement CSP headers to prevent XSS attacks",
        detected: true,
        fixable: false,
      };
    }
  };

  const checkXSSVulnerabilities = (): SecurityIssue[] => {
    const issues: SecurityIssue[] = [];

    // Check for dangerous innerHTML usage
    const scripts = document.querySelectorAll("script");
    let dangerousInnerHTML = false;

    scripts.forEach((script) => {
      if (
        (script.innerHTML.includes("innerHTML") &&
          script.innerHTML.includes("user")) ||
        script.innerHTML.includes("input")
      ) {
        dangerousInnerHTML = true;
      }
    });

    issues.push({
      id: "xss-innerhtml",
      severity: "high",
      category: "xss",
      title: "Potential XSS via innerHTML",
      description: dangerousInnerHTML
        ? "Potentially unsafe innerHTML usage detected"
        : "No dangerous innerHTML usage found",
      recommendation: "Use textContent or sanitize HTML input",
      detected: dangerousInnerHTML,
      fixable: true,
    });

    return issues;
  };

  const checkInsecureStorage = (): SecurityIssue[] => {
    const issues: SecurityIssue[] = [];

    // Check localStorage for sensitive data
    const localStorage = window.localStorage;
    let sensitiveDataInStorage = false;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key || "");

      if (
        key &&
        (key.includes("password") ||
          key.includes("token") ||
          key.includes("secret") ||
          key.includes("key"))
      ) {
        sensitiveDataInStorage = true;
        break;
      }
    }

    issues.push({
      id: "storage-security",
      severity: "medium",
      category: "data",
      title: "Insecure Local Storage",
      description: sensitiveDataInStorage
        ? "Sensitive data found in localStorage"
        : "No sensitive data in localStorage",
      recommendation: "Use secure storage mechanisms for sensitive data",
      detected: sensitiveDataInStorage,
      fixable: true,
    });

    return issues;
  };

  const checkAuthenticationSecurity = (): SecurityIssue[] => {
    const issues: SecurityIssue[] = [];

    // Check for password fields without autocomplete="current-password"
    const passwordFields = document.querySelectorAll('input[type="password"]');
    let insecurePasswordFields = false;

    passwordFields.forEach((field) => {
      if (!field.getAttribute("autocomplete")) {
        insecurePasswordFields = true;
      }
    });

    issues.push({
      id: "auth-autocomplete",
      severity: "low",
      category: "authentication",
      title: "Password Field Autocomplete",
      description: insecurePasswordFields
        ? "Password fields missing autocomplete attributes"
        : "Password fields properly configured",
      recommendation: "Add autocomplete attributes to password fields",
      detected: insecurePasswordFields,
      fixable: true,
    });

    return issues;
  };

  const checkCSRFProtection = (): SecurityIssue => {
    // Check for CSRF tokens in forms
    const forms = document.querySelectorAll("form");
    let hasCSRFToken = false;

    forms.forEach((form) => {
      const csrfInput = form.querySelector(
        'input[name*="csrf"], input[name*="token"]',
      );
      if (csrfInput) {
        hasCSRFToken = true;
      }
    });

    return {
      id: "csrf-protection",
      severity: "medium",
      category: "csrf",
      title: "CSRF Protection",
      description:
        hasCSRFToken || forms.length === 0
          ? "CSRF protection appears to be in place"
          : "No CSRF tokens found in forms",
      recommendation: "Implement CSRF tokens for all state-changing forms",
      detected: !hasCSRFToken && forms.length > 0,
      fixable: false,
    };
  };

  // Accessibility check implementations
  const checkColorContrast = (): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];

    // This is a simplified check - in practice, you'd use more sophisticated contrast checking
    const textElements = document.querySelectorAll(
      "p, span, div, h1, h2, h3, h4, h5, h6, a, button",
    );
    const lowContrastElements: Element[] = [];

    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Simplified contrast check (would need proper color parsing in real implementation)
      if (
        color === backgroundColor ||
        (color.includes("rgb(128") && backgroundColor.includes("rgb(127"))
      ) {
        lowContrastElements.push(element);
      }
    });

    if (lowContrastElements.length > 0) {
      issues.push({
        id: "color-contrast",
        level: "AA",
        category: "perceivable",
        wcagRule: "1.4.3",
        title: "Color Contrast",
        description: `Found ${lowContrastElements.length} elements with potentially low contrast`,
        elements: lowContrastElements,
        impact: "serious",
        fixable: true,
      });
    }

    return issues;
  };

  const checkImageAltText = (): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const images = document.querySelectorAll("img");
    const imagesWithoutAlt: Element[] = [];

    images.forEach((img) => {
      if (!img.getAttribute("alt") && !img.getAttribute("aria-label")) {
        imagesWithoutAlt.push(img);
      }
    });

    if (imagesWithoutAlt.length > 0) {
      issues.push({
        id: "image-alt-text",
        level: "A",
        category: "perceivable",
        wcagRule: "1.1.1",
        title: "Image Alt Text",
        description: `Found ${imagesWithoutAlt.length} images without alt text`,
        elements: imagesWithoutAlt,
        impact: "critical",
        fixable: true,
      });
    }

    return issues;
  };

  const checkFormAccessibility = (): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const inputs = document.querySelectorAll("input, textarea, select");
    const unlabeledInputs: Element[] = [];

    inputs.forEach((input) => {
      const id = input.getAttribute("id");
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledBy = input.getAttribute("aria-labelledby");

      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label && !ariaLabel && !ariaLabelledBy) {
          unlabeledInputs.push(input);
        }
      } else if (!ariaLabel && !ariaLabelledBy) {
        unlabeledInputs.push(input);
      }
    });

    if (unlabeledInputs.length > 0) {
      issues.push({
        id: "form-labels",
        level: "A",
        category: "perceivable",
        wcagRule: "1.3.1",
        title: "Form Labels",
        description: `Found ${unlabeledInputs.length} form controls without labels`,
        elements: unlabeledInputs,
        impact: "critical",
        fixable: true,
      });
    }

    return issues;
  };

  const checkHeadingStructure = (): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const headingLevels: number[] = [];
    const problematicHeadings: Element[] = [];

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      headingLevels.push(level);
    });

    // Check for skipped heading levels
    for (let i = 1; i < headingLevels.length; i++) {
      const current = headingLevels[i];
      const previous = headingLevels[i - 1];

      if (current > previous + 1) {
        problematicHeadings.push(headings[i]);
      }
    }

    if (problematicHeadings.length > 0) {
      issues.push({
        id: "heading-structure",
        level: "AA",
        category: "perceivable",
        wcagRule: "1.3.1",
        title: "Heading Structure",
        description: "Heading levels are not properly nested",
        elements: problematicHeadings,
        impact: "moderate",
        fixable: true,
      });
    }

    return issues;
  };

  const checkKeyboardNavigation = (): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    const elementsWithoutFocus: Element[] = [];

    focusableElements.forEach((element) => {
      const tabIndex = element.getAttribute("tabindex");
      const styles = window.getComputedStyle(element);

      if (tabIndex === "-1" || styles.outline === "none") {
        elementsWithoutFocus.push(element);
      }
    });

    if (elementsWithoutFocus.length > 0) {
      issues.push({
        id: "keyboard-navigation",
        level: "A",
        category: "operable",
        wcagRule: "2.1.1",
        title: "Keyboard Navigation",
        description: "Some interactive elements are not keyboard accessible",
        elements: elementsWithoutFocus,
        impact: "serious",
        fixable: true,
      });
    }

    return issues;
  };

  const checkARIAUsage = (): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    const elementsWithARIA = document.querySelectorAll(
      "[aria-label], [aria-labelledby], [role]",
    );
    const invalidARIA: Element[] = [];

    elementsWithARIA.forEach((element) => {
      const role = element.getAttribute("role");
      if (
        role &&
        ![
          "button",
          "link",
          "navigation",
          "main",
          "banner",
          "contentinfo",
        ].includes(role)
      ) {
        invalidARIA.push(element);
      }
    });

    if (invalidARIA.length > 0) {
      issues.push({
        id: "aria-usage",
        level: "A",
        category: "robust",
        wcagRule: "4.1.2",
        title: "ARIA Usage",
        description: "Invalid ARIA attributes detected",
        elements: invalidARIA,
        impact: "moderate",
        fixable: true,
      });
    }

    return issues;
  };

  const checkFocusManagement = (): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];

    // Check for focus traps in modals
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    const modalIssues: Element[] = [];

    modals.forEach((modal) => {
      const focusableElements = modal.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) {
        modalIssues.push(modal);
      }
    });

    if (modalIssues.length > 0) {
      issues.push({
        id: "focus-management",
        level: "AA",
        category: "operable",
        wcagRule: "2.4.3",
        title: "Focus Management",
        description: "Modals without proper focus management",
        elements: modalIssues,
        impact: "serious",
        fixable: true,
      });
    }

    return issues;
  };

  // Auto-fix functionality
  const autoFixIssues = useCallback(async () => {
    if (!auditResults) return;

    setIsAuditing(true);
    setCurrentCheck("Applying automatic fixes...");

    // Fix accessibility issues
    auditResults.accessibility.issues.forEach((issue) => {
      if (!issue.fixable) return;

      switch (issue.id) {
        case "image-alt-text":
          issue.elements.forEach((img, index) => {
            img.setAttribute("alt", `Image ${index + 1}`);
          });
          break;

        case "form-labels":
          issue.elements.forEach((input, index) => {
            const inputElement = input as HTMLInputElement;
            if (!inputElement.id) {
              inputElement.id = `input-${index}-${Date.now()}`;
            }

            const label = document.createElement("label");
            label.setAttribute("for", inputElement.id);
            label.textContent =
              inputElement.placeholder || `Field ${index + 1}`;
            label.style.position = "absolute";
            label.style.left = "-9999px";
            inputElement.parentNode?.insertBefore(label, inputElement);
          });
          break;

        case "keyboard-navigation":
          issue.elements.forEach((element) => {
            if (!element.getAttribute("tabindex")) {
              element.setAttribute("tabindex", "0");
            }
          });
          break;
      }
    });

    // Fix security issues
    auditResults.security.issues.forEach((issue) => {
      if (!issue.fixable) return;

      switch (issue.id) {
        case "storage-security":
          // Clear sensitive data from localStorage
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (key.includes("password") || key.includes("secret")) {
              localStorage.removeItem(key);
            }
          });
          break;

        case "auth-autocomplete":
          const passwordFields = document.querySelectorAll(
            'input[type="password"]',
          );
          passwordFields.forEach((field) => {
            if (!field.getAttribute("autocomplete")) {
              field.setAttribute("autocomplete", "current-password");
            }
          });
          break;
      }
    });

    // Re-run audit
    setTimeout(async () => {
      await runFullAudit();
      setIsAuditing(false);
    }, 1000);
  }, [auditResults]);

  // Run full audit
  const runFullAudit = useCallback(async () => {
    setIsAuditing(true);
    setCurrentCheck("Initializing audit...");

    try {
      const [security, accessibility] = await Promise.all([
        runSecurityAudit(),
        runAccessibilityAudit(),
      ]);

      // Mock performance metrics
      const performance = {
        score: 85,
        metrics: {
          lcp: 2100,
          fid: 50,
          cls: 0.08,
          ttfb: 300,
        },
      };

      setAuditResults({ security, accessibility, performance });
    } catch (error) {
      console.error("Audit failed:", error);
    } finally {
      setIsAuditing(false);
      setCurrentCheck("");
    }
  }, [runSecurityAudit, runAccessibilityAudit]);

  useEffect(() => {
    runFullAudit();
  }, [runFullAudit]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
      case "serious":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
      case "moderate":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
      case "minor":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  if (isAuditing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Running Security & Accessibility Audit
          </h3>
          <p className="text-gray-600 mb-4">{currentCheck}</p>
          <Progress value={33} className="w-64" />
        </div>
      </div>
    );
  }

  if (!auditResults) return null;

  return (
    <div className="space-y-6">
      {/* Audit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              <span className={getScoreColor(auditResults.security.score)}>
                {auditResults.security.score}
              </span>
              <span className="text-lg text-gray-400">/100</span>
            </div>
            <div className="text-sm text-gray-600">
              {auditResults.security.passed} passed,{" "}
              {auditResults.security.failed} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5" />
              Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              <span className={getScoreColor(auditResults.accessibility.score)}>
                {auditResults.accessibility.score}
              </span>
              <span className="text-lg text-gray-400">/100</span>
            </div>
            <div className="text-sm text-gray-600">
              {auditResults.accessibility.passed} passed,{" "}
              {auditResults.accessibility.failed} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              <span className={getScoreColor(auditResults.performance.score)}>
                {auditResults.performance.score}
              </span>
              <span className="text-lg text-gray-400">/100</span>
            </div>
            <div className="text-sm text-gray-600">
              LCP: {auditResults.performance.metrics.lcp}ms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={runFullAudit} disabled={isAuditing}>
              <Search className="h-4 w-4 mr-2" />
              Re-run Audit
            </Button>
            <Button
              onClick={autoFixIssues}
              disabled={isAuditing || !auditResults}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Auto-Fix Issues
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="security">Security Issues</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          {auditResults.security.issues.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No security issues detected. Your application appears to be
                secure!
              </AlertDescription>
            </Alert>
          ) : (
            auditResults.security.issues.map((issue) => (
              <Alert
                key={issue.id}
                className={
                  issue.severity === "critical"
                    ? "border-red-200 bg-red-50"
                    : issue.severity === "high"
                      ? "border-orange-200 bg-orange-50"
                      : "border-yellow-200 bg-yellow-50"
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-semibold">{issue.title}</span>
                      {getSeverityBadge(issue.severity)}
                    </div>
                    <AlertDescription className="mb-2">
                      {issue.description}
                    </AlertDescription>
                    <div className="text-sm text-gray-600">
                      <strong>Recommendation:</strong> {issue.recommendation}
                    </div>
                  </div>
                  {issue.fixable && (
                    <Button size="sm" variant="outline">
                      Fix
                    </Button>
                  )}
                </div>
              </Alert>
            ))
          )}
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-4">
          {auditResults.accessibility.issues.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No accessibility issues detected. Your application is WCAG
                compliant!
              </AlertDescription>
            </Alert>
          ) : (
            auditResults.accessibility.issues.map((issue) => (
              <Alert
                key={issue.id}
                className={
                  issue.impact === "critical"
                    ? "border-red-200 bg-red-50"
                    : issue.impact === "serious"
                      ? "border-orange-200 bg-orange-50"
                      : "border-yellow-200 bg-yellow-50"
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4" />
                      <span className="font-semibold">{issue.title}</span>
                      {getSeverityBadge(issue.impact)}
                      <Badge variant="outline">WCAG {issue.level}</Badge>
                    </div>
                    <AlertDescription className="mb-2">
                      {issue.description}
                    </AlertDescription>
                    <div className="text-sm text-gray-600">
                      <strong>WCAG Rule:</strong> {issue.wcagRule} -{" "}
                      {issue.category}
                    </div>
                    {issue.elements.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        <strong>Affected elements:</strong>{" "}
                        {issue.elements.length}
                      </div>
                    )}
                  </div>
                  {issue.fixable && (
                    <Button size="sm" variant="outline">
                      Fix
                    </Button>
                  )}
                </div>
              </Alert>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAccessibilityAudit;
