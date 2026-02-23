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
const REVIEW_PROMPT_TEMPLATE = `请审查以下合同文本，严格按照系统提示词中的【输出规范】返回JSON格式分析结果。

【待审查合同文本】
{contractText}

【输出JSON格式规范】
{
  "overallRisk": "high/medium/low - 基于风险等级精确定义判断",
  "riskScore": 0-100的整数 - 100为无风险，低于60为高风险,
  "keyRisks": [
    {
      "clause": "原文引用（控制在50字内，保留关键表述）",
      "location": "具体条款位置，如'第5条第3款'或'保密条款'",
      "riskType": "legal/commercial/operational/ip",
      "severity": "high/medium/low - 严格按精确定义分级",
      "explanation": "风险分析（100字内），说明为什么这是风险及可能后果",
      "suggestion": "【重要】必须提供可直接使用的替换条款文本，而非原则性建议",
      "category": "具体风险类别，如'付款风险/知识产权风险/数据合规风险'",
      "law": "相关法条引用（如有），如'《民法典》第585条'"
    }
  ],
  "missingClauses": ["缺失的重要条款1", "缺失的重要条款2"],
  "thinking": "整体分析思路（200字内）：合同类型判断、主要风险点概述、优先级排序建议"
}

【输出质量要求】
1. **企业立场**：站在甲方角度识别不对等条款，而非中立审查
2. **具体可执行**：每个suggestion必须是可直接复制替换的条款文本
3. **量化风险**：high风险必须有明确的金额/责任/权益损失说明
4. **法条支撑**：涉及法律风险必须引用具体法条条款号
5. **类型适配**：根据合同类型（采购/销售/劳动/技术）调整审查重点

【评分参考】
- 90-100分：合同基本无风险，条款对等，保护机制完善
- 75-89分：存在低风险问题，可接受但建议优化
- 60-74分：存在中风险问题，建议修改后签署
- 0-59分：存在高风险问题，必须修改否则不建议签署`;

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
    
    const prompt = REVIEW_PROMPT_TEMPLATE.replace('{contractText}', processedText);
    
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
    
    // Validate and format result
    if (!result.keyRisks || !Array.isArray(result.keyRisks)) {
      console.warn('Response missing keyRisks, using fallback');
      result.keyRisks = [];
    }
    
    const aiReview: AIReview = {
      id: `qwen-${Date.now()}`,
      contractId: '',
      overallRisk: result.overallRisk || 'medium',
      riskScore: typeof result.riskScore === 'number' ? result.riskScore : 70,
      keyRisks: result.keyRisks.map((risk: any, index: number) => ({
        id: `qwen-risk-${index + 1}`,
        clause: risk.clause || '未指定',
        location: risk.location || '未知位置',
        riskType: risk.riskType || 'legal',
        severity: risk.severity || 'medium',
        explanation: risk.explanation || '无说明',
        suggestion: risk.suggestion || '无建议',
        category: risk.category || '一般风险',
        law: risk.law,
      })),
      missingClauses: result.missingClauses || [],
      thinking: result.thinking || 'AI分析完成',
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
    
    const prompt = REVIEW_PROMPT_TEMPLATE.replace('{contractText}', processedText);
    
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
    
    return {
      id: `deepseek-${Date.now()}`,
      contractId: '',
      overallRisk: result.overallRisk || 'medium',
      riskScore: result.riskScore || 70,
      keyRisks: (result.keyRisks || []).map((risk: any, index: number) => ({
        id: `deepseek-risk-${index + 1}`,
        ...risk,
      })),
      missingClauses: result.missingClauses || [],
      thinking: result.thinking || '分析完成',
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
