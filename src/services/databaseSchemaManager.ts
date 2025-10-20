/**
 * Database Schema Manager
 * Advanced migration system with quantum-optimized schema management
 */

import { databaseArchitecture } from "./databaseArchitecture";

export interface SchemaVersion {
  version: string;
  description: string;
  applied_at?: Date;
  rollback_sql?: string;
  checksum: string;
  quantum_optimized: boolean;
}

export interface Migration {
  id: string;
  version: string;
  name: string;
  description: string;
  sql_up: string;
  sql_down: string;
  dependencies: string[];
  quantum_features: string[];
  performance_impact: "low" | "medium" | "high";
  estimated_duration: number;
  validation_queries: string[];
  post_migration_tasks: string[];
}

export interface TableSchema {
  table_name: string;
  schema_name: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  constraints: ConstraintDefinition[];
  triggers: TriggerDefinition[];
  quantum_optimizations: QuantumTableOptimizations;
  partitioning: PartitioningConfig;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default_value?: any;
  constraints: string[];
  quantum_type?: "state_vector" | "measurement" | "amplitude" | "phase";
  encryption_level?: "none" | "standard" | "quantum_resistant";
}

export interface IndexDefinition {
  name: string;
  type: "btree" | "hash" | "gin" | "gist" | "vector" | "quantum_hash";
  columns: string[];
  unique: boolean;
  partial_condition?: string;
  quantum_optimized: boolean;
}

export interface ConstraintDefinition {
  name: string;
  type:
    | "primary_key"
    | "foreign_key"
    | "unique"
    | "check"
    | "quantum_invariant";
  definition: string;
  deferrable: boolean;
}

export interface TriggerDefinition {
  name: string;
  event: "insert" | "update" | "delete" | "quantum_measurement";
  timing: "before" | "after" | "instead_of";
  function_name: string;
  quantum_enhanced: boolean;
}

export interface QuantumTableOptimizations {
  enable_vector_similarity: boolean;
  state_compression: "none" | "sparse" | "tensor_network";
  entanglement_tracking: boolean;
  coherence_monitoring: boolean;
  parallel_processing: boolean;
  quantum_checksum: boolean;
}

export interface PartitioningConfig {
  enabled: boolean;
  strategy: "range" | "hash" | "list" | "quantum_state";
  partition_key: string;
  partition_count?: number;
  partition_size_limit?: string;
}

export interface SchemaValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  quantum_compatibility: boolean;
  performance_score: number;
  security_score: number;
}

export class DatabaseSchemaManager {
  private static instance: DatabaseSchemaManager;
  private appliedMigrations: Map<string, SchemaVersion> = new Map();
  private pendingMigrations: Map<string, Migration> = new Map();
  private currentSchema: Map<string, TableSchema> = new Map();

  private constructor() {
    this.initializeDefaultSchema();
    this.loadAppliedMigrations();
  }

  static getInstance(): DatabaseSchemaManager {
    if (!DatabaseSchemaManager.instance) {
      DatabaseSchemaManager.instance = new DatabaseSchemaManager();
    }
    return DatabaseSchemaManager.instance;
  }

