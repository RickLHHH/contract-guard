import { AIReview, RiskItem } from '@/types';

// API Configuration
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// Qwen API Configuration (DashScope)
const QWEN_API_URL = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';

// Determine which AI provider to use
// Priority: 1. Explicit AI_PROVIDER setting, 2. Qwen if key available, 3. DeepSeek if key available, 4. Mock
const AI_PROVIDER = process.env.AI_PROVIDER || (QWEN_API_KEY ? 'qwen' : DEEPSEEK_API_KEY ? 'deepseek' : 'mock');

// Review Prompt for AI
const REVIEW_PROMPT = `你是一名资深企业法务顾问，拥有10年合同审查经验。请对以下合同进行专业审查：

【审查重点】
1. 权利义务对等性（是否存在明显不对等条款）
2. 风险分配合理性（不可抗力、情势变更条款）
3. 退出机制完整性（解除条件、违约责任）
4. 知识产权归属（尤其涉及技术/创意类合同）
5. 保密与竞业限制（范围、期限、补偿）
6. 付款与交付条款（账期、验收标准）
7. 争议解决条款（管辖、适用法律）

【输出格式要求】
必须返回严格JSON格式，不要包含任何markdown代码块标记，不要添加任何额外说明文字，只返回纯JSON：
{
  "overallRisk": "high/medium/low",
  "riskScore": 78,
  "keyRisks": [
    {
      "clause": "条款原文摘要（50字以内）",
      "location": "第X条",
      "riskType": "legal/commercial/operational",
      "severity": "high/medium/low",
      "explanation": "风险说明（100字以内）",
      "suggestion": "修改建议（100字以内）",
      "category": "风险类别"
    }
  ],
  "missingClauses": ["建议补充的条款1", "建议补充的条款2"],
  "thinking": "分析思考过程（200字以内）"
}

【重要】
- 如果合同内容较短，返回 fewer risks
- 如果没有明显风险，riskScore 可以给 85-95 分
- 必须返回合法的 JSON 格式

合同文本：
`;

