/**
 * Next.js 中间件 - 路由保护
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// 公开路由（不需要登录）
const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/auth/register'];

// API 路由前缀
const API_ROUTES = ['/api/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路由直接放行
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 检查认证 token
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    // API 路由返回 401
    if (API_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    // 页面路由重定向到登录页
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 验证 token
  const payload = verifyToken(token);
  
  if (!payload) {
    // Token 无效，清除 cookie 并重定向
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  // 已登录用户访问登录页，重定向到首页
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有路径，除了静态文件和 api
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
