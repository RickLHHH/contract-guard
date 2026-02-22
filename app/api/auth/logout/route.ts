/**
 * POST /api/auth/logout - 用户登出
 */

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth] 登出失败:', error);
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    );
  }
}
