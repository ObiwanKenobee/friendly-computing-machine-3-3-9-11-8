/**
 * QuantumVest Encryption Service
 * AES-256 for vault data encryption and X25519 for message signatures
 */

export interface EncryptionKey {
  id: string;
  type: "aes" | "x25519" | "ed25519" | "rsa";
  algorithm: string;
  key: CryptoKey;
  publicKey?: CryptoKey;
  created_at: Date;
  expires_at?: Date;
  usage: KeyUsage[];
  metadata?: Record<string, any>;
}

export interface EncryptedData {
  data: ArrayBuffer;
  iv: ArrayBuffer;
  salt: ArrayBuffer;
  algorithm: string;
  keyId: string;
  timestamp: Date;
  integrity_hash: string;
}

export interface SignedMessage {
  message: ArrayBuffer;
  signature: ArrayBuffer;
  algorithm: string;
  publicKey: ArrayBuffer;
  timestamp: Date;
  keyId: string;
}

export interface VaultEncryption {
  vault_id: string;
  encryption_key_id: string;
  encrypted_fields: string[];
  encryption_algorithm: string;
  key_derivation: KeyDerivationConfig;
  backup_keys: string[];
  created_at: Date;
  rotated_at?: Date;
}

export interface KeyDerivationConfig {
  algorithm: "pbkdf2" | "scrypt" | "argon2";
  iterations: number;
  salt_length: number;
  key_length: number;
  memory_cost?: number; // For scrypt/argon2
  parallelism?: number; // For argon2
}

export interface MessageSigningConfig {
  algorithm: "ed25519" | "x25519" | "secp256k1";
  key_derivation: "hkdf" | "pbkdf2";
  hash_function: "sha256" | "sha512" | "blake2b";
}

export interface QuantumResistantConfig {
  enabled: boolean;
  algorithm: "kyber" | "dilithium" | "falcon";
  security_level: 1 | 3 | 5;
  hybrid_mode: boolean; // Use with classical crypto
}

export interface CryptoPolicy {
  min_key_length: number;
  allowed_algorithms: string[];
  key_rotation_period: number; // days
  require_hardware_keys: boolean;
  quantum_resistant: boolean;
  compliance_level: "standard" | "fips" | "cc" | "quantum_safe";
}

