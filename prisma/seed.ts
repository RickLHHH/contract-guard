import { PrismaClient, UserRole, ContractType, ContractStatus, RiskLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create demo users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'business@example.com' },
      update: {},
      create: {
        email: 'business@example.com',
        name: '张业务',
        role: UserRole.BUSINESS_USER,
        department: '采购部',
        avatar: '',
      },
    }),
    prisma.user.upsert({
      where: { email: 'legal@example.com' },
      update: {},
      create: {
        email: 'legal@example.com',
        name: '李法务',
        role: UserRole.LEGAL_SPECIALIST,
        department: '法务部',
        avatar: '',
      },
    }),
    prisma.user.upsert({
      where: { email: 'director@example.com' },
      update: {},
      create: {
        email: 'director@example.com',
        name: '王总监',
        role: UserRole.LEGAL_DIRECTOR,
        department: '法务部',
        avatar: '',
      },
    }),
    prisma.user.upsert({
      where: { email: 'finance@example.com' },
      update: {},
      create: {
        email: 'finance@example.com',
        name: '赵财务',
        role: UserRole.FINANCE,
        department: '财务部',
        avatar: '',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ceo@example.com' },
      update: {},
      create: {
        email: 'ceo@example.com',
        name: '刘总',
        role: UserRole.CEO,
        department: '管理层',
        avatar: '',
      },
    }),
  ]);

  console.log('Created users:', users.length);

  // Create sample contracts
  const sampleContracts = [
    {
      title: '办公设备采购合同',
      type: ContractType.PROCUREMENT,
      status: ContractStatus.APPROVED,
      counterparty: '科技有限公司',
      amount: 460000,
      riskLevel: RiskLevel.C,
      parsedText: `采购合同

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

第三条 交付与验收
1. 交付时间：合同签订后15个工作日内
2. 交付地点：甲方指定地点
3. 验收标准：按行业标准验收

第四条 质量保证
乙方保证所供货物为全新原装正品，质保期为3个月。

第五条 违约责任
1. 如乙方延迟交付，每延迟一日，应支付合同金额1%的违约金。
2. 违约金最高不超过合同金额的30%。

第六条 争议解决
因本合同引起的争议，双方应友好协商解决；协商不成的，任何一方均可向被告所在地人民法院提起诉讼。

第七条 其他
1. 本合同一式两份，双方各执一份。
2. 本合同自双方签字盖章之日起生效。`,
    },
    {
      title: '技术服务合同',
      type: ContractType.SERVICE,
      status: ContractStatus.LEGAL_REVIEW,
      counterparty: '软件开发有限公司',
      amount: 1200000,
      riskLevel: RiskLevel.B,
      parsedText: `技术服务合同

合同编号：JS-2024-003

甲方（委托方）：创新科技有限公司
乙方（受托方）：软件开发有限公司

鉴于甲方委托乙方开发软件系统，双方达成如下协议：

第一条 项目内容
1. 项目名称：企业管理系统开发
2. 项目范围：包括需求分析、系统设计、编码实现、测试部署

第二条 开发周期
1. 项目启动日期：2024年2月1日
2. 项目交付日期：2024年8月1日
3. 总工期：6个月

第三条 合同金额
本合同总金额为人民币2,500,000元。

第四条 付款方式
1. 首付款：合同签订后支付30%，即750,000元
2. 阶段款：完成系统设计后支付30%，即750,000元
3. 验收款：系统验收合格后支付35%，即875,000元
4. 质保金：验收后满一年支付5%，即125,000元

第五条 违约责任
如乙方延迟交付，每延迟一日，应支付合同金额0.5%的违约金，最高不超过合同金额的50%。

第六条 争议解决
因本合同引起的争议，双方应友好协商解决；协商不成的，任何一方均可向被告所在地人民法院提起诉讼。`,
    },
    {
      title: '房屋租赁合同',
      type: ContractType.LEASE,
      status: ContractStatus.AI_REVIEWING,
      counterparty: '房地产开发有限公司',
      amount: 1200000,
      riskLevel: RiskLevel.D,
      parsedText: `房屋租赁合同

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

第五条 争议解决
因本合同引起的争议，双方应友好协商解决；协商不成的，任何一方均可向房屋所在地人民法院提起诉讼。`,
    },
  ];

  for (const contractData of sampleContracts) {
    const existing = await prisma.contract.findFirst({
      where: { title: contractData.title },
    });

    if (!existing) {
      const contract = await prisma.contract.create({
        data: {
          ...contractData,
          creatorId: users[0].id,
          originalFile: '',
        },
      });

      // Create initial version
      await prisma.contractVersion.create({
        data: {
          contractId: contract.id,
          versionNumber: 1,
          fileUrl: '',
          createdBy: users[0].id,
        },
      });

      console.log('Created contract:', contract.title);
    }
  }

  // Create knowledge base documents
  const knowledgeDocs = [
    {
      title: '采购合同标准模板',
      type: 'TEMPLATE',
      content: '标准采购合同模板内容...',
    },
    {
      title: '公司合同审批管理办法',
      type: 'POLICY',
      content: '第一章 总则...',
    },
    {
      title: '常见合同纠纷案例分析',
      type: 'PRECEDENT',
      content: '案例一：付款条款纠纷...',
    },
  ];

  for (const doc of knowledgeDocs) {
    const existing = await prisma.knowledgeDoc.findFirst({
      where: { title: doc.title },
    });

    if (!existing) {
      await prisma.knowledgeDoc.create({
        data: doc as { title: string; type: 'TEMPLATE' | 'POLICY' | 'PRECEDENT' | 'CLAUSE_LIBRARY'; content: string },
      });
      console.log('Created knowledge doc:', doc.title);
    }
  }

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
