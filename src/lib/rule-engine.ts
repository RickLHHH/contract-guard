import { ContractRule, RiskItem, RuleMatch } from '@/types';
import { CONTRACT_RULES, RISK_LEVEL_SCORE } from '@/constants/rules';

// Rule Engine Class
export class ContractRuleEngine {
  private rules: ContractRule[];

  constructor(rules: ContractRule[] = CONTRACT_RULES) {
    this.rules = rules;
  }

  // Analyze contract text against all rules
  analyze(contractText: string): { risks: RiskItem[]; score: number } {
    const risks: RiskItem[] = [];
    const matches: RuleMatch[] = [];

    for (const rule of this.rules) {
      const ruleMatches = this.findMatches(rule, contractText);
      matches.push(...ruleMatches);
    }

    // Convert matches to risks
    for (const match of matches) {
      risks.push(this.convertMatchToRisk(match));
    }

    // Calculate risk score
    const score = this.calculateScore(contractText, risks);

    return { risks, score };
  }

  // Find all matches for a specific rule
  private findMatches(rule: ContractRule, text: string): RuleMatch[] {
    const matches: RuleMatch[] = [];
    const regex = new RegExp(rule.pattern.source, 'gi');
    let match: RegExpMatchArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        rule,
        match,
        index: match.index || 0,
      });
    }

    return matches;
  }

  // Convert a rule match to a risk item
  private convertMatchToRisk(match: RuleMatch): RiskItem {
    const { rule, match: regexMatch, index } = match;
    
    // Find which "第X条" this match is in
    const beforeMatch = regexMatch.input?.slice(0, index) || '';
    const articleMatch = beforeMatch.match(/第[一二三四五六七八九十百千零\d]+条/g);
    const location = articleMatch ? articleMatch[articleMatch.length - 1] : '未知位置';

    return {
      id: `rule-${rule.id}`,
      clause: regexMatch[0].slice(0, 100), // First 100 chars
      location,
      riskType: this.mapCategoryToRiskType(rule.category),
      severity: rule.riskLevel,
      explanation: rule.message,
      suggestion: rule.suggestion,
      category: rule.category,
      law: rule.law,
    };
  }

  // Map category to risk type
  private mapCategoryToRiskType(category: string): 'legal' | 'commercial' | 'operational' {
    const categoryMap: Record<string, 'legal' | 'commercial' | 'operational'> = {
      '法律风险': 'legal',
      '财务风险': 'commercial',
      '商业风险': 'commercial',
      '操作风险': 'operational',
      '知识产权': 'legal',
    };
    return categoryMap[category] || 'legal';
  }

  // Calculate overall risk score
  private calculateScore(text: string, risks: RiskItem[]): number {
    // Base score
    let score = 100;

    // Deduct points for each risk
    for (const risk of risks) {
      score -= RISK_LEVEL_SCORE[risk.severity] * 10;
    }

    // Additional deductions for missing critical clauses
    if (!/保密|保密义务/i.test(text)) {
      score -= 5;
    }
    if (!/不可抗力/i.test(text)) {
      score -= 3;
    }
    if (!/知识产权/i.test(text) && /技术|开发|设计/i.test(text)) {
      score -= 8;
    }

    return Math.max(0, score);
  }

  // Add custom rules
  addRule(rule: ContractRule): void {
    this.rules.push(rule);
  }

  // Remove a rule
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  // Get all rules
  getRules(): ContractRule[] {
    return [...this.rules];
  }
}

// Singleton instance
let ruleEngineInstance: ContractRuleEngine | null = null;

export function getRuleEngine(): ContractRuleEngine {
  if (!ruleEngineInstance) {
    ruleEngineInstance = new ContractRuleEngine();
  }
  return ruleEngineInstance;
}

// Quick analyze function
export function quickAnalyze(contractText: string): { risks: RiskItem[]; score: number } {
  const engine = getRuleEngine();
  return engine.analyze(contractText);
}

// Hybrid analysis combining rule engine and keyword analysis
export function hybridAnalyze(contractText: string): { 
  ruleRisks: RiskItem[]; 
  keywordRisks: RiskItem[]; 
  score: number;
  recommendations: string[];
} {
  const engine = getRuleEngine();
  const { risks: ruleRisks, score } = engine.analyze(contractText);
  
  const keywordRisks: RiskItem[] = [];
  const recommendations: string[] = [];

  // Additional keyword-based analysis
  const analysis = {
    hasTermination: /解除|终止|提前.*结束/i.test(contractText),
    hasForceMajeure: /不可抗力|不能预见|不能避免/i.test(contractText),
    hasConfidentiality: /保密|保密义务|商业秘密/i.test(contractText),
    hasIPClause: /知识产权|专利权|商标权|著作权/i.test(contractText),
    hasGoverningLaw: /适用法律|依据.*法律|中华人民共和国.*法/i.test(contractText),
    hasNoticeClause: /通知|送达|书面通知/i.test(contractText),
    hasDisputeResolution: /争议解决|仲裁|诉讼|管辖/i.test(contractText),
    hasWarranty: /保证|担保|承诺|质保/i.test(contractText),
    hasLimitationOfLiability: /责任限制|免责|最高赔偿/i.test(contractText),
    hasAssignment: /转让|让与|权利义务.*转移/i.test(contractText),
  };

  // Check for missing critical clauses
  if (!analysis.hasTermination) {
    keywordRisks.push({
      id: 'keyword-termination',
      clause: '合同全文',
      location: '整体',
      riskType: 'legal',
      severity: 'medium',
      explanation: '未明确约定合同解除或终止条件',
      suggestion: '建议增加合同解除条款，明确双方解除权和解除程序',
      category: '法律风险',
    });
    recommendations.push('增加合同解除条款');
  }

  if (!analysis.hasForceMajeure) {
    keywordRisks.push({
      id: 'keyword-force-majeure',
      clause: '合同全文',
      location: '整体',
      riskType: 'legal',
      severity: 'low',
      explanation: '缺少不可抗力条款',
      suggestion: '建议补充不可抗力条款，明确不可抗力情形及后果',
      category: '法律风险',
    });
    recommendations.push('补充不可抗力条款');
  }

  if (!analysis.hasNoticeClause) {
    keywordRisks.push({
      id: 'keyword-notice',
      clause: '合同全文',
      location: '整体',
      riskType: 'operational',
      severity: 'low',
      explanation: '未约定通知送达方式',
      suggestion: '建议增加通知条款，明确送达地址和方式',
      category: '操作风险',
    });
    recommendations.push('增加通知送达条款');
  }

  if (!analysis.hasLimitationOfLiability) {
    recommendations.push('考虑增加责任限制条款');
  }

  return {
    ruleRisks,
    keywordRisks,
    score: Math.max(0, score - keywordRisks.length * 5),
    recommendations,
  };
}
