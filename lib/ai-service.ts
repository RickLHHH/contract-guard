import { AIReview, RiskItem } from '@/types';

// API Configuration - 使用函数获取以支持运行时环境变量
const getConfig = () => ({
  DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  QWEN_API_URL: process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  QWEN_API_KEY: process.env.QWEN_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || '',
});

// Determine which AI provider to use
function getAIProvider(): 'qwen' | 'deepseek' | 'mock' {
  const config = getConfig();
  const provider = config.AI_PROVIDER;
  
  if (provider === 'qwen' && config.QWEN_API_KEY) return 'qwen';
  if (provider === 'deepseek' && config.DEEPSEEK_API_KEY) return 'deepseek';
  if (config.QWEN_API_KEY) return 'qwen';
  if (config.DEEPSEEK_API_KEY) return 'deepseek';
  return 'mock';
}

// Log configuration (called at runtime)
function logConfig() {
  const config = getConfig();
  const provider = getAIProvider();
  console.log('=== AI Service Configuration ===');
  console.log('AI_PROVIDER env:', config.AI_PROVIDER || '(not set)');
  console.log('Selected provider:', provider);
  console.log('QWEN_API_KEY exists:', !!config.QWEN_API_KEY);
  console.log('DEEPSEEK_API_KEY exists:', !!config.DEEPSEEK_API_KEY);
  console.log('================================');
}

// Enhanced System Prompt for better contract review
const SYSTEM_PROMPT = `你是一名资深企业法务总监，拥有15年企业法务管理经验，精通《民法典》合同编、公司法、劳动法及知识产权相关法律。你正在使用ContractGuard智能合同审查系统为大型企业进行合同风险管控。

【核心审查原则】
1. **企业利益优先**：站在甲方（企业）立场，识别权利义务不对等条款
2. **风险分级量化**：区分"致命风险"（必须修改）、"重大风险"（强烈建议修改）、"一般风险"（知晓即可）
3. **可执行性**：所有建议必须附带可直接替换的条款文本，而非仅原则性建议
4. **上下文关联**：结合合同类型（采购/销售/劳动/技术）判断条款合理性

【审查维度矩阵】
- 财务安全：付款节点、违约金上限、保证金、税务承担
- 合规控制：数据合规、反垄断、知产归属、竞业限制
- 商业逻辑：交付标准、验收机制、不可抗力、退出机制
- 操作可行：管辖约定、送达条款、变更程序、争议解决成本

【输出规范 - 严格JSON】
- 必须返回可解析的JSON对象，不含markdown代码块标记
- 所有字符串必须使用双引号，禁止使用单引号或反引号
- 数值型字段（如riskScore）禁止加引号
- 中文内容无需转义，但禁止包含换行符（使用\n代替）
- 如无法审查，返回{"error": "具体原因", "retryable": true/false}

【风险等级精确定义】
- high：可能导致企业承担>10万元损失、丧失核心知识产权、或承担刑事责任
- medium：可能导致履约困难、增加运营成本、或丧失合同解除权
- low：表述不严谨、建议性优化、或轻微格式问题

【合同类型适配逻辑】
- 采购合同：重点关注付款条款、交付质量、违约责任不对等
- 销售合同：重点关注收款保障、知识产权许可范围、客户数据使用
- 劳动合同：重点关注竞业限制补偿、保密义务、解除条件
- 技术/数据类：重点关注数据权属、安全责任、开源协议合规`;

