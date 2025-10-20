/**
 * QuantumVest Authorization Service
 * Role-based access control, vault security, and community gatekeeping
 */

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: Permission[];
  inherits?: string[]; // Role inheritance
  constraints?: RoleConstraint[];
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  scope?: "global" | "organization" | "personal";
  metadata?: Record<string, any>;
}

export interface PermissionCondition {
  type:
    | "time"
    | "location"
    | "device"
    | "risk_score"
    | "vault_threshold"
    | "community_approval";
  operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in";
  value: any;
  metadata?: Record<string, any>;
}

export interface RoleConstraint {
  type: "time_bound" | "ip_restricted" | "device_bound" | "approval_required";
  configuration: Record<string, any>;
}

export interface VaultAccess {
  vaultId: string;
  userId: string;
  accessLevel: VaultAccessLevel;
  permissions: VaultPermission[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  conditions?: AccessCondition[];
  approvals?: CommunityApproval[];
}

export interface VaultAccessLevel {
  level: "viewer" | "participant" | "manager" | "admin" | "owner";
  numeric_value: number;
  description: string;
}

export interface VaultPermission {
  action:
    | "view"
    | "invest"
    | "withdraw"
    | "transfer"
    | "manage"
    | "audit"
    | "delete";
  resource:
    | "vault"
    | "holdings"
    | "transactions"
    | "reports"
    | "settings"
    | "members";
  conditions?: PermissionCondition[];
}

export interface AccessCondition {
  type:
    | "minimum_investment"
    | "kyc_level"
    | "community_standing"
    | "ritual_completion"
    | "time_lock";
  requirement: any;
  status: "pending" | "met" | "failed";
  verified_at?: Date;
}

export interface CommunityApproval {
  id: string;
  approver_id: string;
  approval_type: "community_vote" | "elder_approval" | "consensus" | "multisig";
  status: "pending" | "approved" | "rejected";
  vote_weight: number;
  reason?: string;
  created_at: Date;
  expires_at?: Date;
}

export interface RitualThreshold {
  ritual_id: string;
  threshold_type:
    | "investment_amount"
    | "time_commitment"
    | "community_participation"
    | "cultural_alignment";
  minimum_value: number;
  maximum_value?: number;
  unit: string;
  description: string;
}

export interface AccessRequest {
  id: string;
  requester_id: string;
  resource_type: "vault" | "community" | "ritual" | "data";
  resource_id: string;
  requested_permissions: Permission[];
  justification: string;
  status: "pending" | "approved" | "rejected" | "expired";
  approvals: CommunityApproval[];
  created_at: Date;
  reviewed_at?: Date;
  expires_at: Date;
}

export interface SecurityContext {
  user_id: string;
  session_id: string;
  roles: Role[];
  permissions: Permission[];
  device_info: any;
  location?: any;
  risk_score: number;
  mfa_verified: boolean;
  timestamp: Date;
}

export interface AuthorizationResult {
  granted: boolean;
  reason?: string;
  required_actions?: string[];
  partial_access?: boolean;
  conditions_to_meet?: AccessCondition[];
  expiry?: Date;
}

export class AuthorizationService {
  private static instance: AuthorizationService;
  private roleCache: Map<string, Role> = new Map();
  private permissionCache: Map<string, Permission[]> = new Map();
  private vaultAccessCache: Map<string, VaultAccess[]> = new Map();

  private constructor() {
    this.initializeDefaultRoles();
    this.setupCacheRefresh();
  }

  static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }

