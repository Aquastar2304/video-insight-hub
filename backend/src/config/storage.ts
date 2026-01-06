import { S3 } from 'aws-sdk';
import fs from 'fs';
import path from 'path';

export interface StorageService {
  uploadFile(filePath: string, key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getFileUrl(key: string): Promise<string>;
}

// Local filesystem storage (for development)
class LocalStorageService implements StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(filePath: string, key: string): Promise<string> {
    const destPath = path.join(this.uploadDir, key);
    const destDir = path.dirname(destPath);
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(filePath, destPath);
    return `/uploads/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getFileUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }
}

// AWS S3 storage (for production)
class S3StorageService implements StorageService {
  private s3: S3;
  private bucket: string;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.bucket = process.env.S3_BUCKET_NAME || 'clipmind-videos';
  }

  async uploadFile(filePath: string, key: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath);
    
    const params: S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: fileContent,
      ContentType: 'video/mp4',
    };

    await this.s3.upload(params).promise();
    return `s3://${this.bucket}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const params: S3.DeleteObjectRequest = {
      Bucket: this.bucket,
      Key: key,
    };
    await this.s3.deleteObject(params).promise();
  }

  async getFileUrl(key: string): Promise<string> {
    // Generate presigned URL (valid for 1 hour)
    const params = {
      Bucket: this.bucket,
      Key: key,
      Expires: 3600,
    };
    return this.s3.getSignedUrlPromise('getObject', params);
  }
}

// Factory function to get storage service
export const getStorageService = (): StorageService => {
  const useS3 = process.env.USE_S3 === 'true' && 
                process.env.AWS_ACCESS_KEY_ID && 
                process.env.AWS_SECRET_ACCESS_KEY;

  if (useS3) {
    return new S3StorageService();
  }
  return new LocalStorageService();
};

