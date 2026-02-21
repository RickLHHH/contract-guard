/**
 * 文件访问 API
 * 支持文件预览和下载
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, getFileInfo } from '@/lib/file-storage';
import path from 'path';

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * GET /api/files/[...path] - 获取文件
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const fileId = pathSegments.join('/');
    
    if (!fileId) {
      return NextResponse.json(
        { error: '文件路径不能为空' },
        { status: 400 }
      );
    }
    
    // 检查文件是否存在
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo.exists) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }
    
    // 读取文件内容
    const buffer = await readFile(fileId);
    
    // 确定 MIME 类型
    const ext = path.extname(fileId).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // 检查是否是下载请求
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';
    
    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Length', buffer.length.toString());
    
    if (download) {
      // 下载模式：提示浏览器下载
      const originalName = encodeURIComponent(fileInfo.metadata?.originalName || 'download');
      headers.set('Content-Disposition', `attachment; filename="${originalName}"`);
    } else {
      // 预览模式：内联显示
      headers.set('Content-Disposition', 'inline');
      // 设置缓存
      headers.set('Cache-Control', 'public, max-age=3600');
    }
    
    // 安全相关头部
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    
    return new NextResponse(buffer, { headers });
    
  } catch (error) {
    console.error('[API] 文件访问失败:', error);
    return NextResponse.json(
      { error: '文件访问失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
