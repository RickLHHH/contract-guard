import { PrismaClient, UserRole, ContractType, ContractStatus, RiskLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充初始数据...');

  // 创建默认用户
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@contractguard.com' },
      update: {},
      create: {
        email: 'admin@contractguard.com',
        name: '系统管理员',
        role: UserRole.ADMIN,
        department: 'IT部',
      },
    }),
    prisma.user.upsert({
      where: { email: 'business@contractguard.com' },
      update: {},
      create: {
        email: 'business@contractguard.com',
        name: '张业务',
        role: UserRole.BUSINESS_USER,
        department: '采购部',
      },
    }),
    prisma.user.upsert({
      where: { email: 'legal@contractguard.com' },
      update: {},
      create: {
        email: 'legal@contractguard.com',
        name: '李法务',
        role: UserRole.LEGAL_SPECIALIST,
        department: '法务部',
      },
    }),
    prisma.user.upsert({
      where: { email: 'director@contractguard.com' },
      update: {},
      create: {
        email: 'director@contractguard.com',
        name: '王总监',
        role: UserRole.LEGAL_DIRECTOR,
        department: '法务部',
      },
    }),
    prisma.user.upsert({
      where: { email: 'finance@contractguard.com' },
      update: {},
      create: {
        email: 'finance@contractguard.com',
        name: '赵财务',
        role: UserRole.FINANCE,
        department: '财务部',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ceo@contractguard.com' },
      update: {},
      create: {
        email: 'ceo@contractguard.com',
        name: '刘总',
        role: UserRole.CEO,
        department: '管理层',
      },
    }),
  ]);

  console.log(`✅ 创建了 ${users.length} 个用户`);

  // 创建示例合同（可选，用于演示）
  const sampleContract = await prisma.contract.findFirst({
    where: { title: '示例采购合同' },
  });

  if (!sampleContract) {
    await prisma.contract.create({
      data: {
        title: '示例采购合同',
        type: ContractType.PROCUREMENT,
        status: ContractStatus.APPROVED,
        counterparty: '示例供应商科技有限公司',
        amount: 500000,
        riskLevel: RiskLevel.C,
        originalFile: '',
        parsedText: `采购合同

合同编号：CG-2024-001

甲方（采购方）：示例科技有限公司
乙方（供应方）：示例供应商科技有限公司

第一条 合同标的
甲方向乙方采购办公设备一批。

第二条 付款方式
合同签订后30日内支付50%预付款，验收合格后支付剩余50%。

第三条 违约责任
违约金不超过合同金额的10%。

第四条 争议解决
由原告所在地法院管辖。`,
        creatorId: users[1].id, // 张业务
        metadata: {
          pageCount: 3,
          wordCount: 500,
          isSample: true,
        },
      },
    });
    console.log('✅ 创建了示例合同');
  }

  console.log('🎉 初始数据填充完成');
}

main()
  .catch((e) => {
    console.error('❌ 数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
