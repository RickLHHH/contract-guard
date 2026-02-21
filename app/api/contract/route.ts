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
    console.log('=== Contract Upload Started ===');
    
    // Check if request has form data
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      );
    }
    
    let formData: FormData;
    try {
      formData = await request.formData();
      console.log('FormData parsed successfully');
    } catch (e) {
      console.error('Failed to parse form data:', e);
      return NextResponse.json(
        { error: 'Failed to parse form data' },
        { status: 400 }
      );
    }
    
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const type = formData.get('type') as string | null;
    const counterparty = formData.get('counterparty') as string | null;
    const amount = formData.get('amount') as string | null;
    const creatorId = formData.get('creatorId') as string || 'user-1';
    
    console.log('Received fields:', {
      hasFile: !!file,
      fileName: file?.name || 'N/A',
      fileSize: file?.size || 0,
      title: title || 'N/A',
      type: type || 'N/A',
      counterparty: counterparty || 'N/A',
      amount: amount || 'N/A',
      creatorId,
    });
    
    if (!file && !title) {
      console.error('Validation failed: No file or title provided');
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
    
    // Parse uploaded file if exists
    if (file && file.size > 0) {
      console.log('Parsing file:', file.name);
      try {
        const parsed = await parseFile(file);
        parsedText = parsed.text;
        console.log('File parsed successfully, text length:', parsedText.length);
        
        // Override with extracted info if not provided
        const extracted = extractContractInfo(parsedText);
        if (!title) extractedInfo.title = extracted.title;
        if (!type) extractedInfo.type = extracted.type;
        if (!counterparty) extractedInfo.counterparty = extracted.counterparty;
        if (!amount && extracted.amount) extractedInfo.amount = extracted.amount;
      } catch (parseError) {
        console.error('File parsing error:', parseError);
        // Continue with empty parsedText, don't fail the upload
        parsedText = '';
      }
    } else {
      console.log('No file provided or file is empty');
    }
    
    console.log('Creating contract with data:', {
      title: extractedInfo.title,
      type: extractedInfo.type,
      counterparty: extractedInfo.counterparty,
      amount: extractedInfo.amount,
      hasParsedText: !!parsedText,
    });
    
    // Create contract
    let contract;
    try {
      contract = await prisma.contract.create({
        data: {
          title: extractedInfo.title,
          type: extractedInfo.type as any,
          status: 'AI_REVIEWING',
          counterparty: extractedInfo.counterparty,
          amount: extractedInfo.amount,
          originalFile: file?.name || '',
          parsedText,
          riskLevel: 'D',
          creatorId,
        },
      });
      console.log('Contract created successfully:', contract.id);
    } catch (dbError) {
      console.error('Database error creating contract:', dbError);
      return NextResponse.json(
        { error: 'Database error: Failed to create contract' },
        { status: 500 }
      );
    }
    
    // Create initial version
    try {
      await prisma.contractVersion.create({
        data: {
          contractId: contract.id,
          versionNumber: 1,
          fileUrl: file?.name || '',
          createdBy: creatorId,
        },
      });
      console.log('Contract version created successfully');
    } catch (versionError) {
      console.error('Error creating contract version:', versionError);
      // Don't fail the request if version creation fails
    }
    
    console.log('=== Contract Upload Completed ===');
    
    return NextResponse.json({
      success: true,
      contract: {
        ...contract,
        parsedText, // Include parsedText for analysis step
      },
    });
    
  } catch (error) {
    console.error('=== Create contract error ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create contract', details: errorMessage },
      { status: 500 }
    );
  }
}
