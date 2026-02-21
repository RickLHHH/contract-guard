import { ContractRule } from '@/types';

// Contract Rules Engine - Rule Definitions
export const CONTRACT_RULES: ContractRule[] = [
  {
    id: 'payment-term-30-60-90',
    name: '长付款账期检查',
    pattern: /付款.*(30|60|90).*(天|日|工作日)/i,
    riskLevel: 'medium',
    message: '付款账期较长，建议评估资金占用风险',
    suggestion: '建议争取预付款或缩短账期至15天内',
    category: '财务风险',
  },
  {
    id: 'jurisdiction-defendant',
    name: '不利管辖条款',
    pattern: /管辖.*(被告|甲方|对方).*所在地/i,
    riskLevel: 'high',
    message: '争议解决条款对我方不利',
    suggestion: '建议改为"原告所在地或合同签订地法院管辖"',
    category: '法律风险',
    law: '《民事诉讼法》第34条',
  },
  {
    id: 'high-penalty',
    name: '过高违约金',
    pattern: /违约金.*(20%|30%|50%|百分之二十|百分之三十|百分之五十).*合同金额/i,
    riskLevel: 'high',
    message: '违约金比例可能过高，存在被法院调减风险',
    suggestion: '建议约定"不超过实际损失的130%"或具体金额',
    category: '法律风险',
    law: '《民法典》第585条',
  },
  {
    id: 'no-termination-clause',
    name: '解除权缺失',
    pattern: /解除.*(无法|不能|不得)|无.*(单方|任意).*解除/i,
    riskLevel: 'medium',
    message: '合同解除机制不完善',
    suggestion: '建议明确约定单方解除权的情形和程序',
    category: '法律风险',
  },
  {
    id: 'ip-ownership-unclear',
    name: '知识产权归属不明',
    pattern: /知识产权.*(共有|共享|未约定)|归属.*不明/i,
    riskLevel: 'medium',
    message: '知识产权归属约定不清晰',
    suggestion: '建议明确约定知识产权的归属和使用范围',
    category: '知识产权',
  },
  {
    id: 'unlimited-liability',
    name: '无限责任条款',
    pattern: /(承担|赔偿).*(全部|所有|一切|无限).*损失/i,
    riskLevel: 'high',
    message: '承担无限赔偿责任风险过高',
    suggestion: '建议约定"直接损失"或设置责任上限',
    category: '法律风险',
  },
  {
    id: 'auto-renewal',
    name: '自动续约条款',
    pattern: /(自动|默示|期满|到期).*续约|自动.*延期/i,
    riskLevel: 'medium',
    message: '存在自动续约条款，可能导致合同期限失控',
    suggestion: '建议删除自动续约条款或提前设置提醒机制',
    category: '商业风险',
  },
  {
    id: 'unilateral-amendment',
    name: '单方变更权',
    pattern: /甲方.*(有权|可以|可).*修改.*(无需|不须).*通知/i,
    riskLevel: 'medium',
    message: '对方保留单方修改合同的权利',
    suggestion: '建议约定重大条款变更需双方书面确认',
    category: '法律风险',
  },
  {
    id: 'exclusivity-without-limit',
    name: '无限制排他条款',
    pattern: /排他|独家|独占.*(合作|代理|经销)/i,
    riskLevel: 'low',
    message: '存在排他性条款，可能限制业务拓展',
    suggestion: '建议明确排他期限和地域范围',
    category: '商业风险',
  },
  {
    id: 'no-confidentiality',
    name: '保密条款缺失',
    pattern: /^(?!.*保密).*$/is,
    riskLevel: 'medium',
    message: '未检测到保密条款',
    suggestion: '建议增加保密条款，明确保密范围和期限',
    category: '法律风险',
  },
  {
    id: 'no-force-majeure',
    name: '不可抗力缺失',
    pattern: /^(?!.*不可抗力).*$/is,
    riskLevel: 'low',
    message: '未检测到不可抗力条款',
    suggestion: '建议补充不可抗力条款',
    category: '法律风险',
  },
  {
    id: 'warranty-period-short',
    name: '质保期过短',
    pattern: /质保.*(3|三).*(月|个月)|质保期.*(少于|不足).*半年/i,
    riskLevel: 'low',
    message: '质保期限较短',
    suggestion: '建议争取至少12个月质保期',
    category: '商业风险',
  },
  {
    id: 'arbitration-unclear',
    name: '仲裁约定不明',
    pattern: /仲裁.*(由|由双方|协商)|仲裁机构.*未指定/i,
    riskLevel: 'medium',
    message: '仲裁条款约定不明确',
    suggestion: '建议明确约定具体仲裁委员会',
    category: '法律风险',
  },
  {
    id: 'oral-modification',
    name: '口头变更有效',
    pattern: /(口头|电话|邮件).*变更.*有效|可以.*(口头|非书面).*修改/i,
    riskLevel: 'medium',
    message: '允许非书面形式变更合同',
    suggestion: '建议约定"任何变更须书面确认"',
    category: '法律风险',
  },
];