// Enhanced Mock AI Review with more comprehensive analysis
export function generateMockAIReview(contractText: string): AIReview {
  console.log('Generating mock AI review for contract:', contractText.substring(0, 100));
  
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
      thinking: '由于合同文本内容较少，只能进行基础分析。建议上传完整合同以获得全面的风险评估。',
      createdAt: new Date().toISOString(),
    };
  }
  
  // Extract key sections for analysis
  const hasPaymentTerms = /付款|支付|账期|预付款|尾款/i.test(contractText);
  const hasJurisdiction = /管辖|仲裁|争议解决|法院|诉讼/i.test(contractText);
  const hasTermination = /解除|终止|违约|不可抗力/i.test(contractText);
  const hasConfidentiality = /保密|保密义务|商业秘密/i.test(contractText);
  const hasIP = /知识产权|专利|商标|著作权|技术成果/i.test(contractText);
  const hasWarranty = /质保|保修|质量保证|售后服务/i.test(contractText);
  const hasLiability = /责任限制|赔偿限额|免责/i.test(contractText);
  
  const risks: RiskItem[] = [];
  
  // Analyze payment terms
  if (hasPaymentTerms) {
    const longPaymentMatch = contractText.match(/付款.*?(\d+).*?(天|日|工作日)/i);
    const prepayMatch = contractText.match(/预付款.*?(\d+)%|首付.*?(\d+)%/i);
    
    if (longPaymentMatch && parseInt(longPaymentMatch[1]) > 30) {
      risks.push({
        id: `ai-risk-${risks.length + 1}`,
        clause: longPaymentMatch[0],
        location: '付款条款',
        riskType: 'commercial',
        severity: 'medium',
        explanation: `付款账期为${longPaymentMatch[1]}天，较长，可能占用公司资金。`,
        suggestion: '建议争取预付款或缩短账期至15-30天，或约定分期付款。',
        category: '财务风险',
      });
    }
    
    if (!prepayMatch) {
      risks.push({
        id: `ai-risk-${risks.length + 1}`,
        clause: '付款条款',
        location: '付款方式',
        riskType: 'commercial',
        severity: 'low',
        explanation: '未约定预付款比例，可能增加资金风险。',
        suggestion: '建议约定30%预付款，验收合格后支付尾款。',
        category: '财务风险',
      });
    }
  }
  
  // Analyze jurisdiction
  if (hasJurisdiction) {
    const unfavorableJurisdiction = /被告所在地|甲方所在地|对方所在地/i.test(contractText);
    if (unfavorableJurisdiction) {
      risks.push({
        id: `ai-risk-${risks.length + 1}`,
        clause: '争议解决条款',
        location: '争议解决',
        riskType: 'legal',
        severity: 'high',
        explanation: '约定在被告所在地法院管辖，对我方可能不利，增加诉讼成本。',
        suggestion: '建议改为"原告所在地或合同签订地法院管辖"，或约定仲裁。',
        category: '法律风险',
        law: '《民事诉讼法》第34条',
      });
    }
  }
  
  // Analyze penalty
  const penaltyMatch = contractText.match(/违约金.*?([\d.]+%|百分之[一二三四五六七八九十]+)/i);
  if (penaltyMatch) {
    const penaltyPercent = penaltyMatch[1].includes('%') 
      ? parseFloat(penaltyMatch[1]) 
      : 30;
    if (penaltyPercent > 20) {
      risks.push({
        id: `ai-risk-${risks.length + 1}`,
        clause: penaltyMatch[0],
        location: '违约责任',
        riskType: 'legal',
        severity: 'high',
        explanation: `违约金约定为${penaltyMatch[1]}，可能被法院认定为过高而调减。`,
        suggestion: '建议约定"不超过实际损失的130%"或设置具体金额上限。',
        category: '法律风险',
        law: '《民法典》第585条',
      });
    }
  }
  
  // Analyze confidentiality
  if (!hasConfidentiality) {
    risks.push({
      id: `ai-risk-${risks.length + 1}`,
      clause: '合同全文',
      location: '整体',
      riskType: 'legal',
      severity: 'medium',
      explanation: '未检测到保密条款，涉及商业信息保护不足。',
      suggestion: '建议增加保密条款，明确保密信息范围、期限和违约责任。',
      category: '法律风险',
    });
  }
  
  // Analyze IP
  if (!hasIP && /技术|开发|设计|创作|软件|系统/i.test(contractText)) {
    risks.push({
      id: `ai-risk-${risks.length + 1}`,
      clause: '合同全文',
      location: '整体',
      riskType: 'legal',
      severity: 'medium',
      explanation: '合同涉及技术服务/创作，但未明确知识产权归属。',
      suggestion: '建议明确约定知识产权的归属、使用范围及后续改进权益。',
      category: '知识产权',
    });
  }
  
  // Analyze warranty
  if (!hasWarranty && /采购|供货|设备|产品/i.test(contractText)) {
    risks.push({
      id: `ai-risk-${risks.length + 1}`,
      clause: '合同全文',
      location: '整体',
      riskType: 'commercial',
      severity: 'low',
      explanation: '未明确质量保证条款和质保期限。',
      suggestion: '建议约定质保期（通常12个月）及质保范围内的维修/更换责任。',
      category: '商业风险',
    });
  }
  
  // Analyze liability limitation
  if (!hasLiability && /服务|承包|委托/i.test(contractText)) {
    risks.push({
      id: `ai-risk-${risks.length + 1}`,
      clause: '合同全文',
      location: '整体',
      riskType: 'legal',
      severity: 'medium',
      explanation: '未约定责任限制条款，可能导致无限赔偿责任。',
      suggestion: '建议约定"赔偿不超过合同金额"或设置具体赔偿上限。',
      category: '法律风险',
    });
  }
  
  // Calculate overall risk
  const highRiskCount = risks.filter(r => r.severity === 'high').length;
  const mediumRiskCount = risks.filter(r => r.severity === 'medium').length;
  
  let overallRisk: 'high' | 'medium' | 'low' = 'low';
  if (highRiskCount >= 2) {
    overallRisk = 'high';
  } else if (highRiskCount >= 1 || mediumRiskCount >= 2) {
    overallRisk = 'medium';
  }
  
  // Calculate risk score (0-100, higher is better/less risky)
  const riskScore = Math.max(0, 100 - highRiskCount * 25 - mediumRiskCount * 15);
  
  // Missing clauses
  const missingClauses: string[] = [];
  if (!hasConfidentiality) missingClauses.push('保密条款');
  if (!hasTermination) missingClauses.push('不可抗力条款');
  if (!/通知|送达/i.test(contractText)) missingClauses.push('通知送达条款');
  if (!/附件/i.test(contractText)) missingClauses.push('合同附件清单');
  if (!hasLiability) missingClauses.push('责任限制条款');
  
  return {
    id: 'mock-review',
    contractId: '',
    overallRisk,
    riskScore,
    keyRisks: risks,
    missingClauses,
    thinking: `经过对合同的全面审查，发现${risks.length}个主要风险点。${highRiskCount > 0 ? '其中存在' + highRiskCount + '个高风险项需要重点关注。' : ''}${mediumRiskCount > 0 ? '同时发现' + mediumRiskCount + '个中风险项建议改进。' : ''}建议优先处理管辖条款和违约责任条款的修改。`,
    createdAt: new Date().toISOString(),
  };
}

