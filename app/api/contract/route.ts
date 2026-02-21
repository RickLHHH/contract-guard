import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseFile, isSupportedFile } from '@/lib/file-parser';
import { saveFile } from '@/lib/file-storage';
import { extractContractInfo } from '@/lib/text-utils';

/**
 * GET /api/contract - 获取合同列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const riskLevel = searchParams.get('riskLevel');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: Record<string, unknown> = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (riskLevel) where.riskLevel = riskLevel;
    
    // 搜索功能
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { counterparty: { contains: search, mode: 'insensitive' } },
        { parsedText: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, avatar: true, role: true },
          },
          aiReview: {
            select: { riskScore: true, overallRisk: true },
          },
          _count: {
            select: { annotations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.contract.count({ where }),
    ]);
    
    return NextResponse.json({
      contracts,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('[API] 获取合同列表失败:', error);
    return NextResponse.json(
      { error: '获取合同列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contract - 上传新合同
 */
export async function POST(request: NextRequest) {
  console.log('[API] 合同上传开始');
  
  try {
    // 检查 Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      );
    }
    
    // 解析表单数据
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error('[API] 表单解析失败:', e);
      return NextResponse.json(
        { error: 'Failed to parse form data' },
        { status: 400 }
      );
    }
    
    // 获取表单字段
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const type = formData.get('type') as string | null;
    const counterparty = formData.get('counterparty') as string | null;
    const amount = formData.get('amount') as string | null;
    const isTemplate = formData.get('isTemplate') === 'true';
    const creatorId = (formData.get('creatorId') as string) || 'user-1';
    
    // 验证必填字段
    if (!file && !title) {
      return NextResponse.json(
        { error: '请上传文件或输入合同标题' },
        { status: 400 }
      );
    }
    
    // 检查文件类型
    if (file && !isSupportedFile(file.name)) {
      return NextResponse.json(
        { error: '不支持的文件类型，请上传 PDF、Word 或 TXT 文件' },
        { status: 400 }
      );
    }
    
    console.log('[API] 接收到的文件:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
    });
    
    let parsedResult: Awaited<ReturnType<typeof parseFile>> | null = null;
    let storedFile: Awaited<ReturnType<typeof saveFile>> | null = null;
    
    // 处理文件上传
    if (file && file.size > 0) {
      try {
        // 读取文件内容
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 保存文件到存储
        storedFile = await saveFile(buffer, file.name, file.type, {
          directory: 'contracts',
          uploadedBy: creatorId,
        });
        
        console.log('[API] 文件保存成功:', storedFile.id);
        
        // 解析文件内容
        parsedResult = await parseFile(buffer, file.type, file.name);
        console.log('[API] 文件解析成功:', {
          wordCount: parsedResult.metadata.wordCount,
          pageCount: parsedResult.metadata.pageCount,
          clauseCount: parsedResult.structure.clauses.length,
        });
      } catch (error) {
        console.error('[API] 文件处理失败:', error);
        return NextResponse.json(
          { error: '文件处理失败', details: error instanceof Error ? error.message : '未知错误' },
          { status: 500 }
        );
      }
    }
    
    // 提取或合并信息
    const extractedInfo = parsedResult 
      ? extractContractInfo(parsedResult.text)
      : null;
    
    const finalTitle = title || extractedInfo?.title || '未命名合同';
    const finalType = type || extractedInfo?.type || 'OTHERS';
    const finalCounterparty = counterparty || extractedInfo?.counterparty || (isTemplate ? '模板待填' : '待补充');
    const finalAmount = amount 
      ? parseFloat(amount) 
      : extractedInfo?.amount || null;
    
    // 创建合同记录
    let contract;
    try {
      contract = await prisma.contract.create({
        data: {
          title: finalTitle,
          type: finalType as any,
          status: 'AI_REVIEWING',
          counterparty: finalCounterparty,
          amount: finalAmount,
          originalFile: storedFile?.id || '',
          parsedText: parsedResult?.text || '',
          riskLevel: 'D',
          creatorId,
          // 添加解析元数据
          metadata: parsedResult ? {
            pageCount: parsedResult.metadata.pageCount,
            wordCount: parsedResult.metadata.wordCount,
            charCount: parsedResult.metadata.charCount,
            clauseCount: parsedResult.structure.clauses.length,
            tablesCount: parsedResult.structure.tables.length,
            isTemplate,
          } : {},
        },
      });
      console.log('[API] 合同创建成功:', contract.id);
    } catch (dbError) {
      console.error('[API] 数据库错误:', dbError);
      // 如果数据库创建失败，删除已保存的文件
      if (storedFile) {
        try {
          const { deleteFile } = await import('@/lib/file-storage');
          await deleteFile(storedFile.id);
        } catch {
          // 忽略删除错误
        }
      }
      return NextResponse.json(
        { error: '创建合同失败', details: dbError instanceof Error ? dbError.message : '数据库错误' },
        { status: 500 }
      );
    }
    
    // 创建初始版本记录
    try {
      await prisma.contractVersion.create({
        data: {
          contractId: contract.id,
          versionNumber: 1,
          fileUrl: storedFile?.id || '',
          changes: '初始版本',
          createdBy: creatorId,
        },
      });
    } catch (versionError) {
      console.error('[API] 版本记录创建失败:', versionError);
      // 非致命错误，继续
    }
    
    console.log('[API] 合同上传完成:', contract.id);
    
    return NextResponse.json({
      success: true,
      contract: {
        ...contract,
        parsedText: parsedResult?.text,
        structure: parsedResult?.structure,
      },
    });
    
  } catch (error) {
    console.error('[API] 合同上传失败:', error);
    return NextResponse.json(
      { error: '上传失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
