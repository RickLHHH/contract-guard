/**
 * 文本处理工具函数
 */

/**
 * 清理文本格式
 */
export function cleanText(text: string): string {
  if (!text) return '';
  
  return text
    // 统一换行符
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 移除多余的空行（保留最多两个连续换行）
    .replace(/\n{4,}/g, '\n\n\n')
    // 移除行尾空白
    .replace(/[ \t]+$/gm, '')
    // 统一空格
    .replace(/[ \t]+/g, ' ')
    // 移除控制字符
    .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, '')
    .trim();
}

/**
 * 从合同文本中提取关键信息
 */
export function extractContractInfo(text: string): {
  title: string;
  type: string;
  counterparty: string;
  amount: number | null;
  contractNo: string | null;
  signDate: string | null;
} {
  if (!text) {
    return {
      title: '未命名合同',
      type: 'OTHERS',
      counterparty: '未知主体',
      amount: null,
      contractNo: null,
      signDate: null,
    };
  }
  
  // 提取标题 - 优先匹配合同/协议标题
  const titlePatterns = [
    /^(.*?)(合同|协议)\s*\n/m,
    /合同名称[：:]\s*(.+?)(?:\n|$)/i,
    /项目名称[：:]\s*(.+?)(?:\n|$)/i,
  ];
  
  let title = '未命名合同';
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) {
      title = match[1].trim();
      break;
    }
  }
  
  // 提取合同类型
  let type = 'OTHERS';
  const typePatterns: Array<[RegExp, string]> = [
    [/采购|供货|供应|买卖合同/, 'PROCUREMENT'],
    [/销售|经销|代销|买卖合同/, 'SALES'],
    [/服务|委托|咨询|顾问/, 'SERVICE'],
    [/技术开发|软件|系统|定制开发/, 'SERVICE'],
    [/租赁|承租|出租|房屋/, 'LEASE'],
    [/保密|保密义务|NDA|保密协议/, 'NDA'],
    [/劳动|聘用|雇佣|劳动合同/, 'EMPLOYMENT'],
  ];
  
  for (const [pattern, typeValue] of typePatterns) {
    if (pattern.test(text)) {
      type = typeValue;
      break;
    }
  }
  
  // 提取对方主体（乙方）
  let counterparty = '未知主体';
  const partyPatterns = [
    /乙方[（(](.*?)[)）][:：]?\s*(.+?)(?:\n|$)/m,
    /(?:乙方|卖方|服务方|承包方|受托方)[:：]?\s*(.+?)(?:\n|$)/m,
    /乙方[:：]?\s*(.+?)(?:\n|$)/m,
  ];
  
  for (const pattern of partyPatterns) {
    const match = text.match(pattern);
    if (match) {
      counterparty = (match[2] || match[1]).trim();
      // 限制长度
      if (counterparty.length > 50) {
        counterparty = counterparty.substring(0, 50);
      }
      break;
    }
  }
  
  // 提取合同金额
  let amount: number | null = null;
  const amountPatterns = [
    /(?:合同总?金额|总?价款|合同价格)[：:]\s*(?:人民币|¥|￥)?\s*([\d,\.]+)\s*(?:元|万元|圆)/i,
    /(?:金额|价款)[：:]\s*(?:人民币|¥|￥)?\s*([\d,\.]+)\s*(?:元|万元|圆)/i,
    /([\d,\.]+)\s*(?:万元|万人民币)/i,
    /人民币\s*([\d,\.]+)\s*元/i,
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      let value = parseFloat(amountStr);
      // 如果是万元，转换为元
      if (match[0].includes('万元')) {
        value *= 10000;
      }
      if (!isNaN(value) && value > 0) {
        amount = value;
        break;
      }
    }
  }
  
  // 提取合同编号
  let contractNo: string | null = null;
  const noPatterns = [
    /合同编号[：:]\s*([A-Za-z0-9\-]+)/i,
    /编号[：:]\s*([A-Za-z0-9\-]+)/i,
    /No\.?\s*[:：]?\s*([A-Za-z0-9\-]+)/i,
  ];
  
  for (const pattern of noPatterns) {
    const match = text.match(pattern);
    if (match) {
      contractNo = match[1].trim();
      break;
    }
  }
  
  // 提取签署日期
  let signDate: string | null = null;
  const datePatterns = [
    /签订日期[：:]\s*(\d{4}[年/\-]\d{1,2}[月/\-]\d{1,2}[日]?)/,
    /签署日期[：:]\s*(\d{4}[年/\-]\d{1,2}[月/\-]\d{1,2}[日]?)/,
    /日期[：:]\s*(\d{4}[年/\-]\d{1,2}[月/\-]\d{1,2}[日]?)/,
    /(\d{4}[年/\-]\d{1,2}[月/\-]\d{1,2}[日]?)\s*签订/,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      signDate = match[1].trim();
      break;
    }
  }
  
  return {
    title,
    type,
    counterparty,
    amount,
    contractNo,
    signDate,
  };
}

/**
 * 截取文本片段，保持上下文
 */
export function extractContext(text: string, keyword: string, contextLength: number = 50): string {
  const index = text.indexOf(keyword);
  if (index === -1) return '';
  
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + keyword.length + contextLength);
  
  let result = text.substring(start, end);
  if (start > 0) result = '...' + result;
  if (end < text.length) result = result + '...';
  
  return result;
}

/**
 * 高亮关键词
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword) return text;
  const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
  return text.replace(regex, '**$1**');
}

/**
 * 转义正则特殊字符
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 格式化金额显示
 */
export function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `¥${(amount / 100000000).toFixed(2)}亿`;
  } else if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`;
  } else {
    return `¥${amount.toLocaleString()}`;
  }
}

/**
 * 计算文本相似度（用于查重）
 * 使用简单的余弦相似度
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = extractWords(text1);
  const words2 = extractWords(text2);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * 提取关键词
 */
function extractWords(text: string): string[] {
  // 移除标点，分词（简单实现）
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);
}

/**
 * 检测文本编码并转换为 UTF-8
 */
export function ensureUtf8(buffer: Buffer): string {
  // 尝试多种编码
  const encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'big5'];
  
  for (const encoding of encodings) {
    try {
      const text = buffer.toString(encoding as BufferEncoding);
      // 简单验证：如果能正常解码中文，则认为成功
      if (!text.includes('��') && /[\u4e00-\u9fa5]/.test(text)) {
        return text;
      }
    } catch {
      continue;
    }
  }
  
  // 默认返回 UTF-8
  return buffer.toString('utf-8');
}
