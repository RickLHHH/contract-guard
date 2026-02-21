import { NextRequest, NextResponse } from 'next/server';
import { analyzeContract, generateMockAIReview } from '@/lib/ai-service';
import { hybridAnalyze } from '@/lib/rule-engine';
import { prisma } from '@/lib/prisma';
import { AIReview, RiskItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Contract Analysis Started ===');
    
    const body = await request.json();
    const { contractId, text, useAI = true } = body;
    
    console.log('Analysis request:', { contractId, textLength: text?.length, useAI });
    
    if (!contractId) {
      return NextResponse.json(
        { error: 'Missing required field: contractId' },
        { status: 400 }
      );
    }
    
    if (!text || text.length < 10) {
      console.log('Contract text too short, using default analysis');
      // Return a default analysis for short/empty text
      const defaultReview = generateMockAIReview(text || '');
      
      return NextResponse.json({
        success: true,
        review: {
          ...defaultReview,
          contractId,
          riskLevel: 'D',
        },
        stats: {
          totalRisks: defaultReview.keyRisks.length,
          highRisks: 0,
          mediumRisks: defaultReview.keyRisks.filter(r => r.severity === 'medium').length,
          lowRisks: defaultReview.keyRisks.filter(r => r.severity === 'low').length,
        },
      });
    }
    
    // Step 1: Rule Engine Analysis (Fast)
    console.log('Running rule engine analysis...');
    const ruleResult = hybridAnalyze(text);
    console.log('Rule engine found:', ruleResult.ruleRisks.length, 'rule risks,', ruleResult.keywordRisks.length, 'keyword risks');
    
    let aiResult: AIReview | null = null;
    
    // Step 2: AI Analysis
    if (useAI) {
      try {
        console.log('Running AI analysis...');
        aiResult = await analyzeContract(text);
        console.log('AI analysis completed, found', aiResult.keyRisks.length, 'risks');
      } catch (error) {
        console.error('AI analysis failed, falling back to rules only:', error);
        aiResult = generateMockAIReview(text);
      }
    } else {
      console.log('AI analysis disabled, using mock');
      aiResult = generateMockAIReview(text);
    }
    
    // Combine results
    const allRisks = [
      ...ruleResult.ruleRisks,
      ...ruleResult.keywordRisks,
      ...(aiResult?.keyRisks || []),
    ];
    
    console.log('Total risks before deduplication:', allRisks.length);
    
    // Remove duplicates based on similar content
    const uniqueRisks = allRisks.filter((risk, index, self) => 
      index === self.findIndex(r => 
        r.explanation === risk.explanation || 
        (r.clause === risk.clause && r.category === risk.category)
      )
    );
    
    console.log('Unique risks after deduplication:', uniqueRisks.length);
    
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
    
    console.log('Risk calculation:', { overallRisk, riskLevel, finalScore, highRisks, mediumRisks });
    
    // Save to database
    try {
      // Update contract risk level
      await prisma.contract.update({
        where: { id: contractId },
        data: { 
          riskLevel,
          status: 'LEGAL_REVIEW',
        },
      });
      console.log('Contract updated with risk level:', riskLevel);
      
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
      console.log('AI review saved:', savedReview.id);
      
      // Create annotations for high and medium risks
      const annotationPromises = uniqueRisks
        .filter(r => r.severity !== 'low')
        .map(async (risk) => {
          return prisma.annotation.create({
            data: {
              contractId,
              page: 1,
              startOffset: 0,
              endOffset: risk.clause?.length || 0,
              selectedText: risk.clause?.slice(0, 200) || '',
              type: 'AI_SUGGESTION',
              content: `${risk.explanation}\n\n建议：${risk.suggestion}${risk.law ? `\n\n相关法规：${risk.law}` : ''}`,
              status: 'OPEN',
              visibility: 'EXTERNAL',
              authorId: 'system-ai',
            },
          });
        });
      
      await Promise.all(annotationPromises);
      console.log('Annotations created:', annotationPromises.length);
      
      console.log('=== Contract Analysis Completed ===');
      
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
    } catch (dbError) {
      console.error('Database error during analysis:', dbError);
      // Return analysis result even if DB save fails
      return NextResponse.json({
        success: true,
        review: {
          id: 'temp-review',
          contractId,
          overallRisk,
          riskScore: Math.round(finalScore),
          riskLevel,
          keyRisks: uniqueRisks,
          missingClauses: aiResult?.missingClauses || ruleResult.recommendations,
          thinking: aiResult?.thinking || `基于规则引擎分析，发现 ${uniqueRisks.length} 个风险点`,
          createdAt: new Date().toISOString(),
        },
        stats: {
          totalRisks: uniqueRisks.length,
          highRisks,
          mediumRisks,
          lowRisks: uniqueRisks.filter(r => r.severity === 'low').length,
        },
        warning: 'Analysis completed but database save failed',
      });
    }
    
  } catch (error) {
    console.error('Analyze API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to analyze contract', details: errorMessage },
      { status: 500 }
    );
  }
}