// Risk Level Score Mapping
export const RISK_LEVEL_SCORE = {
  high: 3,
  medium: 2,
  low: 1,
} as const;

// Risk Level Color Mapping
export const RISK_LEVEL_COLORS = {
  A: { bg: 'bg-red-500', text: 'text-red-500', label: '高风险', color: '#ef4444' },
  B: { bg: 'bg-orange-500', text: 'text-orange-500', label: '中风险', color: '#f97316' },
  C: { bg: 'bg-yellow-500', text: 'text-yellow-500', label: '低风险', color: '#eab308' },
  D: { bg: 'bg-green-500', text: 'text-green-500', label: '极低风险', color: '#22c55e' },
} as const;

// Risk Level Badge Mapping
export const RISK_BADGES = {
  high: { variant: 'destructive' as const, label: '🔴 致命' },
  medium: { variant: 'default' as const, label: '🟡 警告' },
  low: { variant: 'secondary' as const, label: '🟢 提示' },
} as const;

// Workflow Templates
export const WORKFLOW_TEMPLATES = {
  standard: {
    id: 'standard',
    name: '标准审批流程',
    description: '适用于一般合同',
    nodes: [
      { id: 'start', type: 'START', label: '开始' },
      { id: 'ai_review', type: 'AI_REVIEW', label: 'AI审查' },
      { id: 'legal_review', type: 'LEGAL_REVIEW', label: '法务审查' },
      { id: 'legal_director', type: 'LEGAL_REVIEW', label: '法务总监审核' },
      { id: 'end', type: 'END', label: '完成' },
    ],
  },
  high_value: {
    id: 'high_value',
    name: '高价值合同审批',
    description: '适用于金额大于100万的合同',
    nodes: [
      { id: 'start', type: 'START', label: '开始' },
      { id: 'ai_review', type: 'AI_REVIEW', label: 'AI审查' },
      { id: 'legal_review', type: 'LEGAL_REVIEW', label: '法务审查' },
      { id: 'finance_review', type: 'FINANCE_REVIEW', label: '财务审核' },
      { id: 'legal_director', type: 'LEGAL_REVIEW', label: '法务总监审核' },
      { id: 'ceo_approval', type: 'MANAGEMENT_APPROVAL', label: 'CEO审批' },
      { id: 'end', type: 'END', label: '完成' },
    ],
  },
  simple: {
    id: 'simple',
    name: '简易审批流程',
    description: '适用于低风险标准合同',
    nodes: [
      { id: 'start', type: 'START', label: '开始' },
      { id: 'ai_review', type: 'AI_REVIEW', label: 'AI审查' },
      { id: 'legal_review', type: 'LEGAL_REVIEW', label: '法务审查' },
      { id: 'end', type: 'END', label: '完成' },
    ],
  },
} as const;

// Contract Type Labels
export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  SALES: '销售合同',
  PROCUREMENT: '采购合同',
  EMPLOYMENT: '劳动合同',
  NDA: '保密协议',
  SERVICE: '服务合同',
  LEASE: '租赁合同',
  OTHERS: '其他',
};

// Contract Status Labels
export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  AI_REVIEWING: 'AI审查中',
  LEGAL_REVIEW: '法务审查中',
  APPROVING: '审批中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  ARCHIVED: '已归档',
};

// User Role Labels
export const USER_ROLE_LABELS: Record<string, string> = {
  BUSINESS_USER: '业务人员',
  LEGAL_SPECIALIST: '法务专员',
  LEGAL_DIRECTOR: '法务总监',
  FINANCE: '财务',
  CEO: 'CEO',
  ADMIN: '管理员',
};
