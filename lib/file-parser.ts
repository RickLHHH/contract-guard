// File parsing utilities for PDF and Word documents
// Note: In a production environment, you'd use proper parsers like pdf-parse or mammoth

// Mock contract texts for demo purposes
const MOCK_CONTRACTS: Record<string, string> = {
  procurement: `采购合同

合同编号：CG-2024-001

甲方（采购方）：科技有限公司
乙方（供应方）：贸易有限公司

鉴于甲方需要采购办公设备，乙方具备供货能力，双方经友好协商，达成如下协议：

第一条 合同标的
甲方向乙方采购以下货物：
1. 笔记本电脑 50台，单价8000元
2. 打印机 10台，单价3000元
3. 办公桌椅 20套，单价2000元
合计金额：人民币460,000元

第二条 付款方式
乙方交付全部货物并经甲方验收合格后，甲方在60个工作日内支付全部货款。
付款方式：银行转账

第三条 交付与验收
1. 交付时间：合同签订后15个工作日内
2. 交付地点：甲方指定地点
3. 验收标准：按行业标准验收

第四条 质量保证
乙方保证所供货物为全新原装正品，质保期为3个月。

第五条 违约责任
1. 如乙方延迟交付，每延迟一日，应支付合同金额1%的违约金。
2. 如甲方延迟付款，每延迟一日，应支付未付金额0.5%的违约金。
3. 违约金最高不超过合同金额的30%。

第六条 争议解决
因本合同引起的争议，双方应友好协商解决；协商不成的，任何一方均可向被告所在地人民法院提起诉讼。

第七条 其他
1. 本合同一式两份，双方各执一份。
2. 本合同自双方签字盖章之日起生效。

（以下无正文）

甲方（盖章）：_________    乙方（盖章）：_________
授权代表：_________        授权代表：_________
日期：____年__月__日        日期：____年__月__日`,

  sales: `销售合同

合同编号：XS-2024-002

甲方（买方）：实业有限公司
乙方（卖方）：科技有限公司

鉴于甲方需要购买技术服务，乙方具备服务能力，双方达成如下协议：

第一条 服务内容
乙方向甲方提供以下技术服务：
1. 软件开发服务
2. 系统维护服务
3. 技术咨询服务

第二条 服务费用
合同总金额为人民币1,200,000元。

第三条 付款方式
1. 合同签订后5个工作日内，甲方支付合同金额的30%作为预付款。
2. 项目验收合格后，甲方支付剩余70%款项。

第四条 服务期限
本合同服务期限自2024年1月1日起至2024年12月31日止。

第五条 知识产权
服务过程中产生的所有知识产权归乙方所有，甲方享有使用权。

第六条 保密条款
双方对本合同内容及履行过程中知悉的商业秘密负有保密义务，保密期限为合同终止后2年。

第七条 违约责任
1. 如乙方未按期完成服务，应支付合同金额20%的违约金。
2. 如甲方未按期付款，应支付合同金额10%的违约金。

第八条 争议解决
因本合同引起的争议，双方应友好协商解决；协商不成的，提交原告所在地仲裁委员会仲裁。

第九条 不可抗力
因不可抗力导致无法履行合同的，受影响方不承担违约责任。

第十条 其他
1. 本合同一式两份，双方各执一份。
2. 本合同自双方签字盖章之日起生效。

甲方（盖章）：_________    乙方（盖章）：_________
授权代表：_________        授权代表：_________
日期：____年__月__日        日期：____年__月__日`,

  service: `技术服务合同

合同编号：JS-2024-003

甲方（委托方）：创新科技有限公司
乙方（受托方）：软件开发有限公司

鉴于甲方委托乙方开发软件系统，双方达成如下协议：

第一条 项目内容
1. 项目名称：企业管理系统开发
2. 项目范围：包括需求分析、系统设计、编码实现、测试部署
3. 功能模块：用户管理、订单管理、财务管理、报表统计

第二条 开发周期
1. 项目启动日期：2024年2月1日
2. 项目交付日期：2024年8月1日
3. 总工期：6个月

第三条 合同金额
本合同总金额为人民币2,500,000元（大写：贰佰伍拾万元整）。

第四条 付款方式
1. 首付款：合同签订后5个工作日内支付30%，即750,000元
2. 阶段款：完成系统设计后支付30%，即750,000元
3. 验收款：系统验收合格后支付35%，即875,000元
4. 质保金：验收后满一年支付5%，即125,000元

第五条 双方权利义务
1. 甲方应按期支付款项，提供必要的业务资料和技术配合
2. 乙方应按期交付成果，保证软件质量符合约定标准

第六条 验收标准
1. 功能完整性：所有约定功能正常运行
2. 性能指标：系统响应时间不超过3秒
3. 缺陷标准：严重缺陷为0，一般缺陷不超过5个

第七条 知识产权
1. 乙方完成的软件著作权归甲方所有
2. 乙方保留底层框架的知识产权
3. 未经甲方书面同意，乙方不得将本项目成果用于其他项目

第八条 保密义务
1. 双方对本项目涉及的商业秘密和技术资料负有保密义务
2. 保密期限：合同终止后5年
3. 违约责任：违约方应赔偿守约方全部损失

第九条 违约责任
1. 如乙方延迟交付，每延迟一日，应支付合同金额0.5%的违约金，最高不超过合同金额的50%
2. 如甲方延迟付款，每延迟一日，应支付未付金额0.1%的滞纳金
3. 任何一方违反保密义务的，应支付违约金500,000元

第十条 争议解决
因本合同引起的争议，双方应友好协商解决；协商不成的，任何一方均可向被告所在地人民法院提起诉讼。

第十一条 其他约定
1. 本合同未尽事宜，双方可另行签订补充协议
2. 本合同一式两份，双方各执一份
3. 本合同自双方签字盖章之日起生效

第十二条 通知送达
双方确认以下地址为有效送达地址：
甲方地址：_________
乙方地址：_________

甲方（盖章）：_________    乙方（盖章）：_________
授权代表：_________        授权代表：_________
日期：____年__月__日        日期：____年__月__日`,

  lease: `房屋租赁合同

合同编号：ZL-2024-004

出租方（甲方）：房地产开发有限公司
承租方（乙买）：网络科技有限公司

第一条 租赁房屋
甲方将位于_________的房屋出租给乙方使用，建筑面积500平方米。

第二条 租赁期限
租赁期限自2024年3月1日起至2026年2月28日止，共计2年。

第三条 租金及支付方式
1. 月租金：人民币50,000元
2. 支付方式：押三付三，每季度首月5日前支付
3. 押金：150,000元，合同期满无违约退还

第四条 房屋用途
乙方承租该房屋用于办公经营，未经甲方书面同意，不得改变用途。

第五条 房屋维护
1. 甲方负责房屋主体结构的维修
2. 乙方负责日常维护和内部设施的维修

第六条 转租与转让
未经甲方书面同意，乙方不得将房屋转租、转让或转借他人使用。

第七条 合同解除
1. 经双方协商一致，可以解除本合同
2. 乙方逾期支付租金超过30日的，甲方有权解除合同
3. 甲方未尽维修义务影响乙方正常使用的，乙方有权解除合同

第八条 违约责任
1. 甲方提前收回房屋的，应退还剩余租金并支付3个月租金作为违约金
2. 乙方提前退租的，押金不予退还
3. 乙方逾期支付租金的，每逾期一日，应支付月租金1%的违约金

第九条 争议解决
因本合同引起的争议，双方应友好协商解决；协商不成的，任何一方均可向房屋所在地人民法院提起诉讼。

第十条 其他
1. 本合同未尽事宜，按相关法律法规执行
2. 本合同一式两份，双方各执一份
3. 本合同自双方签字盖章之日起生效

甲方（盖章）：_________    乙方（盖章）：_________
授权代表：_________        授权代表：_________
日期：____年__月__日        日期：____年__月__日`,
};

