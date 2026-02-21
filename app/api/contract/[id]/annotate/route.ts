import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/contract/[id]/annotate - List annotations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const annotations = await prisma.annotation.findMany({
      where: { contractId: id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ annotations });
  } catch (error) {
    console.error('List annotations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}

// POST /api/contract/[id]/annotate - Create annotation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      page,
      startOffset,
      endOffset,
      selectedText,
      type,
      content,
      visibility,
      authorId,
    } = await request.json();
    
    if (!content || !authorId) {
      return NextResponse.json(
        { error: 'Content and authorId are required' },
        { status: 400 }
      );
    }
    
    const annotation = await prisma.annotation.create({
      data: {
        contractId: id,
        page: page || 1,
        startOffset: startOffset || 0,
        endOffset: endOffset || 0,
        selectedText: selectedText || '',
        type: type || 'MANUAL_COMMENT',
        content,
        status: 'OPEN',
        visibility: visibility || 'INTERNAL',
        authorId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true },
        },
        replies: true,
      },
    });
    
    return NextResponse.json({ success: true, annotation });
  } catch (error) {
    console.error('Create annotation error:', error);
    return NextResponse.json(
      { error: 'Failed to create annotation' },
      { status: 500 }
    );
  }
}

// PATCH /api/contract/[id]/annotate - Update annotation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { annotationId, status, content } = await request.json();
    
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (content) updateData.content = content;
    if (status === 'RESOLVED') updateData.resolvedAt = new Date();
    
    const annotation = await prisma.annotation.update({
      where: { id: annotationId, contractId: id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true },
        },
        replies: true,
      },
    });
    
    return NextResponse.json({ success: true, annotation });
  } catch (error) {
    console.error('Update annotation error:', error);
    return NextResponse.json(
      { error: 'Failed to update annotation' },
      { status: 500 }
    );
  }
}

// DELETE /api/contract/[id]/annotate - Delete annotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { annotationId } = await request.json();
    
    await prisma.annotation.delete({
      where: { id: annotationId, contractId: id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete annotation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
