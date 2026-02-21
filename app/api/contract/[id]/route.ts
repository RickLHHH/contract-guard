import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/contract/[id] - Get contract details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, role: true },
        },
        aiReview: true,
        annotations: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true, role: true },
            },
            replies: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        workflow: {
          include: {
            nodes: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
    
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    // Parse JSON fields
    const parsedContract = {
      ...contract,
      aiReview: contract.aiReview ? {
        ...contract.aiReview,
        keyRisks: safeJsonParse(contract.aiReview.keyRisks, []),
        missingClauses: safeJsonParse(contract.aiReview.missingClauses, []),
      } : null,
    };
    
    return NextResponse.json({ contract: parsedContract });
  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

// PATCH /api/contract/[id] - Update contract
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error('Update contract error:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

// DELETE /api/contract/[id] - Delete contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.contract.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contract error:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}

function safeJsonParse<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}