// Parse file content - compatible with both browser and server environments
export async function parseFile(file: File): Promise<{ text: string; type: string }> {
  // For server-side rendering/build, return mock data directly
  if (typeof window === 'undefined') {
    const mockType = detectContractType(file.name);
    const mockText = MOCK_CONTRACTS[mockType] || MOCK_CONTRACTS.procurement;
    
    return {
      text: mockText,
      type: mockType,
    };
  }
  
  // Browser environment - use FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // For demo purposes, return mock content based on filename
      const mockType = detectContractType(file.name);
      const mockText = MOCK_CONTRACTS[mockType] || MOCK_CONTRACTS.procurement;
      
      resolve({
        text: mockText,
        type: mockType,
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // For demo, we read as text. In production, use appropriate parsers
    reader.readAsText(file);
  });
}

// Detect contract type from filename
function detectContractType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('sale') || lower.includes('销售') || lower.includes('xs')) {
    return 'sales';
  }
  if (lower.includes('procurement') || lower.includes('采购') || lower.includes('cg')) {
    return 'procurement';
  }
  if (lower.includes('service') || lower.includes('服务') || lower.includes('js')) {
    return 'service';
  }
  if (lower.includes('lease') || lower.includes('租赁') || lower.includes('zl')) {
    return 'lease';
  }
  return 'procurement';
}

