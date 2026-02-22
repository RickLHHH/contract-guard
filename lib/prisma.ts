import { PrismaClient, Contract, User, ContractStatus, RiskLevel, ContractType, UserRole } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 检查是否配置了数据库
const hasDatabase = !!process.env.DATABASE_URL;

// 创建 Mock Prisma 客户端（用于演示/开发环境）
const createMockPrisma = (): PrismaClient => {
  console.log('[Prisma] 使用 Mock 客户端（未配置 DATABASE_URL）');
  
  // 内存存储
  const contracts: Contract[] = [];
  const aiReviews: any[] = [];
  const annotations: any[] = [];
  const users: User[] = [
    {
      id: 'user-1',
      email: 'business@contractguard.com',
      name: '张业务',
      role: UserRole.BUSINESS_USER,
      department: '采购部',
      avatar: '',
      createdAt: new Date(),
    },
    {
      id: 'user-2',
      email: 'legal@contractguard.com',
      name: '李法务',
      role: UserRole.LEGAL_SPECIALIST,
      department: '法务部',
      avatar: '',
      createdAt: new Date(),
    },
    {
      id: 'user-3',
      email: 'director@contractguard.com',
      name: '王总监',
      role: UserRole.LEGAL_DIRECTOR,
      department: '法务部',
      avatar: '',
      createdAt: new Date(),
    },
    {
      id: 'user-4',
      email: 'finance@contractguard.com',
      name: '赵财务',
      role: UserRole.FINANCE,
      department: '财务部',
      avatar: '',
      createdAt: new Date(),
    },
    {
      id: 'user-5',
      email: 'admin@contractguard.com',
      name: '系统管理员',
      role: UserRole.ADMIN,
      department: 'IT部',
      avatar: '',
      createdAt: new Date(),
    },
  ];
  
  let idCounter = 0;
  const generateId = () => {
    idCounter++;
    return `mock-${Date.now()}-${idCounter}`;
  };

  const mockHandler = {
    contract: {
      create: async ({ data }: { data: any }) => {
        const contract: Contract = {
          id: generateId(),
          ...data,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        };
        contracts.push(contract);
        console.log('[MockPrisma] 创建合同:', contract.id);
        return contract;
      },
      findMany: async (args?: any) => {
        let result = [...contracts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // 简单实现 where 过滤
        if (args?.where) {
          if (args.where.status) {
            if (Array.isArray(args.where.status.in)) {
              result = result.filter(c => args.where.status.in.includes(c.status));
            } else {
              result = result.filter(c => c.status === args.where.status);
            }
          }
          if (args.where.type) {
            result = result.filter(c => c.type === args.where.type);
          }
          if (args.where.riskLevel) {
            result = result.filter(c => c.riskLevel === args.where.riskLevel);
          }
        }
        
        // 实现 include
        if (args?.include) {
          result = result.map(c => ({
            ...c,
            creator: users.find(u => u.id === c.creatorId),
            aiReview: null,
            _count: { annotations: 0 },
          }));
        }
        
        // 实现分页
        if (args?.skip) result = result.slice(args.skip);
        if (args?.take) result = result.slice(0, args.take);
        
        return result;
      },
      findUnique: async ({ where, include }: { where: { id: string }, include?: any }) => {
        const contract = contracts.find(c => c.id === where.id);
        if (!contract) return null;
        
        // 基础返回对象
        const result: any = { ...contract };
        
        // 处理 include 关系
        if (include) {
          if (include.creator || include.creator === true) {
            result.creator = users.find(u => u.id === contract.creatorId);
          }
          if (include.aiReview || include.aiReview === true) {
            result.aiReview = aiReviews.find(r => r.contractId === contract.id) || null;
          }
          if (include.annotations || include.annotations === true) {
            result.annotations = annotations.filter(a => a.contractId === contract.id)
              .map(a => ({
                ...a,
                author: users.find(u => u.id === a.authorId),
              }));
          }
        }
        
        return result;
      },
      findFirst: async () => contracts[0] || null,
      count: async (args?: any) => {
        if (!args?.where) return contracts.length;
        
        return contracts.filter(c => {
          if (args.where.status?.in && !args.where.status.in.includes(c.status)) return false;
          if (args.where.status && !args.where.status.in && c.status !== args.where.status) return false;
          if (args.where.riskLevel && c.riskLevel !== args.where.riskLevel) return false;
          return true;
        }).length;
      },
      update: async ({ where, data }: { where: { id: string }, data: any }) => {
        const index = contracts.findIndex(c => c.id === where.id);
        if (index >= 0) {
          contracts[index] = { 
            ...contracts[index], 
            ...data, 
            updatedAt: new Date() 
          };
          return contracts[index];
        }
        throw new Error('Contract not found');
      },
      delete: async () => ({}),
      groupBy: async (args: any) => {
        const { by, _count } = args;
        if (!by || !Array.isArray(by)) return [];
        
        const groups = new Map();
        contracts.forEach(contract => {
          const key = by.map((field: string) => (contract as any)[field]).join('|');
          if (!groups.has(key)) {
            const group: any = {};
            by.forEach((field: string) => group[field] = (contract as any)[field]);
            if (_count) group._count = { [Object.keys(_count)[0] || 'id']: 0 };
            groups.set(key, group);
          }
          if (_count) {
            const countField = Object.keys(_count)[0] || 'id';
            groups.get(key)._count[countField]++;
          }
        });
        
        return Array.from(groups.values());
      },
    },
    user: {
      findMany: async () => users,
      findUnique: async ({ where }: { where: { id?: string, email?: string } }) => {
        if (where.id) return users.find(u => u.id === where.id) || null;
        if (where.email) return users.find(u => u.email === where.email) || null;
        return null;
      },
    },
    contractVersion: {
      create: async ({ data }: { data: any }) => ({ 
        id: generateId(), 
        ...data,
        createdAt: new Date(),
      }),
      findMany: async () => [],
    },
    aIReview: {
      create: async ({ data }: { data: any }) => {
        const review = {
          id: generateId(),
          ...data,
          createdAt: new Date(),
        };
        aiReviews.push(review);
        return review;
      },
      findUnique: async ({ where }: { where: { contractId?: string } }) => {
        if (where.contractId) {
          return aiReviews.find(r => r.contractId === where.contractId) || null;
        }
        return null;
      },
    },
    annotation: {
      create: async ({ data }: { data: any }) => {
        const annotation = {
          id: generateId(),
          ...data,
          createdAt: new Date(),
        };
        annotations.push(annotation);
        return annotation;
      },
      findMany: async ({ where }: { where?: { contractId?: string } }) => {
        if (where?.contractId) {
          return annotations.filter(a => a.contractId === where.contractId);
        }
        return annotations;
      },
    },
    $queryRaw: async () => [{ 1: 1 }],
    $disconnect: async () => {},
  };

  return new Proxy({} as PrismaClient, {
    get: (target, prop) => {
      if (prop in mockHandler) {
        return (mockHandler as any)[prop];
      }
      return () => Promise.resolve([]);
    },
  }) as PrismaClient;
};

// 创建真实 Prisma 客户端
const createPrismaClient = () => {
  if (!hasDatabase) {
    return createMockPrisma();
  }
  
  try {
    console.log('[Prisma] 使用真实数据库连接');
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  } catch (error) {
    console.warn('[Prisma] 创建客户端失败，回退到 Mock:', error);
    return createMockPrisma();
  }
};

// 单例模式
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 健康检查
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  type: 'real' | 'mock';
  latency?: number;
}> {
  if (!hasDatabase) {
    return { status: 'healthy', type: 'mock' };
  }
  
  const start = Date.now();
  try {
    await (prisma as PrismaClient).$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      type: 'real',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      type: 'real',
    };
  }
}