  private initializeDefaultSchema(): void {
    // Initialize quantum computing tables
    const quantumCircuitsSchema: TableSchema = {
      table_name: "quantum_circuits",
      schema_name: "quantum",
      columns: [
        {
          name: "id",
          type: "UUID",
          nullable: false,
          constraints: ["PRIMARY KEY"],
        },
        {
          name: "circuit_name",
          type: "VARCHAR(255)",
          nullable: false,
          constraints: [],
        },
        {
          name: "num_qubits",
          type: "INTEGER",
          nullable: false,
          constraints: ["CHECK (num_qubits > 0)"],
        },
        {
          name: "circuit_qasm",
          type: "TEXT",
          nullable: true,
          quantum_type: "state_vector",
          constraints: [],
        },
        {
          name: "fidelity",
          type: "FLOAT",
          nullable: true,
          constraints: ["CHECK (fidelity >= 0 AND fidelity <= 1)"],
        },
        {
          name: "created_at",
          type: "TIMESTAMP WITH TIME ZONE",
          nullable: false,
          default_value: "NOW()",
        },
      ],
      indexes: [
        {
          name: "idx_quantum_circuits_qubits",
          type: "btree",
          columns: ["num_qubits"],
          unique: false,
          quantum_optimized: false,
        },
        {
          name: "idx_quantum_circuits_fidelity",
          type: "btree",
          columns: ["fidelity"],
          unique: false,
          quantum_optimized: true,
        },
      ],
      constraints: [],
      triggers: [],
      quantum_optimizations: {
        enable_vector_similarity: true,
        state_compression: "tensor_network",
        entanglement_tracking: true,
        coherence_monitoring: true,
        parallel_processing: true,
        quantum_checksum: true,
      },
      partitioning: {
        enabled: true,
        strategy: "range",
        partition_key: "created_at",
        partition_count: 12,
      },
    };

    // Initialize financial tables
    const portfoliosSchema: TableSchema = {
      table_name: "portfolios",
      schema_name: "financial",
      columns: [
        {
          name: "id",
          type: "UUID",
          nullable: false,
          constraints: ["PRIMARY KEY"],
        },
        {
          name: "user_id",
          type: "UUID",
          nullable: false,
          constraints: ["FOREIGN KEY REFERENCES users(id)"],
        },
        {
          name: "name",
          type: "VARCHAR(255)",
          nullable: false,
          constraints: [],
        },
        {
          name: "total_value",
          type: "DECIMAL(15,2)",
          nullable: false,
          default_value: "0",
        },
        {
          name: "risk_score",
          type: "FLOAT",
          nullable: true,
          constraints: ["CHECK (risk_score >= 0 AND risk_score <= 100)"],
        },
        {
          name: "created_at",
          type: "TIMESTAMP WITH TIME ZONE",
          nullable: false,
          default_value: "NOW()",
        },
        {
          name: "updated_at",
          type: "TIMESTAMP WITH TIME ZONE",
          nullable: false,
          default_value: "NOW()",
        },
      ],
      indexes: [
        {
          name: "idx_portfolios_user",
          type: "btree",
          columns: ["user_id"],
          unique: false,
          quantum_optimized: false,
        },
        {
          name: "idx_portfolios_value",
          type: "btree",
          columns: ["total_value"],
          unique: false,
          quantum_optimized: false,
        },
      ],
      constraints: [],
      triggers: [
        {
          name: "trigger_update_portfolio_timestamp",
          event: "update",
          timing: "before",
          function_name: "update_timestamp",
          quantum_enhanced: false,
        },
      ],
      quantum_optimizations: {
        enable_vector_similarity: false,
        state_compression: "none",
        entanglement_tracking: false,
        coherence_monitoring: false,
        parallel_processing: true,
        quantum_checksum: false,
      },
      partitioning: {
        enabled: true,
        strategy: "hash",
        partition_key: "user_id",
        partition_count: 64,
      },
    };

    this.currentSchema.set("quantum_circuits", quantumCircuitsSchema);
    this.currentSchema.set("portfolios", portfoliosSchema);
  }

  private async loadAppliedMigrations(): Promise<void> {
    try {
      const db = databaseArchitecture.getSupabaseClient();
      const { data, error } = await db
        .from("schema_migrations")
        .select("*")
        .order("applied_at", { ascending: true });

      if (error) {
        console.warn("Could not load applied migrations:", error.message);
        return;
      }

      if (data) {
        data.forEach((migration: any) => {
          this.appliedMigrations.set(migration.version, {
            version: migration.version,
            description: migration.description,
            applied_at: new Date(migration.applied_at),
            rollback_sql: migration.rollback_sql,
            checksum: migration.checksum,
            quantum_optimized: migration.quantum_optimized || false,
          });
        });
      }
    } catch (error) {
      console.warn("Error loading applied migrations:", error);
    }
  }