export class EncryptionService {
  private static instance: EncryptionService;
  private keyStore: Map<string, EncryptionKey> = new Map();
  private vaultEncryption: Map<string, VaultEncryption> = new Map();
  private cryptoPolicy: CryptoPolicy;
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeCryptoPolicy();
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  private initializeCryptoPolicy(): void {
    this.cryptoPolicy = {
      min_key_length: 256,
      allowed_algorithms: [
        "AES-GCM",
        "AES-CBC",
        "ChaCha20-Poly1305",
        "Ed25519",
        "X25519",
        "ECDSA-P256",
        "RSA-OAEP",
        "RSA-PSS",
      ],
      key_rotation_period: 90, // 90 days
      require_hardware_keys: process.env.NODE_ENV === "production",
      quantum_resistant: true,
      compliance_level: "fips",
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check crypto support
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Web Crypto API not supported");
      }

      // Initialize master encryption keys
      await this.initializeMasterKeys();

      // Setup key rotation schedule
      this.setupKeyRotation();

      this.isInitialized = true;
      console.log("✅ Encryption service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize encryption service:", error);
      throw error;
    }
  }

  private async initializeMasterKeys(): Promise<void> {
    // Generate or load master AES key for vault encryption
    const masterKey = await this.generateOrLoadMasterKey();

    // Generate X25519 key pair for message signing
    const signingKeyPair = await this.generateSigningKeyPair();

    // Store keys securely
    await this.storeKey(masterKey);
    await this.storeKey(signingKeyPair.privateKey);
    await this.storeKey(signingKeyPair.publicKey);
  }

  private setupKeyRotation(): void {
    // Schedule regular key rotation
    const rotationInterval =
      this.cryptoPolicy.key_rotation_period * 24 * 60 * 60 * 1000;

    setInterval(async () => {
      await this.rotateExpiredKeys();
    }, rotationInterval);
  }

  /**
   * AES-256 Vault Encryption
   */
  async encryptVaultData(
    vaultId: string,
    data: any,
    fields?: string[],
  ): Promise<EncryptedData> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get or create vault encryption configuration
      let vaultConfig = this.vaultEncryption.get(vaultId);
      if (!vaultConfig) {
        vaultConfig = await this.createVaultEncryption(vaultId);
      }

      // Get encryption key
      const encryptionKey = this.keyStore.get(vaultConfig.encryption_key_id);
      if (!encryptionKey) {
        throw new Error("Encryption key not found");
      }

      // Prepare data for encryption
      const dataToEncrypt = fields ? this.selectFields(data, fields) : data;

      const plaintext = new TextEncoder().encode(JSON.stringify(dataToEncrypt));

      // Generate random IV and salt
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
      const salt = crypto.getRandomValues(new Uint8Array(32)); // 256-bit salt

      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
          additionalData: new TextEncoder().encode(vaultId), // Authenticated data
        },
        encryptionKey.key,
        plaintext,
      );

      // Calculate integrity hash
      const integrityHash = await this.calculateIntegrityHash(
        encrypted,
        iv,
        salt,
        vaultId,
      );

      const encryptedData: EncryptedData = {
        data: encrypted,
        iv: iv.buffer,
        salt: salt.buffer,
        algorithm: "AES-256-GCM",
        keyId: encryptionKey.id,
        timestamp: new Date(),
        integrity_hash: integrityHash,
      };

      // Log encryption event
      await this.logCryptoEvent("encrypt", vaultId, encryptionKey.id);

      return encryptedData;
    } catch (error) {
      console.error("Vault encryption failed:", error);
      throw new Error(`Failed to encrypt vault data: ${error}`);
    }
  }

  async decryptVaultData(
    vaultId: string,
    encryptedData: EncryptedData,
  ): Promise<any> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Verify integrity
      const calculatedHash = await this.calculateIntegrityHash(
        encryptedData.data,
        encryptedData.iv,
        encryptedData.salt,
        vaultId,
      );

      if (calculatedHash !== encryptedData.integrity_hash) {
        throw new Error("Data integrity check failed");
      }

      // Get decryption key
      const decryptionKey = this.keyStore.get(encryptedData.keyId);
      if (!decryptionKey) {
        throw new Error("Decryption key not found");
      }

      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(encryptedData.iv),
          additionalData: new TextEncoder().encode(vaultId),
        },
        decryptionKey.key,
        encryptedData.data,
      );

      // Convert back to object
      const plaintext = new TextDecoder().decode(decrypted);
      const data = JSON.parse(plaintext);

      // Log decryption event
      await this.logCryptoEvent("decrypt", vaultId, decryptionKey.id);

      return data;
    } catch (error) {
      console.error("Vault decryption failed:", error);
      throw new Error(`Failed to decrypt vault data: ${error}`);
    }
  }

  /**
   * X25519 Message Signing
   */
  async signMessage(
    message: string | ArrayBuffer,
    keyId?: string,
  ): Promise<SignedMessage> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get signing key
      const signingKey = keyId
        ? this.keyStore.get(keyId)
        : await this.getDefaultSigningKey();

      if (!signingKey || signingKey.type !== "ed25519") {
        throw new Error("Signing key not found or invalid type");
      }

      // Prepare message data
      const messageData =
        typeof message === "string"
          ? new TextEncoder().encode(message)
          : new Uint8Array(message);

      // Sign message
      const signature = await crypto.subtle.sign(
        "Ed25519",
        signingKey.key,
        messageData,
      );

      // Get public key for verification
      const publicKey = signingKey.publicKey;
      if (!publicKey) {
        throw new Error("Public key not available");
      }

      const publicKeyData = await crypto.subtle.exportKey("raw", publicKey);

      const signedMessage: SignedMessage = {
        message: messageData.buffer,
        signature,
        algorithm: "Ed25519",
        publicKey: publicKeyData,
        timestamp: new Date(),
        keyId: signingKey.id,
      };

      // Log signing event
      await this.logCryptoEvent("sign", "message", signingKey.id);

      return signedMessage;
    } catch (error) {
      console.error("Message signing failed:", error);
      throw new Error(`Failed to sign message: ${error}`);
    }
  }

  async verifySignature(signedMessage: SignedMessage): Promise<boolean> {
    try {
      // Import public key
      const publicKey = await crypto.subtle.importKey(
        "raw",
        signedMessage.publicKey,
        {
          name: "Ed25519",
          namedCurve: "Ed25519",
        },
        false,
        ["verify"],
      );

      // Verify signature
      const isValid = await crypto.subtle.verify(
        "Ed25519",
        publicKey,
        signedMessage.signature,
        signedMessage.message,
      );

      // Log verification event
      await this.logCryptoEvent("verify", "signature", signedMessage.keyId, {
        result: isValid,
      });

      return isValid;
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  /**
   * Key Derivation Functions
   */
  async deriveKey(
    password: string,
    salt: ArrayBuffer,
    config: KeyDerivationConfig,
  ): Promise<CryptoKey> {
    try {
      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"],
      );

      // Derive key using PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: config.iterations,
          hash: "SHA-256",
        },
        keyMaterial,
        {
          name: "AES-GCM",
          length: config.key_length * 8, // Convert bytes to bits
        },
        false,
        ["encrypt", "decrypt"],
      );

      return derivedKey;
    } catch (error) {
      console.error("Key derivation failed:", error);
      throw new Error(`Failed to derive key: ${error}`);
    }
  }

  async deriveKeyWithScrypt(
    password: string,
    salt: ArrayBuffer,
    config: KeyDerivationConfig,
  ): Promise<ArrayBuffer> {
    // Note: Web Crypto API doesn't support scrypt natively
    // This would require a WebAssembly implementation or server-side derivation
    throw new Error("Scrypt key derivation not implemented in Web Crypto API");
  }

  /**
   * Quantum-Resistant Encryption (Future-proofing)
   */
  async generateQuantumResistantKeys(
    config: QuantumResistantConfig,
  ): Promise<{ publicKey: ArrayBuffer; privateKey: ArrayBuffer }> {
    // This would implement post-quantum cryptographic algorithms
    // For now, we'll use a placeholder that combines multiple classical algorithms

    if (!config.enabled) {
      throw new Error("Quantum-resistant encryption not enabled");
    }

    // Generate multiple key pairs for hybrid approach
    const ed25519Keys = await this.generateEd25519KeyPair();
    const x25519Keys = await this.generateX25519KeyPair();

    // Combine keys (simplified approach - real implementation would use proper PQC)
    const publicKeys = await Promise.all([
      crypto.subtle.exportKey("raw", ed25519Keys.publicKey),
      crypto.subtle.exportKey("raw", x25519Keys.publicKey),
    ]);

    const privateKeys = await Promise.all([
      crypto.subtle.exportKey("pkcs8", ed25519Keys.privateKey),
      crypto.subtle.exportKey("pkcs8", x25519Keys.privateKey),
    ]);

    // Concatenate keys (real implementation would use proper PQC key format)
    const combinedPublicKey = new Uint8Array(
      publicKeys.reduce((acc, key) => acc + key.byteLength, 0),
    );
    const combinedPrivateKey = new Uint8Array(
      privateKeys.reduce((acc, key) => acc + key.byteLength, 0),
    );

    let offset = 0;
    publicKeys.forEach((key) => {
      combinedPublicKey.set(new Uint8Array(key), offset);
      offset += key.byteLength;
    });

    offset = 0;
    privateKeys.forEach((key) => {
      combinedPrivateKey.set(new Uint8Array(key), offset);
      offset += key.byteLength;
    });

    return {
      publicKey: combinedPublicKey.buffer,
      privateKey: combinedPrivateKey.buffer,
    };
  }

  /**
   * Key Management
   */
  async generateVaultKey(vaultId: string): Promise<EncryptionKey> {
    const key = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      false, // Not extractable for security
      ["encrypt", "decrypt"],
    );

    const encryptionKey: EncryptionKey = {
      id: `vault_${vaultId}_${crypto.randomUUID()}`,
      type: "aes",
      algorithm: "AES-256-GCM",
      key,
      created_at: new Date(),
      expires_at: new Date(
        Date.now() +
          this.cryptoPolicy.key_rotation_period * 24 * 60 * 60 * 1000,
      ),
      usage: ["encrypt", "decrypt"],
      metadata: {
        vault_id: vaultId,
        key_size: 256,
      },
    };

    await this.storeKey(encryptionKey);
    return encryptionKey;
  }

  async rotateVaultKey(vaultId: string): Promise<void> {
    try {
      const oldConfig = this.vaultEncryption.get(vaultId);
      if (!oldConfig) {
        throw new Error("Vault encryption configuration not found");
      }

      // Generate new key
      const newKey = await this.generateVaultKey(vaultId);

      // Re-encrypt all vault data with new key
      await this.reencryptVaultData(
        vaultId,
        oldConfig.encryption_key_id,
        newKey.id,
      );

      // Update vault configuration
      oldConfig.encryption_key_id = newKey.id;
      oldConfig.rotated_at = new Date();
      oldConfig.backup_keys.push(oldConfig.encryption_key_id);

      this.vaultEncryption.set(vaultId, oldConfig);

      // Archive old key (keep for backup decryption)
      await this.archiveKey(oldConfig.encryption_key_id);

      console.log(`✅ Vault key rotated for vault ${vaultId}`);
    } catch (error) {
      console.error("Key rotation failed:", error);
      throw error;
    }
  }

  private async rotateExpiredKeys(): Promise<void> {
    const now = new Date();

    for (const [keyId, key] of this.keyStore) {
      if (key.expires_at && key.expires_at < now) {
        if (key.metadata?.vault_id) {
          await this.rotateVaultKey(key.metadata.vault_id);
        }
      }
    }
  }

  /**
   * Utility Functions
   */
  private async generateOrLoadMasterKey(): Promise<EncryptionKey> {
    // In production, this would load from secure hardware or key management service
    const key = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"],
    );

    return {
      id: "master_key_" + crypto.randomUUID(),
      type: "aes",
      algorithm: "AES-256-GCM",
      key,
      created_at: new Date(),
      usage: ["encrypt", "decrypt"],
    };
  }

  private async generateSigningKeyPair(): Promise<{
    privateKey: EncryptionKey;
    publicKey: EncryptionKey;
  }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "Ed25519",
      },
      false,
      ["sign", "verify"],
    );

    const privateKey: EncryptionKey = {
      id: "signing_private_" + crypto.randomUUID(),
      type: "ed25519",
      algorithm: "Ed25519",
      key: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      created_at: new Date(),
      usage: ["sign"],
    };

    const publicKey: EncryptionKey = {
      id: "signing_public_" + crypto.randomUUID(),
      type: "ed25519",
      algorithm: "Ed25519",
      key: keyPair.publicKey,
      created_at: new Date(),
      usage: ["verify"],
    };

    return { privateKey, publicKey };
  }

  private async generateEd25519KeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: "Ed25519",
      },
      false,
      ["sign", "verify"],
    );
  }

  private async generateX25519KeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: "X25519",
      },
      false,
      ["deriveKey"],
    );
  }

  private async createVaultEncryption(
    vaultId: string,
  ): Promise<VaultEncryption> {
    const encryptionKey = await this.generateVaultKey(vaultId);

    const vaultEncryption: VaultEncryption = {
      vault_id: vaultId,
      encryption_key_id: encryptionKey.id,
      encrypted_fields: ["holdings", "transactions", "balance", "settings"],
      encryption_algorithm: "AES-256-GCM",
      key_derivation: {
        algorithm: "pbkdf2",
        iterations: 100000,
        salt_length: 32,
        key_length: 32,
      },
      backup_keys: [],
      created_at: new Date(),
    };

    this.vaultEncryption.set(vaultId, vaultEncryption);
    return vaultEncryption;
  }

  private selectFields(data: any, fields: string[]): any {
    const selected: any = {};
    fields.forEach((field) => {
      if (data.hasOwnProperty(field)) {
        selected[field] = data[field];
      }
    });
    return selected;
  }

  private async calculateIntegrityHash(
    data: ArrayBuffer,
    iv: ArrayBuffer,
    salt: ArrayBuffer,
    additionalData: string,
  ): Promise<string> {
    const combinedData = new Uint8Array(
      data.byteLength + iv.byteLength + salt.byteLength + additionalData.length,
    );

    let offset = 0;
    combinedData.set(new Uint8Array(data), offset);
    offset += data.byteLength;
    combinedData.set(new Uint8Array(iv), offset);
    offset += iv.byteLength;
    combinedData.set(new Uint8Array(salt), offset);
    offset += salt.byteLength;
    combinedData.set(new TextEncoder().encode(additionalData), offset);

    const hash = await crypto.subtle.digest("SHA-256", combinedData);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private async getDefaultSigningKey(): Promise<EncryptionKey | undefined> {
    for (const [, key] of this.keyStore) {
      if (key.type === "ed25519" && key.usage.includes("sign")) {
        return key;
      }
    }
    return undefined;
  }

  private async storeKey(key: EncryptionKey): Promise<void> {
    this.keyStore.set(key.id, key);
    // In production, also store in secure backend
  }

  private async archiveKey(keyId: string): Promise<void> {
    const key = this.keyStore.get(keyId);
    if (key) {
      // Mark as archived but keep for decryption
      key.metadata = { ...key.metadata, archived: true };
    }
  }

  private async reencryptVaultData(
    vaultId: string,
    oldKeyId: string,
    newKeyId: string,
  ): Promise<void> {
    // This would re-encrypt all vault data with the new key
    // Implementation would depend on the specific data storage strategy
    console.log(
      `Re-encrypting vault ${vaultId} data from ${oldKeyId} to ${newKeyId}`,
    );
  }

  private async logCryptoEvent(
    operation: string,
    resource: string,
    keyId: string,
    metadata?: any,
  ): Promise<void> {
    try {
      const event = {
        operation,
        resource,
        key_id: keyId,
        timestamp: new Date().toISOString(),
        metadata,
      };

      // Log to audit system
      console.log("Crypto event:", event);
    } catch (error) {
      console.error("Failed to log crypto event:", error);
    }
  }

  /**
   * Public API Methods
   */
  async getKeyInfo(keyId: string): Promise<Partial<EncryptionKey> | null> {
    const key = this.keyStore.get(keyId);
    if (!key) return null;

    // Return non-sensitive key information
    return {
      id: key.id,
      type: key.type,
      algorithm: key.algorithm,
      created_at: key.created_at,
      expires_at: key.expires_at,
      usage: key.usage,
      metadata: key.metadata,
    };
  }

  async listVaultKeys(vaultId: string): Promise<string[]> {
    const vaultConfig = this.vaultEncryption.get(vaultId);
    if (!vaultConfig) return [];

    return [vaultConfig.encryption_key_id, ...vaultConfig.backup_keys];
  }

  async exportPublicKey(keyId: string): Promise<ArrayBuffer | null> {
    const key = this.keyStore.get(keyId);
    if (!key || !key.publicKey) return null;

    try {
      return await crypto.subtle.exportKey("raw", key.publicKey);
    } catch (error) {
      console.error("Failed to export public key:", error);
      return null;
    }
  }

  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    initialized: boolean;
    keyCount: number;
    vaultCount: number;
    policy: CryptoPolicy;
  }> {
    return {
      status: this.isInitialized ? "healthy" : "unhealthy",
      initialized: this.isInitialized,
      keyCount: this.keyStore.size,
      vaultCount: this.vaultEncryption.size,
      policy: this.cryptoPolicy,
    };
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();
export default EncryptionService;
