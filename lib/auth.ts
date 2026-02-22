/**
 * 用户认证系统 - JWT Based Authentication
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * 密码验证
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 从请求中获取当前用户
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * 设置认证 Cookie
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * 清除认证 Cookie
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

/**
 * 权限检查
 */
export function checkPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// 角色权限映射
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: ['*'], // 所有权限
  [UserRole.CEO]: ['contract:read', 'contract:approve', 'contract:reject', 'dashboard:read'],
  [UserRole.LEGAL_DIRECTOR]: ['contract:read', 'contract:approve', 'contract:reject', 'contract:review'],
  [UserRole.LEGAL_SPECIALIST]: ['contract:read', 'contract:review', 'contract:annotate'],
  [UserRole.FINANCE]: ['contract:read', 'contract:finance_review'],
  [UserRole.BUSINESS_USER]: ['contract:read', 'contract:create', 'contract:edit_own'],
};

/**
 * 检查用户是否有特定权限
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes('*') || permissions.includes(permission);
}
