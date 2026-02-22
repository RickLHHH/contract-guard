/**
 * POST /api/contract/[id]/approve - 审批合同
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { ContractStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { action, comment } = await request.json();
    
    if (!action || !['APPROVE', 'REJECT', 'RETURN'].includes(action)) {
      return NextResponse.json({ error: '无效的审批操作' }, { status: 400 });
    }

    // 获取合同信息
    const contract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      return NextResponse.json({ error: '合同不存在' }, { status: 404 });
    }

    // 检查权限
    const canApprove = hasPermission(user.role, 'contract:approve');
    const canReview = hasPermission(user.role, 'contract:review');
    
    if (!canApprove && !canReview) {
      return NextResponse.json({ error: '无权审批' }, { status: 403 });
    }

    // 根据当前状态和审批操作更新状态
    let newStatus: ContractStatus = contract.status;
    
    switch (action) {
      case 'APPROVE':
        if (contract.status === 'LEGAL_REVIEW') {
          newStatus = 'APPROVING';
        } else if (contract.status === 'APPROVING') {
          newStatus = 'APPROVED';
        }
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
      case 'RETURN':
        newStatus = 'LEGAL_REVIEW';
        break;
    }

    // 更新合同状态
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt: newStatus === 'APPROVED' ? new Date() : null,
      },
    });

    // 创建审批记录
    await prisma.approval.create({
      data: {
        contractId: id,
        handlerId: user.id,
        action: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'RETURNED',
        comment: comment || '',
        executionId: '', // 简化实现，不关联完整工作流
      },
    });

    return NextResponse.json({
      success: true,
      contract: updatedContract,
    });
  } catch (error) {
    console.error('[API] 审批失败:', error);
    return NextResponse.json(
      { error: '审批失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
