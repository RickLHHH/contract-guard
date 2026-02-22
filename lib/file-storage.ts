/**
 * 文件存储服务 - 支持本地存储和云存储
 * 企业级文件管理：保存、读取、删除、访问控制
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { mkdir } from 'fs/promises';

// 存储配置
const STORAGE_CONFIG = {
  // 本地存储路径 - 使用 /tmp 目录在 Railway 上有写权限
  localPath: process.env.FILE_STORAGE_PATH || '/tmp/uploads',
  // 最大文件大小 (20MB)
  maxFileSize: 20 * 1024 * 1024,
  // 允许的文件类型
  allowedTypes: ['.pdf', '.doc', '.docx', '.txt'],
  // 文件访问 URL 前缀
  publicUrlPrefix: process.env.FILE_PUBLIC_URL || '/api/files',
};

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploadedAt: Date;
  uploadedBy?: string;
}

export interface StoredFile {
  id: string;
  path: string;
  url: string;
  metadata: FileMetadata;
}

/**
 * 初始化存储目录
 */
export async function initStorage(): Promise<void> {
  const storagePath = path.resolve(STORAGE_CONFIG.localPath);
  
  try {
    await mkdir(storagePath, { recursive: true });
    
    // 创建子目录
    const subdirs = ['contracts', 'temp', 'exports'];
    for (const dir of subdirs) {
      await mkdir(path.join(storagePath, dir), { recursive: true });
    }
    
    console.log(`[FileStorage] 存储目录初始化完成: ${storagePath}`);
  } catch (error) {
    console.error('[FileStorage] 初始化失败:', error);
    throw error;
  }
}

/**
 * 保存文件
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  options?: {
    directory?: string;
    uploadedBy?: string;
  }
): Promise<StoredFile> {
  // 验证文件大小
  if (buffer.length > STORAGE_CONFIG.maxFileSize) {
    throw new Error(`文件大小超过限制 (${STORAGE_CONFIG.maxFileSize / 1024 / 1024}MB)`);
  }
  
  // 验证文件类型
  const ext = path.extname(originalName).toLowerCase();
  if (!STORAGE_CONFIG.allowedTypes.includes(ext)) {
    throw new Error(`不支持的文件类型: ${ext}`);
  }
  
  // 生成文件哈希（用于去重和校验）
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  
  // 生成唯一文件名: hash_originalName
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9\.\-_\u4e00-\u9fa5]/g, '_');
  const uniqueName = `${hash}_${sanitizedName}`;
  
  // 确定存储目录
  const subdir = options?.directory || 'contracts';
  const storagePath = path.resolve(STORAGE_CONFIG.localPath, subdir);
  
  // 确保目录存在
  await mkdir(storagePath, { recursive: true });
  
  // 文件完整路径
  const filePath = path.join(storagePath, uniqueName);
  
  // 写入文件
  await fs.writeFile(filePath, buffer);
  
  // 生成文件ID
  const fileId = `${subdir}/${uniqueName}`;
  
  // 构建访问 URL
  const fileUrl = `${STORAGE_CONFIG.publicUrlPrefix}/${fileId}`;
  
  const storedFile: StoredFile = {
    id: fileId,
    path: filePath,
    url: fileUrl,
    metadata: {
      originalName,
      mimeType,
      size: buffer.length,
      hash,
      uploadedAt: new Date(),
      uploadedBy: options?.uploadedBy,
    },
  };
  
  console.log(`[FileStorage] 文件保存成功: ${fileId}, 大小: ${buffer.length} bytes`);
  
  return storedFile;
}

/**
 * 读取文件
 */
export async function readFile(fileId: string): Promise<Buffer> {
  const filePath = path.resolve(STORAGE_CONFIG.localPath, fileId);
  
  // 安全检查：确保文件路径在存储目录内
  const storageRoot = path.resolve(STORAGE_CONFIG.localPath);
  if (!filePath.startsWith(storageRoot)) {
    throw new Error('非法文件路径');
  }
  
  try {
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error(`[FileStorage] 读取文件失败: ${fileId}`, error);
    throw new Error('文件不存在或无法读取');
  }
}

/**
 * 获取文件信息
 */
export async function getFileInfo(fileId: string): Promise<{ exists: boolean; metadata?: FileMetadata }> {
  const filePath = path.resolve(STORAGE_CONFIG.localPath, fileId);
  
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      metadata: {
        originalName: path.basename(fileId).split('_').slice(1).join('_'),
        mimeType: detectMimeType(fileId),
        size: stats.size,
        hash: path.basename(fileId).split('_')[0],
        uploadedAt: stats.mtime,
      },
    };
  } catch {
    return { exists: false };
  }
}

/**
 * 删除文件
 */
export async function deleteFile(fileId: string): Promise<void> {
  const filePath = path.resolve(STORAGE_CONFIG.localPath, fileId);
  
  // 安全检查
  const storageRoot = path.resolve(STORAGE_CONFIG.localPath);
  if (!filePath.startsWith(storageRoot)) {
    throw new Error('非法文件路径');
  }
  
  try {
    await fs.unlink(filePath);
    console.log(`[FileStorage] 文件删除成功: ${fileId}`);
  } catch (error) {
    console.error(`[FileStorage] 删除文件失败: ${fileId}`, error);
    throw error;
  }
}

/**
 * 复制文件（用于版本管理）
 */
export async function copyFile(sourceId: string, newName?: string): Promise<StoredFile> {
  const sourcePath = path.resolve(STORAGE_CONFIG.localPath, sourceId);
  const buffer = await fs.readFile(sourcePath);
  
  const originalName = newName || path.basename(sourceId).split('_').slice(1).join('_');
  const mimeType = detectMimeType(originalName);
  const subdir = path.dirname(sourceId);
  
  return saveFile(buffer, originalName, mimeType, { directory: subdir });
}

/**
 * 列出目录中的文件
 */
export async function listFiles(directory: string = 'contracts'): Promise<string[]> {
  const dirPath = path.resolve(STORAGE_CONFIG.localPath, directory);
  
  try {
    const files = await fs.readdir(dirPath);
    return files.map(f => `${directory}/${f}`);
  } catch {
    return [];
  }
}

/**
 * 清理临时文件
 */
export async function cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
  const tempPath = path.resolve(STORAGE_CONFIG.localPath, 'temp');
  let deletedCount = 0;
  
  try {
    const files = await fs.readdir(tempPath);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(tempPath, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    console.log(`[FileStorage] 清理临时文件: ${deletedCount} 个`);
    return deletedCount;
  } catch {
    return 0;
  }
}

/**
 * 检测 MIME 类型
 */
function detectMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 获取存储统计信息
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
}> {
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    byType: {} as Record<string, { count: number; size: number }>,
  };
  
  const scanDir = async (dir: string) => {
    const dirPath = path.resolve(STORAGE_CONFIG.localPath, dir);
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(dirPath, entry.name);
          const fileStats = await fs.stat(filePath);
          const ext = path.extname(entry.name).toLowerCase();
          
          stats.totalFiles++;
          stats.totalSize += fileStats.size;
          
          if (!stats.byType[ext]) {
            stats.byType[ext] = { count: 0, size: 0 };
          }
          stats.byType[ext].count++;
          stats.byType[ext].size += fileStats.size;
        }
      }
    } catch {
      // 忽略错误
    }
  };
  
  await scanDir('contracts');
  await scanDir('exports');
  
  return stats;
}

// 初始化存储（在应用启动时调用）
initStorage().catch(console.error);
