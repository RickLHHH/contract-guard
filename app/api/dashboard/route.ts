import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get total counts
    const totalContracts = await prisma.contract.count();
    const pendingReview = await prisma.contract.count({
      where: { status: { in: ['AI_REVIEWING', 'LEGAL_REVIEW'] } },
    });
    const pendingApproval = await prisma.contract.count({
      where: { status: 'APPROVING' },
    });
    
    // Get approved this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const approvedThisMonth = await prisma.contract.count({
      where: {
        status: 'APPROVED',
        completedAt: { gte: startOfMonth },
      },
    });
    
    // Get risk distribution
    const riskDistribution = {
      A: await prisma.contract.count({ where: { riskLevel: 'A' } }),
      B: await prisma.contract.count({ where: { riskLevel: 'B' } }),
      C: await prisma.contract.count({ where: { riskLevel: 'C' } }),
      D: await prisma.contract.count({ where: { riskLevel: 'D' } }),
    };
    
    // Get status distribution
    const statusDistribution = await prisma.contract.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    
    // Get recent contracts
    const recentContracts = await prisma.contract.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { name: true, avatar: true },
        },
        aiReview: {
          select: { riskScore: true },
        },
      },
    });
    
    // Get contracts by type
    const contractsByType = await prisma.contract.groupBy({
      by: ['type'],
      _count: { type: true },
    });
    
    // Calculate average review time (mock calculation)
    const avgReviewTime = 2.5; // days
    
    // Get monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      
      const count = await prisma.contract.count({
        where: {
          createdAt: { gte: start, lt: end },
        },
      });
      
      monthlyTrend.push({
        month: date.toLocaleString('zh-CN', { month: 'short' }),
        count,
      });
    }
    
    return NextResponse.json({
      stats: {
        totalContracts,
        pendingReview,
        pendingApproval,
        approvedThisMonth,
        averageReviewTime: avgReviewTime,
        riskDistribution,
        statusDistribution: statusDistribution.map(s => ({
          status: s.status,
          count: s._count.status,
        })),
        contractsByType: contractsByType.map(t => ({
          type: t.type,
          count: t._count.type,
        })),
        monthlyTrend,
      },
      recentContracts,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
