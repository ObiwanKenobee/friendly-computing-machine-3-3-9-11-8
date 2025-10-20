/**
 * IPFS Service
 * Decentralized storage for reports, documents, and large data files
 */

import { create, IPFSHTTPClient } from "ipfs-http-client";

export interface IPFSFile {
  name: string;
  content: Buffer | Uint8Array | string;
  size?: number;
  mimeType?: string;
}

export interface IPFSUploadResult {
  hash: string;
  size: number;
  name: string;
  url: string;
  gateway: string;
}

export interface IPFSMetadata {
  hash: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  userId?: string;
  vaultId?: string;
  type: "report" | "document" | "image" | "data" | "backup";
  encrypted: boolean;
  tags: string[];
}

export interface FilecoinDeal {
  hash: string;
  dealId: string;
  minerId: string;
  price: string;
  duration: number;
  status: "active" | "pending" | "expired" | "failed";
  createdAt: Date;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  totalDeals: number;
  activePins: number;
  storageUsed: string;
  monthlyCost: number;
}

export class IPFSService {
  private static instance: IPFSService;
  private ipfs: IPFSHTTPClient;
  private gateway: string;
  private isConnected: boolean = false;
  private pinataApiKey?: string;
  private pinataSecretKey?: string;
  private web3StorageToken?: string;