  private initializeDefaultRoles(): void {
    // System-wide roles
    const systemRoles: Role[] = [
      {
        id: "super_admin",
        name: "Super Administrator",
        description: "Full system access with all permissions",
        level: 100,
        permissions: [{ id: "system:*", resource: "*", action: "*" }],
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "admin",
        name: "Administrator",
        description: "Administrative access to organization resources",
        level: 80,
        permissions: [
          {
            id: "admin:users",
            resource: "users",
            action: "*",
            scope: "organization",
          },
          {
            id: "admin:vaults",
            resource: "vaults",
            action: "*",
            scope: "organization",
          },
          {
            id: "admin:reports",
            resource: "reports",
            action: "*",
            scope: "organization",
          },
        ],
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "vault_manager",
        name: "Vault Manager",
        description: "Management access to specific vaults",
        level: 60,
        permissions: [
          { id: "vault:manage", resource: "vault", action: "manage" },
          { id: "vault:members", resource: "vault_members", action: "*" },
          {
            id: "vault:settings",
            resource: "vault_settings",
            action: "update",
          },
        ],
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "community_elder",
        name: "Community Elder",
        description: "Respected community member with approval authority",
        level: 70,
        permissions: [
          {
            id: "community:approve",
            resource: "access_requests",
            action: "approve",
          },
          {
            id: "community:moderate",
            resource: "community_content",
            action: "moderate",
          },
          { id: "ritual:validate", resource: "rituals", action: "validate" },
        ],
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "verified_investor",
        name: "Verified Investor",
        description: "KYC-verified investor with standard access",
        level: 40,
        permissions: [
          { id: "vault:invest", resource: "vault", action: "invest" },
          { id: "vault:view", resource: "vault", action: "view" },
          {
            id: "transaction:create",
            resource: "transactions",
            action: "create",
          },
          {
            id: "reports:view",
            resource: "reports",
            action: "view",
            scope: "personal",
          },
        ],
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "basic_user",
        name: "Basic User",
        description: "Basic platform access with limited permissions",
        level: 20,
        permissions: [
          {
            id: "profile:view",
            resource: "profile",
            action: "view",
            scope: "personal",
          },
          {
            id: "profile:update",
            resource: "profile",
            action: "update",
            scope: "personal",
          },
          { id: "public:view", resource: "public_content", action: "view" },
        ],
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    systemRoles.forEach((role) => {
      this.roleCache.set(role.id, role);
    });
  }

  private setupCacheRefresh(): void {
    // Refresh cache every 5 minutes
    setInterval(() => {
      this.refreshCache();
    }, 300000);
  }

  /**
   * Core Authorization Check
   */
  async checkPermission(
    context: SecurityContext,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<AuthorizationResult> {
    try {
      // Get user permissions
      const userPermissions = await this.getUserPermissions(context.user_id);

      // Check direct permissions
      const hasDirectPermission = this.hasDirectPermission(
        userPermissions,
        resource,
        action,
      );

      if (hasDirectPermission) {
        // Check conditions
        const conditionCheck = await this.checkPermissionConditions(
          context,
          resource,
          action,
          resourceId,
        );

        if (!conditionCheck.granted) {
          return conditionCheck;
        }

        return { granted: true };
      }

      // Check role-based permissions
      const rolePermissionCheck = await this.checkRolePermissions(
        context,
        resource,
        action,
        resourceId,
      );

      if (rolePermissionCheck.granted) {
        return rolePermissionCheck;
      }

      // Check vault-specific access
      if (resource === "vault" && resourceId) {
        return await this.checkVaultAccess(context, resourceId, action);
      }

      // Check community access
      if (resource.startsWith("community:")) {
        return await this.checkCommunityAccess(context, resource, action);
      }

      return {
        granted: false,
        reason: "Insufficient permissions",
        required_actions: await this.suggestRequiredActions(
          context,
          resource,
          action,
        ),
      };
    } catch (error) {
      console.error("Authorization check failed:", error);
      return {
        granted: false,
        reason: "Authorization check failed",
      };
    }
  }

  /**
   * Vault Access Control
   */
  async checkVaultAccess(
    context: SecurityContext,
    vaultId: string,
    action: string,
  ): Promise<AuthorizationResult> {
    try {
      // Get vault access records
      const vaultAccess = await this.getVaultAccess(context.user_id, vaultId);

      if (!vaultAccess) {
        // Check if vault is public or requires application
        const vault = await this.getVaultDetails(vaultId);

        if (vault?.is_public && action === "view") {
          return { granted: true };
        }

        return {
          granted: false,
          reason: "No vault access granted",
          required_actions: ["request_vault_access"],
        };
      }

      // Check if access has expired
      if (vaultAccess.expiresAt && vaultAccess.expiresAt < new Date()) {
        return {
          granted: false,
          reason: "Vault access expired",
          required_actions: ["renew_vault_access"],
        };
      }

      // Check action permission
      const hasPermission = vaultAccess.permissions.some(
        (p) => p.action === action || p.action === "*",
      );

      if (!hasPermission) {
        return {
          granted: false,
          reason: `Action '${action}' not permitted`,
          required_actions: ["request_additional_permissions"],
        };
      }

      // Check access conditions
      const conditionsResult = await this.checkVaultAccessConditions(
        context,
        vaultAccess,
        action,
      );

      if (!conditionsResult.granted) {
        return conditionsResult;
      }

      // Check ritual thresholds
      const ritualCheck = await this.checkRitualThresholds(
        context.user_id,
        vaultId,
        action,
      );

      if (!ritualCheck.granted) {
        return ritualCheck;
      }

      return { granted: true };
    } catch (error) {
      console.error("Vault access check failed:", error);
      return { granted: false, reason: "Vault access check failed" };
    }
  }

  /**
   * Community Gatekeeping
   */
  async checkCommunityAccess(
    context: SecurityContext,
    resource: string,
    action: string,
  ): Promise<AuthorizationResult> {
    try {
      const communityStanding = await this.getCommunityStanding(
        context.user_id,
      );

      // Check minimum community standing
      const requiredStanding = this.getRequiredCommunityStanding(
        resource,
        action,
      );

      if (communityStanding.level < requiredStanding.level) {
        return {
          granted: false,
          reason: "Insufficient community standing",
          conditions_to_meet: [
            {
              type: "community_standing",
              requirement: requiredStanding.level,
              status: "pending",
            },
          ],
        };
      }

      // Check community approvals for sensitive actions
      if (this.requiresCommunityApproval(resource, action)) {
        const approvals = await this.getCommunityApprovals(
          context.user_id,
          resource,
          action,
        );

        const requiredApprovals = this.getRequiredApprovalCount(
          resource,
          action,
        );

        if (approvals.length < requiredApprovals) {
          return {
            granted: false,
            reason: "Insufficient community approvals",
            conditions_to_meet: [
              {
                type: "community_approval",
                requirement: requiredApprovals - approvals.length,
                status: "pending",
              },
            ],
          };
        }
      }

      return { granted: true };
    } catch (error) {
      console.error("Community access check failed:", error);
      return { granted: false, reason: "Community access check failed" };
    }
  }

  /**
   * Ritual Threshold Validation
   */
  async checkRitualThresholds(
    userId: string,
    vaultId: string,
    action: string,
  ): Promise<AuthorizationResult> {
    try {
      const thresholds = await this.getVaultRitualThresholds(vaultId, action);

      if (thresholds.length === 0) {
        return { granted: true };
      }

      const unmetThresholds: AccessCondition[] = [];

      for (const threshold of thresholds) {
        const userValue = await this.getUserRitualValue(
          userId,
          threshold.ritual_id,
          threshold.threshold_type,
        );

        if (userValue < threshold.minimum_value) {
          unmetThresholds.push({
            type: "ritual_completion",
            requirement: {
              ritual_id: threshold.ritual_id,
              type: threshold.threshold_type,
              required: threshold.minimum_value,
              current: userValue,
              unit: threshold.unit,
            },
            status: "pending",
          });
        }
      }

      if (unmetThresholds.length > 0) {
        return {
          granted: false,
          reason: "Ritual thresholds not met",
          conditions_to_meet: unmetThresholds,
        };
      }

      return { granted: true };
    } catch (error) {
      console.error("Ritual threshold check failed:", error);
      return { granted: false, reason: "Ritual threshold check failed" };
    }
  }

  /**
   * Access Request Management
   */
  async requestAccess(
    requesterId: string,
    resourceType: string,
    resourceId: string,
    permissions: Permission[],
    justification: string,
  ): Promise<AccessRequest> {
    const accessRequest: AccessRequest = {
      id: crypto.randomUUID(),
      requester_id: requesterId,
      resource_type: resourceType as any,
      resource_id: resourceId,
      requested_permissions: permissions,
      justification,
      status: "pending",
      approvals: [],
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    // Store request in database
    await this.storeAccessRequest(accessRequest);

    // Notify relevant approvers
    await this.notifyApprovers(accessRequest);

    return accessRequest;
  }

  async approveAccessRequest(
    requestId: string,
    approverId: string,
    approvalType: string,
    reason?: string,
  ): Promise<boolean> {
    try {
      const request = await this.getAccessRequest(requestId);
      if (!request || request.status !== "pending") {
        return false;
      }

      // Check if approver has authority
      const canApprove = await this.canApproveRequest(approverId, request);
      if (!canApprove) {
        throw new Error("Insufficient authority to approve request");
      }

      // Add approval
      const approval: CommunityApproval = {
        id: crypto.randomUUID(),
        approver_id: approverId,
        approval_type: approvalType as any,
        status: "approved",
        vote_weight: await this.getApproverWeight(approverId),
        reason,
        created_at: new Date(),
      };

      request.approvals.push(approval);

      // Check if enough approvals
      const totalWeight = request.approvals.reduce(
        (sum, a) => sum + a.vote_weight,
        0,
      );

      const requiredWeight = await this.getRequiredApprovalWeight(request);

      if (totalWeight >= requiredWeight) {
        request.status = "approved";
        request.reviewed_at = new Date();

        // Grant access
        await this.grantAccess(request);
      }

      // Update request
      await this.updateAccessRequest(request);

      return true;
    } catch (error) {
      console.error("Failed to approve access request:", error);
      return false;
    }
  }

  /**
   * Role Management
   */
  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
  ): Promise<boolean> {
    try {
      // Check if assigner has permission
      const canAssign = await this.canAssignRole(assignedBy, roleId);
      if (!canAssign) {
        throw new Error("Insufficient permission to assign role");
      }

      // Assign role
      await this.storeUserRole(userId, roleId, assignedBy);

      // Clear cache
      this.permissionCache.delete(userId);

      return true;
    } catch (error) {
      console.error("Failed to assign role:", error);
      return false;
    }
  }

  async revokeRole(
    userId: string,
    roleId: string,
    revokedBy: string,
  ): Promise<boolean> {
    try {
      // Check if revoker has permission
      const canRevoke = await this.canRevokeRole(revokedBy, roleId);
      if (!canRevoke) {
        throw new Error("Insufficient permission to revoke role");
      }

      // Revoke role
      await this.removeUserRole(userId, roleId);

      // Clear cache
      this.permissionCache.delete(userId);

      return true;
    } catch (error) {
      console.error("Failed to revoke role:", error);
      return false;
    }
  }

  /**
   * Utility Methods
   */
  private hasDirectPermission(
    permissions: Permission[],
    resource: string,
    action: string,
  ): boolean {
    return permissions.some(
      (p) =>
        (p.resource === resource || p.resource === "*") &&
        (p.action === action || p.action === "*"),
    );
  }

  private async checkPermissionConditions(
    context: SecurityContext,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<AuthorizationResult> {
    // Check time-based conditions
    if (context.risk_score > 70) {
      return {
        granted: false,
        reason: "High risk score detected",
        required_actions: ["complete_additional_verification"],
      };
    }

    // Check MFA requirement
    if (!context.mfa_verified && this.requiresMFA(resource, action)) {
      return {
        granted: false,
        reason: "MFA verification required",
        required_actions: ["verify_mfa"],
      };
    }

    return { granted: true };
  }

  private async checkRolePermissions(
    context: SecurityContext,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<AuthorizationResult> {
    const rolePermissions = context.roles.flatMap((role) => role.permissions);
    const hasPermission = this.hasDirectPermission(
      rolePermissions,
      resource,
      action,
    );

    if (hasPermission) {
      return await this.checkPermissionConditions(
        context,
        resource,
        action,
        resourceId,
      );
    }

    return { granted: false, reason: "No role permissions found" };
  }

  private async checkVaultAccessConditions(
    context: SecurityContext,
    vaultAccess: VaultAccess,
    action: string,
  ): Promise<AuthorizationResult> {
    if (!vaultAccess.conditions) {
      return { granted: true };
    }

    const unmetConditions: AccessCondition[] = [];

    for (const condition of vaultAccess.conditions) {
      const isMet = await this.checkAccessCondition(context.user_id, condition);
      if (!isMet) {
        unmetConditions.push(condition);
      }
    }

    if (unmetConditions.length > 0) {
      return {
        granted: false,
        reason: "Access conditions not met",
        conditions_to_meet: unmetConditions,
      };
    }

    return { granted: true };
  }

  private requiresMFA(resource: string, action: string): boolean {
    const mfaRequiredActions = [
      "vault:withdraw",
      "vault:transfer",
      "admin:*",
      "system:*",
      "user:delete",
    ];

    return mfaRequiredActions.some(
      (pattern) =>
        pattern === `${resource}:${action}` ||
        pattern === `${resource}:*` ||
        pattern === "*",
    );
  }

  private async refreshCache(): Promise<void> {
    // Refresh role and permission caches from database
    try {
      this.roleCache.clear();
      this.permissionCache.clear();
      this.vaultAccessCache.clear();

      // Reload from database
      await this.loadRolesFromDatabase();
    } catch (error) {
      console.error("Failed to refresh cache:", error);
    }
  }

  // Database operations (simplified - would use proper database service)
  private async getUserPermissions(userId: string): Promise<Permission[]> {
    // Implementation would fetch from database
    return [];
  }

  private async getVaultAccess(
    userId: string,
    vaultId: string,
  ): Promise<VaultAccess | null> {
    // Implementation would fetch from database
    return null;
  }

  private async getVaultDetails(vaultId: string): Promise<any> {
    // Implementation would fetch vault details
    return null;
  }

  private async getCommunityStanding(userId: string): Promise<any> {
    // Implementation would calculate community standing
    return { level: 0 };
  }

  private getRequiredCommunityStanding(resource: string, action: string): any {
    // Implementation would return required standing
    return { level: 0 };
  }

  private requiresCommunityApproval(resource: string, action: string): boolean {
    // Implementation would check if community approval is required
    return false;
  }

  private async getCommunityApprovals(
    userId: string,
    resource: string,
    action: string,
  ): Promise<any[]> {
    // Implementation would fetch approvals
    return [];
  }

  private getRequiredApprovalCount(resource: string, action: string): number {
    // Implementation would return required approval count
    return 1;
  }

  private async getVaultRitualThresholds(
    vaultId: string,
    action: string,
  ): Promise<RitualThreshold[]> {
    // Implementation would fetch ritual thresholds
    return [];
  }

  private async getUserRitualValue(
    userId: string,
    ritualId: string,
    type: string,
  ): Promise<number> {
    // Implementation would calculate user's ritual completion value
    return 0;
  }

  private async suggestRequiredActions(
    context: SecurityContext,
    resource: string,
    action: string,
  ): Promise<string[]> {
    // Implementation would suggest actions to gain access
    return ["complete_kyc", "join_community", "complete_tutorial"];
  }

  private async checkAccessCondition(
    userId: string,
    condition: AccessCondition,
  ): Promise<boolean> {
    // Implementation would check specific access condition
    return true;
  }

  private async storeAccessRequest(request: AccessRequest): Promise<void> {
    // Implementation would store in database
  }

  private async notifyApprovers(request: AccessRequest): Promise<void> {
    // Implementation would notify relevant approvers
  }

  private async getAccessRequest(
    requestId: string,
  ): Promise<AccessRequest | null> {
    // Implementation would fetch from database
    return null;
  }

  private async canApproveRequest(
    approverId: string,
    request: AccessRequest,
  ): Promise<boolean> {
    // Implementation would check approver authority
    return true;
  }

  private async getApproverWeight(approverId: string): Promise<number> {
    // Implementation would return approver's vote weight
    return 1;
  }

  private async getRequiredApprovalWeight(
    request: AccessRequest,
  ): Promise<number> {
    // Implementation would return required total weight
    return 1;
  }

  private async grantAccess(request: AccessRequest): Promise<void> {
    // Implementation would grant the requested access
  }

  private async updateAccessRequest(request: AccessRequest): Promise<void> {
    // Implementation would update request in database
  }

  private async canAssignRole(
    assignerId: string,
    roleId: string,
  ): Promise<boolean> {
    // Implementation would check if assigner can assign this role
    return true;
  }

  private async canRevokeRole(
    revokerId: string,
    roleId: string,
  ): Promise<boolean> {
    // Implementation would check if revoker can revoke this role
    return true;
  }

  private async storeUserRole(
    userId: string,
    roleId: string,
    assignedBy: string,
  ): Promise<void> {
    // Implementation would store role assignment
  }

  private async removeUserRole(userId: string, roleId: string): Promise<void> {
    // Implementation would remove role assignment
  }

  private async loadRolesFromDatabase(): Promise<void> {
    // Implementation would load roles from database
  }

  /**
   * Public API Methods
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const permissions = this.permissionCache.get(userId);
    if (!permissions) {
      // Load from database
      return [];
    }
    return [];
  }

  async getResourcePermissions(
    userId: string,
    resource: string,
  ): Promise<Permission[]> {
    const allPermissions = await this.getUserPermissions(userId);
    return allPermissions.filter(
      (p) => p.resource === resource || p.resource === "*",
    );
  }

  async createSecurityContext(
    userId: string,
    sessionId: string,
  ): Promise<SecurityContext> {
    const roles = await this.getUserRoles(userId);
    const permissions = roles.flatMap((role) => role.permissions);

    return {
      user_id: userId,
      session_id: sessionId,
      roles,
      permissions,
      device_info: {},
      risk_score: 0,
      mfa_verified: false,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const authorizationService = AuthorizationService.getInstance();
export default AuthorizationService;
