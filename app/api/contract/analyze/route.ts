import { NextRequest, NextResponse } from 'next/server';
import { analyzeContract, generateMockAIReview, getAIConfig } from '@/lib/ai-service';
import { hybridAnalyze } from '@/lib/rule-engine';
import { prisma } from '@/lib/prisma';
import { AIReview, RiskItem } from '@/types';

export async function POST(request: NextRequest) {
  console.log('=== Contract Analysis API Called ===');
  
  try {
    // Log AI configuration
    const aiConfig = getAIConfig();
    console.log('AI Configuration:', aiConfig);
    
    const body = await request.json();
    const { contractId, text, useAI = true } = body;
    
    console.log('Request:', { 
      contractId, 
      textLength: text?.length, 
      textPreview: text?.substring(0, 100),
      useAI 
    });
    
    if (!contractId) {
      console.error('Missing contractId');
      return NextResponse.json(
        { error: 'Missing required field: contractId' },
        { status: 400 }
      );
    }
    
    // Handle empty or short text
    if (!text || text.length < 10) {
      console.log('Text too short, returning empty analysis');
      const emptyReview = generateMockAIReview('');
      return NextResponse.json({
        success: true,
        review: { ...emptyReview, contractId },
        warning: '合同文本过短，返回基础分析',
      });
    }
    
    // Step 1: Rule Engine Analysis
    console.log('Step 1: Running rule engine...');
    const ruleResult = hybridAnalyze(text);
    console.log('Rule engine result:', {
      ruleRisks: ruleResult.ruleRisks.length,
      keywordRisks: ruleResult.keywordRisks.length,
      score: ruleResult.score,
    });
    
    // Step 2: AI Analysis
    let aiResult: AIReview | null = null;
    let aiError: string | null = null;
    
    if (useAI) {
      console.log('Step 2: Running AI analysis...');
      try {
        aiResult = await analyzeContract(text);
        console.log('AI analysis completed:', {
          riskCount: aiResult.keyRisks.length,
          riskScore: aiResult.riskScore,
          provider: aiResult.id.startsWith('qwen') ? 'qwen' : 
                   aiResult.id.startsWith('deepseek') ? 'deepseek' : 'mock',
        });
      } catch (error) {
        aiError = error instanceof Error ? error.message : 'Unknown error';
        console.error('AI analysis failed:', aiError);
        aiResult = generateMockAIReview(text);
      }
    } else {
      console.log('AI analysis skipped (useAI=false)');
      aiResult = generateMockAIReview(text);
    }
    
    // Combine results
    const allRisks = [
      ...ruleResult.ruleRisks,
      ...ruleResult.keywordRisks,
      ...(aiResult?.keyRisks || []),
    ];
    
    console.log('Combined risks:', allRisks.length);
    
    // Deduplicate risks
    const uniqueRisks = allRisks.filter((risk, index, self) => 
      index === self.findIndex(r => 
        r.explanation === risk.explanation || 
        (r.clause === risk.clause && r.category === risk.category)
      )
    );
    
    console.log('Unique risks after dedup:', uniqueRisks.length);
    
    // Calculate risk metrics
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
    
    console.log('Risk calculation:', { overallRisk, riskLevel, finalScore, highRisks, mediumRisks });
    
    // Save to database
    try {
      await prisma.contract.update({
        where: { id: contractId },
        data: { riskLevel, status: 'LEGAL_REVIEW' },
      });
      
      const savedReview = await prisma.aIReview.create({
        data: {
          contractId,
          overallRisk,
          riskScore: Math.round(finalScore),
          keyRisks: JSON.stringify(uniqueRisks),
          missingClauses: JSON.stringify(aiResult?.missingClauses || ruleResult.recommendations),
          thinking: aiResult?.thinking || `基于规则引擎分析，发现 ${uniqueRisks.length} 个风险点`,
        },
      });
      
      // Create annotations
      const annotationPromises = uniqueRisks
        .filter(r => r.severity !== 'low')
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
      console.log('Database save successful');
      
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Continue to return result even if DB save fails
    }
    
    const response = {
      success: true,
      review: {
        id: `review-${Date.now()}`,
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
        aiUsed: useAI,
        aiError,
        ruleRisksCount: ruleResult.ruleRisks.length,
        aiRisksCount: aiResult?.keyRisks?.length || 0,
      },
    };
    
    console.log('=== Analysis API Completed ===');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze contract', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
