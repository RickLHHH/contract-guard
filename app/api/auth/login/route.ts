/**
 * POST /api/auth/login - 用户登录
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '请输入邮箱和密码' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码（如果没有设置密码，则使用默认验证）
    let isValidPassword = false;
    if ((user as any).passwordHash) {
      isValidPassword = await verifyPassword(password, (user as any).passwordHash);
    } else {
      // 开发环境：使用默认密码验证
      isValidPassword = password === 'password123' || password === 'admin123';
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 生成 JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // 设置 Cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('[Auth] 登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请重试' },
      { status: 500 }
    );
  }
}
