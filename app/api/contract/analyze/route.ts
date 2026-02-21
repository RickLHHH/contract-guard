import { NextRequest, NextResponse } from 'next/server';
import { analyzeContractWithDeepSeek, generateMockAIReview } from '@/lib/ai-service';
import { hybridAnalyze } from '@/lib/rule-engine';
import { prisma } from '@/lib/prisma';
import { AIReview, RiskItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { contractId, text, useAI = true } = await request.json();
    
    if (!contractId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: contractId and text' },
        { status: 400 }
      );
    }
    
    // Step 1: Rule Engine Analysis (Fast)
    const ruleResult = hybridAnalyze(text);
    
    let aiResult: AIReview | null = null;
    
    // Step 2: AI Analysis (if enabled)
    if (useAI) {
      try {
        aiResult = await analyzeContractWithDeepSeek(text);
      } catch (error) {
        console.error('AI analysis failed, falling back to rules only:', error);
        aiResult = generateMockAIReview(text);
      }
    }
    
    // Combine results
    const allRisks = [
      ...ruleResult.ruleRisks,
      ...ruleResult.keywordRisks,
      ...(aiResult?.keyRisks || []),
    ];
    
    // Remove duplicates based on similar content
    const uniqueRisks = allRisks.filter((risk, index, self) => 
      index === self.findIndex(r => 
        r.explanation === risk.explanation || 
        (r.clause === risk.clause && r.category === risk.category)
      )
    );
    
    // Calculate overall risk level
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
    
    // Calculate final score
    const finalScore = Math.max(0, Math.min(100, 
      (aiResult?.riskScore || ruleResult.score) - uniqueRisks.length * 2
    ));
    
    // Update contract risk level
    await prisma.contract.update({
      where: { id: contractId },
      data: { 
        riskLevel,
        status: 'LEGAL_REVIEW',
      },
    });
    
    // Save AI review to database
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
    
    // Create annotations for high and medium risks
    const annotationPromises = uniqueRisks
      .filter(r => r.severity !== 'low')
      .map(async (risk) => {
        return prisma.annotation.create({
          data: {
            contractId,
            page: 1,
            startOffset: 0,
            endOffset: risk.clause.length,
            selectedText: risk.clause.slice(0, 200),
            type: 'AI_SUGGESTION',
            content: `${risk.explanation}\n\n建议：${risk.suggestion}${risk.law ? `\n\n相关法规：${risk.law}` : ''}`,
            status: 'OPEN',
            visibility: 'EXTERNAL',
            authorId: 'system-ai',
          },
        });
      });
    
    await Promise.all(annotationPromises);
    
    return NextResponse.json({
      success: true,
      review: {
        id: savedReview.id,
        contractId,
        overallRisk,
        riskScore: Math.round(finalScore),
        riskLevel,
        keyRisks: uniqueRisks,
        missingClauses: aiResult?.missingClauses || ruleResult.recommendations,
        thinking: savedReview.thinking,
        createdAt: savedReview.createdAt,
      },
      stats: {
        totalRisks: uniqueRisks.length,
        highRisks,
        mediumRisks,
        lowRisks: uniqueRisks.filter(r => r.severity === 'low').length,
      },
    });
    
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze contract' },
      { status: 500 }
    );
  }
}
