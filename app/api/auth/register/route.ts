/**
 * POST /api/auth/register - 用户注册
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, department } = await request.json();

    // 验证输入
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    // 密码强度验证
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为6位' },
        { status: 400 }
      );
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        name,
        role: UserRole.BUSINESS_USER, // 默认角色
        department: department || '',
      },
    });

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
      },
    });
  } catch (error) {
    console.error('[Auth] 注册失败:', error);
    return NextResponse.json(
      { error: '注册失败，请重试' },
      { status: 500 }
    );
  }
}
