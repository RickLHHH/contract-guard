import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/knowledge - List knowledge documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('q');
    
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    const docs = await prisma.knowledgeDoc.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json({ docs });
  } catch (error) {
    console.error('List knowledge docs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge documents' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge - Create knowledge document
export async function POST(request: NextRequest) {
  try {
    const { title, type, content, metadata } = await request.json();
    
    if (!title || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const doc = await prisma.knowledgeDoc.create({
      data: {
        title,
        type,
        content,
        metadata: metadata || {},
      },
    });
    
    return NextResponse.json({ success: true, doc });
  } catch (error) {
    console.error('Create knowledge doc error:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