// Review Prompt Template
const REVIEW_PROMPT_TEMPLATE = `对以下企业合同进行深度审查。合同类型：{contractType}，涉及金额：{contractAmount}万元，我方角色：{partyRole}（甲方/乙方）。

【合同文本】
{contractText}

【企业制度关联】（RAG检索结果，优先适用）
{companyPolicies}

【审查任务】
1. 提取关键商业条款：标的、金额、期限、付款方式、交付标准
2. 识别不对称条款：单方解除权、单方变更权、免责条款、无限责任条款
3. 评估财务风险：账期、预付款比例、违约金上限是否超过LPR四倍
4. 检查合规要点：数据合规（如涉个人信息）、知识产权归属、竞业限制
5. 缺失必备条款：保密、不可抗力、争议解决、通知送达

【输出JSON Schema】
{
  "metadata": {
    "contractType": "识别出的合同类型",
    "partyPosition": "我方地位（强势/弱势/对等）",
    "reviewConfidence": 0.95,
    "estimatedReviewTime": "人工复核建议时间（分钟）"
  },
  "overallAssessment": {
    "riskLevel": "high/medium/low",
    "riskScore": 78,
    "riskDistribution": {
      "fatal": 0,
      "high": 2,
      "medium": 3,
      "low": 1
    },
    "executiveSummary": "给高管的摘要（50字内）：本合同存在X个重大风险，主要涉及XX方面，建议XX处理"
  },
  "keyRisks": [
    {
      "id": "risk_001",
      "severity": "high",
      "category": "财务风险",
      "riskType": "commercial",
      "clauseLocation": "第X条第X款",
      "originalText": "原文摘录（精确引用）",
      "riskDescription": "具体风险说明（含法律依据）",
      "legalBasis": ["《民法典》第585条", "公司《采购管理制度》第12条"],
      "suggestedRevision": {
        "revisionType": "修改/删除/补充",
        "proposedText": "建议修改为：XXXXXXXX",
        "rationale": "修改理由（从商业和法律角度）"
      },
      "businessImpact": "如不接受此风险，可能导致：XXX",
      "negotiationStrategy": "谈判话术建议：建议贵司考虑...",
      "mustFix": true
    }
  ],
  "missingClauses": [
    {
      "clauseName": "保密条款",
      "importance": "high",
      "templateReference": "公司标准模板第X条",
      "suggestedText": "建议添加：..."
    }
  ],
  "financialTerms": {
    "totalAmount": "合同总额（自动提取）",
    "paymentTerms": "付款条件分析",
    "penaltyAnalysis": "违约金评估（是否过高/过低）",
    "financialExposure": "最大潜在损失估算（如：合同金额20%）"
  },
  "complianceCheck": {
    "dataCompliance": {"passed": false, "issues": ["缺少数据安全责任条款"]},
    "ipCompliance": {"passed": true, "notes": "知识产权归属清晰"},
    "antitrustRisk": {"passed": true, "notes": "无垄断风险"}
  },
  "thinking": {
    "analysisProcess": "思维过程：我先看了付款条款，发现...然后看违约责任...",
    "uncertainties": ["第X条表述模糊，需人工确认具体含义"],
    "recommendedFocus": "建议法务重点复核：XXX条款"
  }
}

【输出质量控制要求】
1. **准确性**：引用的法条必须现行有效，公司名称必须与原文完全一致
2. **具体性**：riskDescription必须包含"如果发生XX情况，将导致XX后果"的因果链
3. **可操作性**：suggestedRevision必须是可以直接复制粘贴替换原文的完整条款
4. **置信度标记**：对模糊表述（如"合理期限"），在thinking中标注"此处需人工确认行业惯例"

【禁止事项】
- 禁止返回"建议咨询专业律师"等模糊结论
- 禁止在JSON外添加任何解释文字
- 禁止对明显合法的常规条款（如"双方签字盖章生效"）标记为风险`;

