/**
 * Next.js 中间件 - 路由保护
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// 公开路由（不需要登录）
const PUBLIC_ROUTES = ['/login', '/api/auth'];

// 完全公开的路径（用于测试）
const FULL_PUBLIC_PATHS = ['/', '/contracts', '/contracts/', '/pending', '/approved', '/settings', '/knowledge', '/team'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开 API 路由直接放行
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 静态文件直接放行
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/files')) {
    return NextResponse.next();
  }

  // 为了测试，主要页面都公开可访问
  // 生产环境应该移除这个条件
  if (FULL_PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 检查认证 token
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    // API 路由返回 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    // 其他页面放行（测试模式）
    return NextResponse.next();
  }

  // 验证 token
  const payload = verifyToken(token);
  
  if (!payload && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: '无效的 token' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