// Extract key information from contract text
export function extractContractInfo(text: string): {
  title: string;
  type: string;
  counterparty: string;
  amount: number | null;
} {
  // Extract title
  const titleMatch = text.match(/^(.*?)(合同|协议)/m);
  const title = titleMatch ? titleMatch[0] : '未命名合同';
  
  // Extract type
  let type = 'OTHERS';
  if (text.includes('采购') || text.includes('供货')) {
    type = 'PROCUREMENT';
  } else if (text.includes('销售')) {
    type = 'SALES';
  } else if (text.includes('服务') || text.includes('开发')) {
    type = 'SERVICE';
  } else if (text.includes('租赁')) {
    type = 'LEASE';
  } else if (text.includes('保密') || text.includes('NDA')) {
    type = 'NDA';
  } else if (text.includes('劳动') || text.includes('聘用')) {
    type = 'EMPLOYMENT';
  }
  
  // Extract counterparty
  const partyMatch = text.match(/乙方[（(](.*?)[)）][:：]\s*(.+?)(?:\n|$)/m);
  const counterparty = partyMatch ? partyMatch[2].trim() : '未知主体';
  
  // Extract amount
  const amountMatch = text.match(/(?:合同总?金额|总?价款)[：:]\s*(?:人民币)?\s*([\d,]+)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
  
  return {
    title,
    type,
    counterparty,
    amount,
  };
}

// Split contract into clauses
export function splitIntoClauses(text: string): Array<{ title: string; content: string }> {
  const clauses: Array<{ title: string; content: string }> = [];
  
  // Match clauses like "第一条 ...", "第1条 ...", etc.
  const clauseRegex = /第[一二三四五六七八九十百千零\d]+条[、.\s]+([^\n]+)\n([\s\S]*?)(?=第[一二三四五六七八九十百千零\d]+条|$)/g;
  
  let match;
  while ((match = clauseRegex.exec(text)) !== null) {
    clauses.push({
      title: match[1].trim(),
      content: match[2].trim(),
    });
  }
  
  // If no clauses found, treat whole text as one section
  if (clauses.length === 0) {
    clauses.push({
      title: '合同正文',
      content: text,
    });
  }
  
  return clauses;
}

// Find text position by offset (for highlighting)
export function findTextPosition(
  text: string, 
  searchText: string, 
  startIndex: number = 0
): { start: number; end: number } | null {
  const index = text.indexOf(searchText, startIndex);
  if (index === -1) return null;
  
  return {
    start: index,
    end: index + searchText.length,
  };
}

// Clean extracted text
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Get file type label
export function getFileTypeLabel(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const labels: Record<string, string> = {
    pdf: 'PDF文档',
    doc: 'Word文档',
    docx: 'Word文档',
    txt: '文本文件',
  };
  return labels[ext || ''] || '未知类型';
}