// Mock AI Review for demo purposes
export function generateMockAIReview(contractText: string): AIReview {
  console.log('Generating mock AI review, text length:', contractText?.length || 0);
  
  if (!contractText || contractText.length < 10) {
    return {
      id: 'mock-review-empty',
      contractId: '',
      overallRisk: 'low',
      riskScore: 85,
      keyRisks: [{
        id: 'ai-risk-0',
        clause: '合同文本过短或为空',
        location: '整体',
        riskType: 'operational',
        severity: 'low',
        explanation: '合同内容较少，无法进行全面风险分析。',
        suggestion: '请确保上传完整的合同文本以获得准确的风险评估。',
        category: '操作建议',
      }],
      missingClauses: ['请上传完整合同文本'],
      thinking: '由于合同文本内容较少，只能进行基础分析。',
      createdAt: new Date().toISOString(),
    };
  }
  
  // Extract key sections for analysis
  const hasPaymentTerms = /付款|支付|账期|预付款|尾款/i.test(contractText);
  const hasJurisdiction = /管辖|仲裁|争议解决|法院|诉讼/i.test(contractText);
  const hasConfidentiality = /保密|保密义务|商业秘密/i.test(contractText);
  const hasIP = /知识产权|专利|商标|著作权|技术成果/i.test(contractText);
  const hasTermination = /解除|终止|违约|不可抗力/i.test(contractText);
  
  const risks: RiskItem[] = [];
  
  // Payment terms analysis
  if (hasPaymentTerms) {
    const longPaymentMatch = contractText.match(/付款.*?(\d+).*?(天|日|工作日)/i);
    if (longPaymentMatch && parseInt(longPaymentMatch[1]) > 30) {
      risks.push({
        id: `risk-${risks.length + 1}`,
        clause: longPaymentMatch[0],
        location: '付款条款',
        riskType: 'commercial',
        severity: 'medium',
        explanation: `付款账期${longPaymentMatch[1]}天较长，资金占用风险。`,
        suggestion: '建议缩短至15-30天，或约定预付款。',
        category: '财务风险',
      });
    }
  }
  
  // Jurisdiction analysis
  if (hasJurisdiction) {
    const badJurisdiction = /被告所在地|甲方所在地|对方所在地/i.test(contractText);
    if (badJurisdiction) {
      risks.push({
        id: `risk-${risks.length + 1}`,
        clause: '争议解决条款',
        location: '争议解决',
        riskType: 'legal',
        severity: 'high',
        explanation: '约定在对方所在地管辖，增加我方诉讼成本。',
        suggestion: '建议改为"原告所在地或合同签订地"法院管辖。',
        category: '法律风险',
        law: '《民事诉讼法》第34条',
      });
    }
  }
  
  // Penalty analysis
  const penaltyMatch = contractText.match(/违约金.*?([\d.]+%)/i);
  if (penaltyMatch) {
    const percent = parseFloat(penaltyMatch[1]);
    if (percent > 20) {
      risks.push({
        id: `risk-${risks.length + 1}`,
        clause: penaltyMatch[0],
        location: '违约责任',
        riskType: 'legal',
        severity: 'high',
        explanation: `违约金${percent}%过高，可能被法院调减。`,
        suggestion: '建议约定"不超过实际损失的130"。',
        category: '法律风险',
        law: '《民法典》第585条',
      });
    }
  }
  
  // Missing clauses
  if (!hasConfidentiality) {
    risks.push({
      id: `risk-${risks.length + 1}`,
      clause: '合同全文',
      location: '整体',
      riskType: 'legal',
      severity: 'medium',
      explanation: '缺少保密条款，商业秘密保护不足。',
      suggestion: '增加保密条款，明确保密范围和期限。',
      category: '法律风险',
    });
  }
  
  // IP analysis
  if (!hasIP && /技术|开发|软件|设计/i.test(contractText)) {
    risks.push({
      id: `risk-${risks.length + 1}`,
      clause: '合同全文',
      location: '整体',
      riskType: 'legal',
      severity: 'medium',
      explanation: '涉及技术/创作，但未明确知识产权归属。',
      suggestion: '明确约定知识产权归属和使用范围。',
      category: '知识产权',
    });
  }
  
  // Calculate risk metrics
  const highRiskCount = risks.filter(r => r.severity === 'high').length;
  const mediumRiskCount = risks.filter(r => r.severity === 'medium').length;
  
  let overallRisk: 'high' | 'medium' | 'low' = 'low';
  if (highRiskCount >= 2) overallRisk = 'high';
  else if (highRiskCount >= 1 || mediumRiskCount >= 2) overallRisk = 'medium';
  
  const riskScore = Math.max(0, 100 - highRiskCount * 25 - mediumRiskCount * 15);
  
  const missingClauses: string[] = [];
  if (!hasConfidentiality) missingClauses.push('保密条款');
  if (!hasTermination) missingClauses.push('不可抗力条款');
  if (!/通知|送达/i.test(contractText)) missingClauses.push('通知送达条款');
  
  return {
    id: 'mock-review',
    contractId: '',
    overallRisk,
    riskScore,
    keyRisks: risks,
    missingClauses,
    thinking: `分析发现${risks.length}个风险点：${highRiskCount}个高风险，${mediumRiskCount}个中风险。${highRiskCount > 0 ? '重点关注管辖和违约责任条款。' : '整体风险可控。'}`,
    createdAt: new Date().toISOString(),
  };
}