// Qwen API call (DashScope compatible mode)
export async function analyzeContractWithQwen(contractText: string): Promise<AIReview> {
  if (!QWEN_API_KEY) {
    console.log('No Qwen API key found, using mock analysis');
    return generateMockAIReview(contractText);
  }
  
  try {
    console.log('Calling Qwen API for contract analysis...');
    console.log('API URL:', QWEN_API_URL);
    console.log('Contract text length:', contractText.length);
    
    // Truncate contract text if too long (Qwen has token limits)
    const maxLength = 8000;
    const truncatedText = contractText.length > maxLength 
      ? contractText.substring(0, maxLength) + '\n... (合同内容已截断)' 
      : contractText;
    
    const requestBody = {
      model: 'qwen-plus',
      messages: [
        { 
          role: 'system', 
          content: 'You are a legal contract review assistant. You must respond in valid JSON format only. Do not include any markdown formatting, explanations, or extra text outside the JSON.' 
        },
        { 
          role: 'user', 
          content: REVIEW_PROMPT + truncatedText 
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${QWEN_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error response:', errorText);
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Qwen API response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid Qwen API response structure:', data);
      throw new Error('Invalid Qwen API response structure');
    }
    
    const content = data.choices[0].message.content;
    console.log('Qwen response content:', content.substring(0, 200));
    
    // Parse the JSON response
    let result: any;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/```\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      
      // Remove any non-JSON prefix/suffix
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      const cleanJson = jsonStart >= 0 && jsonEnd > jsonStart 
        ? jsonStr.substring(jsonStart, jsonEnd + 1) 
        : jsonStr;
      
      result = JSON.parse(cleanJson);
      console.log('Successfully parsed Qwen response');
    } catch (parseError) {
      console.error('Failed to parse Qwen response as JSON:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse Qwen response as JSON');
    }
    
    // Validate result structure
    if (!result.keyRisks || !Array.isArray(result.keyRisks)) {
      console.warn('Qwen response missing keyRisks, using mock fallback');
      return generateMockAIReview(contractText);
    }
    
    return {
      id: 'qwen-review',
      contractId: '',
      overallRisk: result.overallRisk || 'medium',
      riskScore: result.riskScore || 70,
      keyRisks: result.keyRisks.map((risk: RiskItem, index: number) => ({
        ...risk,
        id: `ai-risk-${index + 1}`,
      })),
      missingClauses: result.missingClauses || [],
      thinking: result.thinking || 'AI分析完成',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Qwen analysis failed:', error);
    // Return mock review as fallback
    console.log('Falling back to mock review due to error');
    return generateMockAIReview(contractText);
  }
}

// DeepSeek API call
export async function analyzeContractWithDeepSeek(contractText: string): Promise<AIReview> {
  if (!DEEPSEEK_API_KEY) {
    console.log('No DeepSeek API key found, using mock analysis');
    return generateMockAIReview(contractText);
  }
  
  try {
    console.log('Calling DeepSeek API for contract analysis...');
    
    const maxLength = 8000;
    const truncatedText = contractText.length > maxLength 
      ? contractText.substring(0, maxLength) + '\n... (合同内容已截断)' 
      : contractText;
    
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a legal contract review assistant. Always respond in valid JSON format.' },
          { role: 'user', content: REVIEW_PROMPT + truncatedText },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/```\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    
    const result = JSON.parse(jsonStr);
    
    return {
      id: 'deepseek-review',
      contractId: '',
      overallRisk: result.overallRisk,
      riskScore: result.riskScore,
      keyRisks: result.keyRisks.map((risk: RiskItem, index: number) => ({
        ...risk,
        id: `ai-risk-${index + 1}`,
      })),
      missingClauses: result.missingClauses || [],
      thinking: result.thinking,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('DeepSeek analysis failed:', error);
    return generateMockAIReview(contractText);
  }
}

// Unified analysis function
export async function analyzeContract(contractText: string): Promise<AIReview> {
  console.log(`Using AI provider: ${AI_PROVIDER}`);
  
  switch (AI_PROVIDER) {
    case 'qwen':
      return analyzeContractWithQwen(contractText);
    case 'deepseek':
      return analyzeContractWithDeepSeek(contractText);
    default:
      return generateMockAIReview(contractText);
  }
}

// Generate contract template based on requirements
export async function generateContractTemplate(
  type: string, 
  requirements: string
): Promise<string> {
  const prompt = `
根据以下需求，生成一份${type}合同的基本框架，包含主要条款：

需求描述：${requirements}

请生成专业的合同文本，包含：
1. 合同标题
2. 双方信息
3. 主要条款（标的、价款、履行期限、违约责任等）
4. 争议解决条款
5. 其他必要条款

返回纯文本格式。
`;

  // Mock implementation
  return `合同编号：_________

${type}合同

甲方（委托方）：_________
乙方（受托方）：_________

鉴于：
${requirements}

双方经友好协商，达成如下协议：

第一条 合同标的
_________

第二条 合同价款及支付方式
1. 合同总金额为人民币_________元（大写：_________）。
2. 付款方式：_________

第三条 履行期限
本合同自____年__月__日起至____年__月__日止。

第四条 双方权利义务
1. 甲方权利义务：_________
2. 乙方权利义务：_________

第五条 知识产权
_________

第六条 保密条款
双方对本合同内容及履行过程中知悉的商业秘密负有保密义务。

第七条 违约责任
1. 任何一方违反本合同约定，应承担违约责任。
2. 违约金为合同总金额的____%。

第八条 争议解决
因本合同引起的争议，双方应友好协商解决；协商不成的，提交_________仲裁委员会仲裁。

第九条 其他
1. 本合同一式两份，双方各执一份。
2. 本合同自双方签字盖章之日起生效。

（以下无正文）

甲方（盖章）：_________    乙方（盖章）：_________
授权代表：_________        授权代表：_________
日期：____年__月__日        日期：____年__月__日
`;
}