  /**
   * Create and register a new migration
   */
  createMigration(migration: Omit<Migration, "id">): Migration {
    const id = `${Date.now()}_${migration.name.toLowerCase().replace(/\s+/g, "_")}`;
    const fullMigration: Migration = {
      id,
      ...migration,
    };

    this.pendingMigrations.set(id, fullMigration);
    return fullMigration;
  }

  /**
   * Apply a specific migration
   */
  async applyMigration(migrationId: string): Promise<void> {
    const migration = this.pendingMigrations.get(migrationId);
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    if (this.appliedMigrations.has(migration.version)) {
      throw new Error(`Migration already applied: ${migration.version}`);
    }

    const db = databaseArchitecture.getSupabaseClient();

    try {
      // Start transaction
      console.log(
        `Applying migration: ${migration.name} (${migration.version})`,
      );

      // Execute migration SQL
      const { error: migrationError } = await db.rpc("execute_migration", {
        migration_sql: migration.sql_up,
        migration_version: migration.version,
      });

      if (migrationError) {
        throw migrationError;
      }

      // Run validation queries
      await this.validateMigration(migration);

      // Record migration as applied
      const { error: recordError } = await db.from("schema_migrations").insert({
        version: migration.version,
        name: migration.name,
        description: migration.description,
        applied_at: new Date().toISOString(),
        checksum: this.calculateChecksum(migration.sql_up),
        quantum_optimized: migration.quantum_features.length > 0,
        rollback_sql: migration.sql_down,
      });

      if (recordError) {
        throw recordError;
      }

      // Update local state
      this.appliedMigrations.set(migration.version, {
        version: migration.version,
        description: migration.description,
        applied_at: new Date(),
        rollback_sql: migration.sql_down,
        checksum: this.calculateChecksum(migration.sql_up),
        quantum_optimized: migration.quantum_features.length > 0,
      });

      this.pendingMigrations.delete(migrationId);

      // Execute post-migration tasks
      await this.executePostMigrationTasks(migration);

      console.log(`Migration applied successfully: ${migration.name}`);
    } catch (error) {
      console.error(`Migration failed: ${migration.name}`, error);
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(version: string): Promise<void> {
    const appliedMigration = this.appliedMigrations.get(version);
    if (!appliedMigration) {
      throw new Error(`Migration not applied: ${version}`);
    }

    if (!appliedMigration.rollback_sql) {
      throw new Error(`No rollback SQL available for migration: ${version}`);
    }

    const db = databaseArchitecture.getSupabaseClient();

    try {
      console.log(`Rolling back migration: ${version}`);

      // Execute rollback SQL
      const { error: rollbackError } = await db.rpc("execute_migration", {
        migration_sql: appliedMigration.rollback_sql,
        migration_version: `rollback_${version}`,
      });

      if (rollbackError) {
        throw rollbackError;
      }

      // Remove migration record
      const { error: removeError } = await db
        .from("schema_migrations")
        .delete()
        .eq("version", version);

      if (removeError) {
        throw removeError;
      }

      // Update local state
      this.appliedMigrations.delete(version);

      console.log(`Migration rolled back successfully: ${version}`);
    } catch (error) {
      console.error(`Rollback failed: ${version}`, error);
      throw error;
    }
  }

  /**
   * Apply all pending migrations
   */
  async applyAllPendingMigrations(): Promise<void> {
    const pending = Array.from(this.pendingMigrations.values()).sort((a, b) =>
      a.version.localeCompare(b.version),
    );

    for (const migration of pending) {
      await this.applyMigration(migration.id);
    }
  }

  /**
   * Validate schema integrity
   */
  async validateSchema(): Promise<SchemaValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let quantumCompatibility = true;
    let performanceScore = 100;
    let securityScore = 100;

    try {
      const db = databaseArchitecture.getSupabaseClient();

      // Check table existence and structure
      for (const [tableName, schema] of this.currentSchema) {
        const { data: tableInfo, error } = await db.rpc("get_table_info", {
          table_name: tableName,
          schema_name: schema.schema_name,
        });

        if (error) {
          errors.push(`Cannot validate table ${tableName}: ${error.message}`);
          continue;
        }

        if (!tableInfo) {
          errors.push(`Table does not exist: ${tableName}`);
          continue;
        }

        // Validate columns
        const missingColumns = schema.columns.filter(
          (col) =>
            !tableInfo.columns?.some((dbCol: any) => dbCol.name === col.name),
        );

        if (missingColumns.length > 0) {
          errors.push(
            `Missing columns in ${tableName}: ${missingColumns.map((c) => c.name).join(", ")}`,
          );
        }

        // Validate indexes
        const missingIndexes = schema.indexes.filter(
          (idx) =>
            !tableInfo.indexes?.some((dbIdx: any) => dbIdx.name === idx.name),
        );

        if (missingIndexes.length > 0) {
          warnings.push(
            `Missing indexes in ${tableName}: ${missingIndexes.map((i) => i.name).join(", ")}`,
          );
          performanceScore -= 10;
        }

        // Validate quantum optimizations
        if (
          schema.quantum_optimizations.enable_vector_similarity &&
          !tableInfo.extensions?.includes("vector")
        ) {
          warnings.push(
            `Vector extension not enabled for quantum-optimized table: ${tableName}`,
          );
          quantumCompatibility = false;
        }
      }

      // Check for security best practices
      const { data: securityCheck } = await db.rpc(
        "check_security_configuration",
      );
      if (!securityCheck?.row_level_security) {
        warnings.push("Row Level Security is not enabled globally");
        securityScore -= 20;
      }

      if (!securityCheck?.encryption_at_rest) {
        errors.push("Encryption at rest is not enabled");
        securityScore -= 30;
      }
    } catch (error) {
      errors.push(`Schema validation error: ${error}`);
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      quantum_compatibility: quantumCompatibility,
      performance_score: Math.max(0, performanceScore),
      security_score: Math.max(0, securityScore),
    };
  }

  /**
   * Generate migration SQL for schema changes
   */
  generateMigrationSQL(
    tableName: string,
    oldSchema: TableSchema,
    newSchema: TableSchema,
  ): { up: string; down: string } {
    const upSQL: string[] = [];
    const downSQL: string[] = [];

    // Column changes
    const oldColumns = new Map(oldSchema.columns.map((c) => [c.name, c]));
    const newColumns = new Map(newSchema.columns.map((c) => [c.name, c]));

    // Added columns
    for (const [name, column] of newColumns) {
      if (!oldColumns.has(name)) {
        upSQL.push(
          `ALTER TABLE ${tableName} ADD COLUMN ${this.columnDefinitionSQL(column)};`,
        );
        downSQL.unshift(`ALTER TABLE ${tableName} DROP COLUMN ${name};`);
      }
    }

    // Removed columns
    for (const [name, column] of oldColumns) {
      if (!newColumns.has(name)) {
        upSQL.push(`ALTER TABLE ${tableName} DROP COLUMN ${name};`);
        downSQL.unshift(
          `ALTER TABLE ${tableName} ADD COLUMN ${this.columnDefinitionSQL(column)};`,
        );
      }
    }

    // Index changes
    const oldIndexes = new Set(oldSchema.indexes.map((i) => i.name));
    const newIndexes = new Set(newSchema.indexes.map((i) => i.name));

    // Added indexes
    newSchema.indexes.forEach((index) => {
      if (!oldIndexes.has(index.name)) {
        upSQL.push(this.createIndexSQL(tableName, index));
        downSQL.unshift(`DROP INDEX IF EXISTS ${index.name};`);
      }
    });

    // Removed indexes
    oldSchema.indexes.forEach((index) => {
      if (!newIndexes.has(index.name)) {
        upSQL.push(`DROP INDEX IF EXISTS ${index.name};`);
        downSQL.unshift(this.createIndexSQL(tableName, index));
      }
    });

    return {
      up: upSQL.join("\n"),
      down: downSQL.join("\n"),
    };
  }

  private columnDefinitionSQL(column: ColumnDefinition): string {
    let sql = `${column.name} ${column.type}`;

    if (!column.nullable) {
      sql += " NOT NULL";
    }

    if (column.default_value !== undefined) {
      sql += ` DEFAULT ${column.default_value}`;
    }

    return sql;
  }

  private createIndexSQL(tableName: string, index: IndexDefinition): string {
    const unique = index.unique ? "UNIQUE " : "";
    const using = index.type !== "btree" ? ` USING ${index.type}` : "";
    const columns = index.columns.join(", ");
    const where = index.partial_condition
      ? ` WHERE ${index.partial_condition}`
      : "";

    return `CREATE ${unique}INDEX ${index.name} ON ${tableName}${using} (${columns})${where};`;
  }

  private async validateMigration(migration: Migration): Promise<void> {
    if (migration.validation_queries.length === 0) return;

    const db = databaseArchitecture.getSupabaseClient();

    for (const query of migration.validation_queries) {
      const { error } = await db.rpc("execute_sql", { sql_query: query });
      if (error) {
        throw new Error(
          `Migration validation failed: ${query} - ${error.message}`,
        );
      }
    }
  }

  private async executePostMigrationTasks(migration: Migration): Promise<void> {
    for (const task of migration.post_migration_tasks) {
      try {
        // Execute post-migration task (could be data migration, index rebuilding, etc.)
        console.log(`Executing post-migration task: ${task}`);

        if (task.startsWith("REINDEX")) {
          const db = databaseArchitecture.getSupabaseClient();
          await db.rpc("execute_sql", { sql_query: task });
        }

        // Add more task types as needed
      } catch (error) {
        console.warn(`Post-migration task failed: ${task}`, error);
      }
    }
  }

  private calculateChecksum(sql: string): string {
    // Simple checksum calculation (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get all applied migrations
   */
  getAppliedMigrations(): SchemaVersion[] {
    return Array.from(this.appliedMigrations.values()).sort((a, b) =>
      a.version.localeCompare(b.version),
    );
  }

  /**
   * Get all pending migrations
   */
  getPendingMigrations(): Migration[] {
    return Array.from(this.pendingMigrations.values()).sort((a, b) =>
      a.version.localeCompare(b.version),
    );
  }

  /**
   * Get current schema
   */
  getCurrentSchema(): TableSchema[] {
    return Array.from(this.currentSchema.values());
  }

  /**
   * Update table schema
   */
  updateTableSchema(tableName: string, schema: TableSchema): void {
    this.currentSchema.set(tableName, schema);
  }

  /**
   * Export schema as SQL
   */
  exportSchemaSQL(): string {
    const sql: string[] = [];

    for (const [tableName, schema] of this.currentSchema) {
      sql.push(`-- Table: ${tableName}`);
      sql.push(`CREATE TABLE ${tableName} (`);

      const columnDefs = schema.columns.map(
        (col) => `  ${this.columnDefinitionSQL(col)}`,
      );
      sql.push(columnDefs.join(",\n"));
      sql.push(");");
      sql.push("");

      // Add indexes
      schema.indexes.forEach((index) => {
        sql.push(this.createIndexSQL(tableName, index));
      });

      sql.push("");
    }

    return sql.join("\n");
  }
}

// Export singleton instance
export const databaseSchemaManager = DatabaseSchemaManager.getInstance();
export default DatabaseSchemaManager;