  private constructor() {
    this.gateway =
      process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
    this.web3StorageToken = process.env.WEB3_STORAGE_TOKEN;

    this.initializeIPFS();
  }

  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService();
    }
    return IPFSService.instance;
  }

  private initializeIPFS(): void {
    try {
      // Try connecting to local IPFS node first
      this.ipfs = create({
        host: process.env.IPFS_HOST || "localhost",
        port: parseInt(process.env.IPFS_PORT || "5001"),
        protocol: process.env.IPFS_PROTOCOL || "http",
        timeout: 10000,
      });

      this.testConnection();
    } catch (error) {
      console.error("Failed to initialize IPFS:", error);
      this.initializeFallback();
    }
  }

  private initializeFallback(): void {
    // Fallback to public IPFS gateway
    try {
      this.ipfs = create({
        host: "ipfs.infura.io",
        port: 5001,
        protocol: "https",
        headers: {
          authorization: process.env.INFURA_PROJECT_SECRET
            ? `Basic ${Buffer.from(process.env.INFURA_PROJECT_ID + ":" + process.env.INFURA_PROJECT_SECRET).toString("base64")}`
            : undefined,
        },
      });

      this.testConnection();
    } catch (error) {
      console.error("Failed to initialize IPFS fallback:", error);
    }
  }

  private async testConnection(): Promise<void> {
    try {
      const version = await this.ipfs.version();
      console.log(`✅ IPFS connected - Version: ${version.version}`);
      this.isConnected = true;
    } catch (error) {
      console.error("❌ IPFS connection test failed:", error);
      this.isConnected = false;
    }
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(
    file: IPFSFile,
    options: {
      pin?: boolean;
      encrypt?: boolean;
      metadata?: Partial<IPFSMetadata>;
    } = {},
  ): Promise<IPFSUploadResult> {
    if (!this.isConnected) {
      throw new Error("IPFS not connected");
    }

    try {
      let content = file.content;

      // Encrypt if requested
      if (options.encrypt) {
        content = await this.encryptContent(content);
      }

      // Upload to IPFS
      const result = await this.ipfs.add(
        {
          path: file.name,
          content,
        },
        {
          pin: options.pin !== false, // Pin by default
          cidVersion: 1,
          hashAlg: "sha2-256",
        },
      );

      const hash = result.cid.toString();
      const size = result.size;
      const url = `${this.gateway}${hash}`;

      // Store metadata if provided
      if (options.metadata) {
        await this.storeMetadata(hash, {
          hash,
          name: file.name,
          size,
          mimeType: file.mimeType || "application/octet-stream",
          uploadedAt: new Date(),
          encrypted: options.encrypt || false,
          tags: [],
          type: "document",
          ...options.metadata,
        });
      }

      // Pin to additional services if available
      if (options.pin && this.pinataApiKey) {
        await this.pinToPinata(hash, file.name);
      }

      return {
        hash,
        size,
        name: file.name,
        url,
        gateway: this.gateway,
      };
    } catch (error) {
      console.error("IPFS upload failed:", error);
      throw new Error(`Failed to upload to IPFS: ${error}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: IPFSFile[],
    options: {
      pin?: boolean;
      encrypt?: boolean;
      folderName?: string;
    } = {},
  ): Promise<IPFSUploadResult[]> {
    const results: IPFSUploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Retrieve file from IPFS
   */
  async getFile(
    hash: string,
    options: {
      decrypt?: boolean;
      timeout?: number;
    } = {},
  ): Promise<Buffer> {
    if (!this.isConnected) {
      throw new Error("IPFS not connected");
    }

    try {
      const stream = this.ipfs.cat(hash, {
        timeout: options.timeout || 30000,
      });

      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      let content = Buffer.concat(chunks);

      // Decrypt if requested
      if (options.decrypt) {
        content = await this.decryptContent(content);
      }

      return content;
    } catch (error) {
      console.error("IPFS retrieval failed:", error);
      throw new Error(`Failed to retrieve from IPFS: ${error}`);
    }
  }

  /**
   * Get file info without downloading
   */
  async getFileInfo(hash: string): Promise<{
    hash: string;
    size: number;
    type: string;
    links: any[];
  }> {
    if (!this.isConnected) {
      throw new Error("IPFS not connected");
    }

    try {
      const stat = await this.ipfs.object.stat(hash);
      const data = await this.ipfs.object.data(hash);

      return {
        hash,
        size: stat.CumulativeSize,
        type: stat.DataSize > 0 ? "file" : "directory",
        links: stat.Links,
      };
    } catch (error) {
      console.error("IPFS file info failed:", error);
      throw new Error(`Failed to get file info: ${error}`);
    }
  }

  /**
   * Pin file to ensure persistence
   */
  async pinFile(hash: string, name?: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("IPFS not connected");
    }

    try {
      await this.ipfs.pin.add(hash);

      // Also pin to external services
      if (this.pinataApiKey && name) {
        await this.pinToPinata(hash, name);
      }

      console.log(`✅ Pinned file: ${hash}`);
    } catch (error) {
      console.error("IPFS pinning failed:", error);
      throw new Error(`Failed to pin file: ${error}`);
    }
  }

  /**
   * Unpin file
   */
  async unpinFile(hash: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error("IPFS not connected");
    }

    try {
      await this.ipfs.pin.rm(hash);
      console.log(`🗑️ Unpinned file: ${hash}`);
    } catch (error) {
      console.error("IPFS unpinning failed:", error);
      throw new Error(`Failed to unpin file: ${error}`);
    }
  }

  /**
   * List pinned files
   */
  async listPinnedFiles(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error("IPFS not connected");
    }

    try {
      const pinnedFiles: string[] = [];
      for await (const { cid } of this.ipfs.pin.ls()) {
        pinnedFiles.push(cid.toString());
      }
      return pinnedFiles;
    } catch (error) {
      console.error("IPFS list pins failed:", error);
      throw new Error(`Failed to list pinned files: ${error}`);
    }
  }

  /**
   * Pin to Pinata for additional redundancy
   */
  private async pinToPinata(hash: string, name: string): Promise<void> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      return;
    }

    try {
      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinByHash",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
          body: JSON.stringify({
            hashToPin: hash,
            pinataMetadata: {
              name: name,
              keyvalues: {
                source: "quantumvest",
                timestamp: new Date().toISOString(),
              },
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Pinata API error: ${response.statusText}`);
      }

      console.log(`✅ Pinned to Pinata: ${hash}`);
    } catch (error) {
      console.error("Pinata pinning failed:", error);
      // Don't throw error, just log it
    }
  }

  /**
   * Upload to Web3.Storage for Filecoin deals
   */
  async uploadToFilecoin(
    file: IPFSFile,
    options: {
      dealDuration?: number; // in days
      price?: string;
      metadata?: Partial<IPFSMetadata>;
    } = {},
  ): Promise<FilecoinDeal> {
    if (!this.web3StorageToken) {
      throw new Error("Web3.Storage token not configured");
    }

    try {
      // First upload to IPFS
      const ipfsResult = await this.uploadFile(file, { pin: true });

      // Create Filecoin deal via Web3.Storage
      const response = await fetch("https://api.web3.storage/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.web3StorageToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cid: ipfsResult.hash,
          name: file.name,
          duration: options.dealDuration || 180, // 6 months default
        }),
      });

      if (!response.ok) {
        throw new Error(`Web3.Storage API error: ${response.statusText}`);
      }

      const result = await response.json();

      const deal: FilecoinDeal = {
        hash: ipfsResult.hash,
        dealId: result.dealId || "pending",
        minerId: result.minerId || "unknown",
        price: options.price || "0",
        duration: options.dealDuration || 180,
        status: "pending",
        createdAt: new Date(),
      };

      // Store deal information
      await this.storeFilecoinDeal(deal);

      return deal;
    } catch (error) {
      console.error("Filecoin upload failed:", error);
      throw new Error(`Failed to create Filecoin deal: ${error}`);
    }
  }

  /**
   * Check Filecoin deal status
   */
  async checkFilecoinDeal(dealId: string): Promise<FilecoinDeal | null> {
    // This would typically query the Filecoin network or Web3.Storage API
    // For now, return stored deal info
    return await this.getFilecoinDeal(dealId);
  }

  /**
   * Store metadata in IPFS itself
   */
  private async storeMetadata(
    hash: string,
    metadata: IPFSMetadata,
  ): Promise<void> {
    try {
      const metadataFile: IPFSFile = {
        name: `${hash}.metadata.json`,
        content: JSON.stringify(metadata, null, 2),
        mimeType: "application/json",
      };

      await this.uploadFile(metadataFile, { pin: true });
    } catch (error) {
      console.error("Failed to store metadata:", error);
    }
  }

  /**
   * Store Filecoin deal information
   */
  private async storeFilecoinDeal(deal: FilecoinDeal): Promise<void> {
    try {
      const dealFile: IPFSFile = {
        name: `deal-${deal.dealId}.json`,
        content: JSON.stringify(deal, null, 2),
        mimeType: "application/json",
      };

      await this.uploadFile(dealFile, { pin: true });
    } catch (error) {
      console.error("Failed to store Filecoin deal:", error);
    }
  }

  /**
   * Get stored Filecoin deal
   */
  private async getFilecoinDeal(dealId: string): Promise<FilecoinDeal | null> {
    try {
      // This is a simplified implementation
      // In practice, you'd maintain an index of deals
      return null;
    } catch (error) {
      console.error("Failed to get Filecoin deal:", error);
      return null;
    }
  }

  /**
   * Simple encryption (for demo purposes - use proper encryption in production)
   */
  private async encryptContent(
    content: Buffer | Uint8Array | string,
  ): Promise<Buffer> {
    // This is a placeholder implementation
    // In production, use proper encryption like AES-256-GCM
    const key = process.env.ENCRYPTION_KEY || "default-key-change-me";
    const textContent = Buffer.isBuffer(content) ? content.toString() : content;

    // Simple XOR encryption (NOT secure - replace with proper encryption)
    const encrypted = Buffer.from(textContent).map(
      (byte, index) => byte ^ key.charCodeAt(index % key.length),
    );

    return Buffer.from(encrypted);
  }

  /**
   * Simple decryption (for demo purposes - use proper decryption in production)
   */
  private async decryptContent(encryptedContent: Buffer): Promise<Buffer> {
    // This is a placeholder implementation
    const key = process.env.ENCRYPTION_KEY || "default-key-change-me";

    // Simple XOR decryption (NOT secure - replace with proper decryption)
    const decrypted = encryptedContent.map(
      (byte, index) => byte ^ key.charCodeAt(index % key.length),
    );

    return Buffer.from(decrypted);
  }

  /**
   * Generate storage report
   */
  async generateStorageReport(): Promise<StorageStats> {
    try {
      const pinnedFiles = await this.listPinnedFiles();
      let totalSize = 0;

      // Calculate total size of pinned files
      for (const hash of pinnedFiles) {
        try {
          const info = await this.getFileInfo(hash);
          totalSize += info.size;
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      return {
        totalFiles: pinnedFiles.length,
        totalSize,
        totalDeals: 0, // Would query Filecoin deals
        activePins: pinnedFiles.length,
        storageUsed: this.formatBytes(totalSize),
        monthlyCost: this.calculateMonthlyCost(totalSize),
      };
    } catch (error) {
      console.error("Failed to generate storage report:", error);
      return {
        totalFiles: 0,
        totalSize: 0,
        totalDeals: 0,
        activePins: 0,
        storageUsed: "0 B",
        monthlyCost: 0,
      };
    }
  }

  /**
   * Utility: Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Utility: Calculate estimated monthly cost
   */
  private calculateMonthlyCost(totalSizeBytes: number): number {
    // Rough estimates for IPFS pinning services
    const sizeInGB = totalSizeBytes / (1024 * 1024 * 1024);
    const costPerGBPerMonth = 0.15; // $0.15 per GB per month (approximate)
    return sizeInGB * costPerGBPerMonth;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    connected: boolean;
    version?: string;
    peersConnected?: number;
  }> {
    try {
      if (!this.isConnected) {
        await this.testConnection();
      }

      const version = await this.ipfs.version();
      const swarmPeers = await this.ipfs.swarm.peers();

      return {
        status: "healthy",
        connected: this.isConnected,
        version: version.version,
        peersConnected: swarmPeers.length,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        connected: false,
      };
    }
  }

  /**
   * Cleanup old files
   */
  async cleanup(
    options: {
      maxAge?: number; // in days
      maxSize?: number; // in bytes
      keepImportant?: boolean;
    } = {},
  ): Promise<{ removed: number; spaceFreed: number }> {
    const maxAge = options.maxAge || 90; // 90 days default
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
    const cutoffDate = Date.now() - maxAgeMs;

    let removed = 0;
    let spaceFreed = 0;

    try {
      const pinnedFiles = await this.listPinnedFiles();

      for (const hash of pinnedFiles) {
        try {
          // Check if file is old enough to remove
          // This is simplified - in practice, you'd check metadata
          const info = await this.getFileInfo(hash);

          // Skip important files if requested
          if (options.keepImportant) {
            // Logic to identify important files
            continue;
          }

          await this.unpinFile(hash);
          removed++;
          spaceFreed += info.size;

          // Stop if we've freed enough space
          if (options.maxSize && spaceFreed >= options.maxSize) {
            break;
          }
        } catch (error) {
          console.error(`Failed to remove file ${hash}:`, error);
        }
      }

      return { removed, spaceFreed };
    } catch (error) {
      console.error("Cleanup failed:", error);
      return { removed: 0, spaceFreed: 0 };
    }
  }
}

// Export singleton instance
export const ipfsService = IPFSService.getInstance();
export default IPFSService;