// Qwen API call
export async function analyzeContractWithQwen(contractText: string): Promise<AIReview> {
  const config = getConfig();
  console.log('=== Qwen API Analysis Started ===');
  console.log('API Key configured:', config.QWEN_API_KEY ? 'Yes' : 'No');
  console.log('Contract text length:', contractText?.length || 0);
  
  if (!config.QWEN_API_KEY) {
    console.log('No Qwen API key, falling back to mock');
    return generateMockAIReview(contractText);
  }
  
  try {
    // Prepare contract text (truncate if too long)
    const maxLength = 6000;
    const processedText = contractText?.length > maxLength 
      ? contractText.substring(0, maxLength) + '\n...（合同内容已截断）'
      : (contractText || '');
    
    const prompt = REVIEW_PROMPT_TEMPLATE
      .replace('{contractText}', processedText)
      .replace('{contractType}', '未知类型')
      .replace('{contractAmount}', '未知')
      .replace('{partyRole}', '未知')
      .replace('{companyPolicies}', '暂无关联企业制度');
    
    console.log('Calling Qwen API...');
    console.log('API URL:', config.QWEN_API_URL);
    
    const requestBody = {
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    };
    
    const response = await fetch(`${config.QWEN_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.QWEN_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('Qwen API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error:', response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Qwen API response received');
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response structure:', JSON.stringify(data));
      throw new Error('Invalid API response structure');
    }
    
    const content = data.choices[0].message.content;
    console.log('Raw response (first 500 chars):', content.substring(0, 500));
    
    // Parse JSON response
    let result: any;
    try {
      // Try to extract JSON from various formats
      let jsonStr = content.trim();
      
      // Remove markdown code blocks if present
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
      
      // Find JSON boundaries
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');
      
      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        throw new Error('No JSON object found in response');
      }
      
      jsonStr = jsonStr.substring(startIdx, endIdx + 1);
      console.log('Extracted JSON (first 300 chars):', jsonStr.substring(0, 300));
      
      result = JSON.parse(jsonStr);
      console.log('JSON parsed successfully');
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse API response as JSON');
    }
    
    // Validate and format result - 适配新的JSON结构
    if (!result.keyRisks || !Array.isArray(result.keyRisks)) {
      console.warn('Response missing keyRisks, using fallback');
      result.keyRisks = [];
    }
    
    // 适配新的overallAssessment结构或旧的overallRisk/riskScore
    const overallRisk = result.overallAssessment?.riskLevel || result.overallRisk || 'medium';
    const riskScore = result.overallAssessment?.riskScore || result.riskScore || 70;
    
    // 适配新的thinking结构
    let thinkingText = 'AI分析完成';
    if (typeof result.thinking === 'string') {
      thinkingText = result.thinking;
    } else if (result.thinking?.analysisProcess) {
      thinkingText = result.thinking.analysisProcess;
    }
    
    // 适配新的keyRisks结构
    const aiReview: AIReview = {
      id: `qwen-${Date.now()}`,
      contractId: '',
      overallRisk: overallRisk,
      riskScore: typeof riskScore === 'number' ? riskScore : 70,
      keyRisks: result.keyRisks.map((risk: any, index: number) => {
        // 处理新的suggestedRevision结构或旧的suggestion字段
        let suggestionText = '无建议';
        if (risk.suggestedRevision?.proposedText) {
          suggestionText = `${risk.suggestedRevision.revisionType}: ${risk.suggestedRevision.proposedText}`;
        } else if (risk.suggestion) {
          suggestionText = risk.suggestion;
        }
        
        // 处理legalBasis数组或旧的law字符串
        let lawText = risk.law;
        if (risk.legalBasis && Array.isArray(risk.legalBasis)) {
          lawText = risk.legalBasis.join('、');
        }
        
        return {
          id: risk.id || `qwen-risk-${index + 1}`,
          clause: risk.originalText || risk.clause || '未指定',
          location: risk.clauseLocation || risk.location || '未知位置',
          riskType: risk.riskType || 'legal',
          severity: risk.severity || 'medium',
          explanation: risk.riskDescription || risk.explanation || '无说明',
          suggestion: suggestionText,
          category: risk.category || '一般风险',
          law: lawText,
        };
      }),
      missingClauses: (result.missingClauses || []).map((mc: any) => {
        if (typeof mc === 'string') return mc;
        return `${mc.clauseName}${mc.importance ? `(${mc.importance})` : ''}`;
      }),
      thinking: thinkingText,
      createdAt: new Date().toISOString(),
    };
    
    console.log('Qwen analysis completed, found', aiReview.keyRisks.length, 'risks');
    console.log('=== Qwen API Analysis Completed ===');
    
    return aiReview;
    
  } catch (error) {
    console.error('Qwen API failed:', error);
    console.log('Falling back to mock review');
    return generateMockAIReview(contractText);
  }
}

// DeepSeek API call
export async function analyzeContractWithDeepSeek(contractText: string): Promise<AIReview> {
  const config = getConfig();
  if (!config.DEEPSEEK_API_KEY) {
    return generateMockAIReview(contractText);
  }
  
  try {
    const maxLength = 6000;
    const processedText = contractText?.length > maxLength 
      ? contractText.substring(0, maxLength) + '\n...（已截断）'
      : (contractText || '');
    
    const prompt = REVIEW_PROMPT_TEMPLATE
      .replace('{contractText}', processedText)
      .replace('{contractType}', '未知类型')
      .replace('{contractAmount}', '未知')
      .replace('{partyRole}', '未知')
      .replace('{companyPolicies}', '暂无关联企业制度');
    
    const response = await fetch(`${config.DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON
    let jsonStr = content.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
    
    const startIdx = jsonStr.indexOf('{');
    const endIdx = jsonStr.lastIndexOf('}');
    jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    
    const result = JSON.parse(jsonStr);
    
    // 适配新的overallAssessment结构或旧的overallRisk/riskScore
    const overallRisk = result.overallAssessment?.riskLevel || result.overallRisk || 'medium';
    const riskScore = result.overallAssessment?.riskScore || result.riskScore || 70;
    
    // 适配新的thinking结构
    let thinkingText = '分析完成';
    if (typeof result.thinking === 'string') {
      thinkingText = result.thinking;
    } else if (result.thinking?.analysisProcess) {
      thinkingText = result.thinking.analysisProcess;
    }
    
    return {
      id: `deepseek-${Date.now()}`,
      contractId: '',
      overallRisk: overallRisk,
      riskScore: typeof riskScore === 'number' ? riskScore : 70,
      keyRisks: (result.keyRisks || []).map((risk: any, index: number) => {
        // 处理新的suggestedRevision结构或旧的suggestion字段
        let suggestionText = risk.suggestion || '无建议';
        if (risk.suggestedRevision?.proposedText) {
          suggestionText = `${risk.suggestedRevision.revisionType}: ${risk.suggestedRevision.proposedText}`;
        }
        
        // 处理legalBasis数组或旧的law字符串
        let lawText = risk.law;
        if (risk.legalBasis && Array.isArray(risk.legalBasis)) {
          lawText = risk.legalBasis.join('、');
        }
        
        return {
          id: risk.id || `deepseek-risk-${index + 1}`,
          clause: risk.originalText || risk.clause || '未指定',
          location: risk.clauseLocation || risk.location || '未知位置',
          riskType: risk.riskType || 'legal',
          severity: risk.severity || 'medium',
          explanation: risk.riskDescription || risk.explanation || '无说明',
          suggestion: suggestionText,
          category: risk.category || '一般风险',
          law: lawText,
        };
      }),
      missingClauses: (result.missingClauses || []).map((mc: any) => {
        if (typeof mc === 'string') return mc;
        return `${mc.clauseName}${mc.importance ? `(${mc.importance})` : ''}`;
      }),
      thinking: thinkingText,
      createdAt: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('DeepSeek API failed:', error);
    return generateMockAIReview(contractText);
  }
}

// Unified analysis function
export async function analyzeContract(contractText: string): Promise<AIReview> {
  logConfig();
  const provider = getAIProvider();
  console.log(`=== analyzeContract called, provider: ${provider} ===`);
  
  switch (provider) {
    case 'qwen':
      return analyzeContractWithQwen(contractText);
    case 'deepseek':
      return analyzeContractWithDeepSeek(contractText);
    default:
      console.log('Using mock analysis');
      return generateMockAIReview(contractText);
  }
}

// Export for debugging
export function getAIConfig() {
  const config = getConfig();
  return {
    provider: getAIProvider(),
    hasQwenKey: !!config.QWEN_API_KEY,
    hasDeepSeekKey: !!config.DEEPSEEK_API_KEY,
    qwenUrl: config.QWEN_API_URL,
    deepseekUrl: config.DEEPSEEK_API_URL,
  };
}
