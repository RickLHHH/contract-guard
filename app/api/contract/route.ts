import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseFile, extractContractInfo } from '@/lib/file-parser';

// GET /api/contract - List contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const riskLevel = searchParams.get('riskLevel');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (riskLevel) where.riskLevel = riskLevel;
    
    const contracts = await prisma.contract.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, avatar: true, role: true },
        },
        aiReview: true,
        _count: {
          select: { annotations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    const total = await prisma.contract.count({ where });
    
    return NextResponse.json({
      contracts,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error('List contracts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST /api/contract - Create new contract
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const counterparty = formData.get('counterparty') as string;
    const amount = formData.get('amount') as string;
    const creatorId = formData.get('creatorId') as string || 'user-1';
    
    if (!file && !title) {
      return NextResponse.json(
        { error: 'File or title is required' },
        { status: 400 }
      );
    }
    
    let parsedText = '';
    let extractedInfo = {
      title: title || '未命名合同',
      type: type || 'OTHERS',
      counterparty: counterparty || '未知主体',
      amount: amount ? parseFloat(amount) : null,
    };
    
    // Parse uploaded file
    if (file) {
      const parsed = await parseFile(file);
      parsedText = parsed.text;
      
      // Override with extracted info if not provided
      const extracted = extractContractInfo(parsedText);
      if (!title) extractedInfo.title = extracted.title;
      if (!type) extractedInfo.type = extracted.type;
      if (!counterparty) extractedInfo.counterparty = extracted.counterparty;
      if (!amount && extracted.amount) extractedInfo.amount = extracted.amount;
    }
    
    // Create contract
    const contract = await prisma.contract.create({
      data: {
        title: extractedInfo.title,
        type: extractedInfo.type,
        status: 'AI_REVIEWING',
        counterparty: extractedInfo.counterparty,
        amount: extractedInfo.amount,
        originalFile: file?.name || '',
        parsedText,
        riskLevel: 'D',
        creatorId,
      },
    });
    
    // Create initial version
    await prisma.contractVersion.create({
      data: {
        contractId: contract.id,
        versionNumber: 1,
        fileUrl: file?.name || '',
        createdBy: creatorId,
      },
    });
    
    return NextResponse.json({
      success: true,
      contract: {
        ...contract,
        parsedText: undefined, // Don't return full text in response
      },
    });
    
  } catch (error) {
    console.error('Create contract error:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
