import { NextRequest, NextResponse } from 'next/server';
import { analyzeContract, generateMockAIReview, getAIConfig } from '@/lib/ai-service';
import { hybridAnalyze } from '@/lib/rule-engine';
import { prisma } from '@/lib/prisma';
import { AIReview, RiskItem } from '@/types';

/**
 * POST /api/contract/analyze - 分析合同
 * 结合规则引擎和AI进行全面的合同风险分析
 */
export async function POST(request: NextRequest) {
  console.log('[API] 合同分析开始');
  
  try {
    // 获取AI配置信息
    const aiConfig = getAIConfig();
    console.log('[API] AI配置:', {
      provider: aiConfig.provider,
      hasQwenKey: aiConfig.hasQwenKey,
      hasDeepSeekKey: aiConfig.hasDeepSeekKey,
    });
    
    const body = await request.json();
    const { contractId, text, useAI = true } = body;
    
    console.log('[API] 分析请求:', { 
      contractId, 
      textLength: text?.length, 
      textPreview: text?.substring(0, 100),
      useAI,
    });
    
    // 验证参数
    if (!contractId) {
      console.error('[API] 缺少 contractId');
      return NextResponse.json(
        { error: '缺少必需参数: contractId' },
        { status: 400 }
      );
    }
    
    // 处理空或短文本
    if (!text || text.length < 10) {
      console.log('[API] 文本过短，返回基础分析');
      const emptyReview = generateMockAIReview('');
      return NextResponse.json({
        success: true,
        review: { ...emptyReview, contractId },
        warning: '合同文本过短，返回基础分析',
      });
    }
    
    // 步骤1: 规则引擎分析
    console.log('[API] 步骤1: 执行规则引擎分析...');
    const ruleResult = hybridAnalyze(text);
    console.log('[API] 规则引擎结果:', {
      ruleRisks: ruleResult.ruleRisks.length,
      keywordRisks: ruleResult.keywordRisks.length,
      score: ruleResult.score,
    });
    
    // 步骤2: AI分析
    let aiResult: AIReview | null = null;
    let aiError: string | null = null;
    
    if (useAI) {
      console.log('[API] 步骤2: 执行AI分析...');
      try {
        aiResult = await analyzeContract(text);
        console.log('[API] AI分析完成:', {
          riskCount: aiResult.keyRisks.length,
          riskScore: aiResult.riskScore,
          provider: aiResult.id.startsWith('qwen') ? 'qwen' : 
                   aiResult.id.startsWith('deepseek') ? 'deepseek' : 'mock',
        });
      } catch (error) {
        aiError = error instanceof Error ? error.message : '未知错误';
        console.error('[API] AI分析失败:', aiError);
        aiResult = generateMockAIReview(text);
      }
    } else {
      console.log('[API] 跳过AI分析 (useAI=false)');
      aiResult = generateMockAIReview(text);
    }
    
    // 合并结果
    const allRisks = [
      ...ruleResult.ruleRisks,
      ...ruleResult.keywordRisks,
      ...(aiResult?.keyRisks || []),
    ];
    
    console.log('[API] 合并风险数:', allRisks.length);
    
    // 去重
    const uniqueRisks = allRisks.filter((risk, index, self) => 
      index === self.findIndex(r => 
        r.explanation === risk.explanation || 
        (r.clause === risk.clause && r.category === risk.category)
      )
    );
    
    console.log('[API] 去重后风险数:', uniqueRisks.length);
    
    // 计算风险指标
    const highRisks = uniqueRisks.filter(r => r.severity === 'high').length;
    const mediumRisks = uniqueRisks.filter(r => r.severity === 'medium').length;
    
    let overallRisk: 'high' | 'medium' | 'low' = 'low';
    let riskLevel: 'A' | 'B' | 'C' | 'D' = 'D';
    
    if (highRisks >= 2) {
      overallRisk = 'high';
      riskLevel = 'A';
    } else if (highRisks >= 1 || mediumRisks >= 3) {
      overallRisk = 'medium';
      riskLevel = highRisks >= 1 ? 'A' : 'B';
    } else if (mediumRisks >= 1) {
      overallRisk = 'low';
      riskLevel = 'C';
    }
    
    const finalScore = Math.max(0, Math.min(100, 
      (aiResult?.riskScore || ruleResult.score) - uniqueRisks.length * 2
    ));
    
    console.log('[API] 风险计算结果:', { overallRisk, riskLevel, finalScore, highRisks, mediumRisks });
    
    // 保存到数据库
    let savedReview;
    try {
      // 更新合同状态和风险等级
      await prisma.contract.update({
        where: { id: contractId },
        data: { 
          riskLevel, 
          status: 'LEGAL_REVIEW',
        },
      });
      
      // 保存AI审查结果
      savedReview = await prisma.aIReview.create({
        data: {
          contractId,
          overallRisk,
          riskScore: Math.round(finalScore),
          keyRisks: JSON.stringify(uniqueRisks),
          missingClauses: JSON.stringify(aiResult?.missingClauses || ruleResult.recommendations),
          thinking: aiResult?.thinking || `基于规则引擎分析，发现 ${uniqueRisks.length} 个风险点`,
        },
      });
      
      // 创建批注（针对中高风险的发现）
      const annotationPromises = uniqueRisks
        .filter(r => r.severity !== 'low')
        .slice(0, 20) // 限制批注数量
        .map(r => prisma.annotation.create({
          data: {
            contractId,
            page: 1,
            startOffset: 0,
            endOffset: r.clause?.length || 0,
            selectedText: r.clause?.slice(0, 200) || '',
            type: 'AI_SUGGESTION',
            content: `${r.explanation}\n\n建议：${r.suggestion}${r.law ? `\n\n相关法规：${r.law}` : ''}`,
            status: 'OPEN',
            visibility: 'EXTERNAL',
            authorId: 'system-ai',
          },
        }));
      
      await Promise.all(annotationPromises);
      console.log('[API] 数据库保存成功，创建了', annotationPromises.length, '个批注');
      
    } catch (dbError) {
      console.error('[API] 数据库保存错误:', dbError);
      // 继续返回结果，即使数据库保存失败
    }
    
    const response = {
      success: true,
      review: {
        id: savedReview?.id || `review-${Date.now()}`,
        contractId,
        overallRisk,
        riskScore: Math.round(finalScore),
        riskLevel,
        keyRisks: uniqueRisks,
        missingClauses: aiResult?.missingClauses || ruleResult.recommendations,
        thinking: aiResult?.thinking || `发现 ${uniqueRisks.length} 个风险点`,
        createdAt: new Date().toISOString(),
      },
      stats: {
        totalRisks: uniqueRisks.length,
        highRisks,
        mediumRisks,
        lowRisks: uniqueRisks.filter(r => r.severity === 'low').length,
      },
      debug: {
        aiProvider: aiConfig.provider,
        aiUsed: useAI && aiConfig.provider !== 'mock',
        aiError,
        ruleRisksCount: ruleResult.ruleRisks.length,
        aiRisksCount: aiResult?.keyRisks?.length || 0,
      },
    };
    
    console.log('[API] 合同分析完成');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API] 合同分析失败:', error);
    return NextResponse.json(
      { 
        error: '合同分析失败', 
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
