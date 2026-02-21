import { PrismaClient, Contract, User, ContractStatus, RiskLevel, ContractType, UserRole } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if we're in production without database
const hasDatabase = !!process.env.DATABASE_URL;

// Create a mock Prisma client for demo/development without database
const createMockPrisma = (): PrismaClient => {
  console.log('Using Mock Prisma Client (no DATABASE_URL detected)');
  
  // In-memory storage for mock data
  const contracts: Contract[] = [];
  const users: User[] = [
    {
      id: 'user-1',
      email: 'business@example.com',
      name: '张业务',
      role: UserRole.BUSINESS_USER,
      department: '采购部',
      avatar: '',
      createdAt: new Date(),
    },
    {
      id: 'user-2',
      email: 'legal@example.com',
      name: '李法务',
      role: UserRole.LEGAL_SPECIALIST,
      department: '法务部',
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
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        };
        contracts.push(contract);
        console.log('Mock: Created contract', contract.id);
        return contract;
      },
      findMany: async () => contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      findUnique: async ({ where }: { where: { id: string } }) => {
        return contracts.find(c => c.id === where.id) || null;
      },
      findFirst: async () => contracts[0] || null,
      count: async () => contracts.length,
      update: async ({ where, data }: { where: { id: string }, data: any }) => {
        const index = contracts.findIndex(c => c.id === where.id);
        if (index >= 0) {
          contracts[index] = { ...contracts[index], ...data, updatedAt: new Date() };
          return contracts[index];
        }
        throw new Error('Contract not found');
      },
      delete: async () => ({}),
      groupBy: async (args: any) => {
        // Simple mock implementation for groupBy
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
      create: async () => ({ id: generateId(), versionNumber: 1 }),
      findMany: async () => [],
    },
    aIReview: {
      create: async ({ data }: { data: any }) => ({
        id: generateId(),
        ...data,
        createdAt: new Date(),
      }),
      findUnique: async () => null,
    },
    annotation: {
      create: async ({ data }: { data: any }) => ({
        id: generateId(),
        ...data,
        createdAt: new Date(),
      }),
      findMany: async () => [],
    },
    $queryRaw: async () => [{ 1: 1 }],
    $disconnect: async () => {},
  };

  return new Proxy({} as PrismaClient, {
    get: (target, prop) => {
      if (prop in mockHandler) {
        return (mockHandler as any)[prop];
      }
      // Return empty function for unimplemented methods
      return () => Promise.resolve([]);
    },
  }) as PrismaClient;
};

// Create real Prisma client or mock
const createPrisma = () => {
  if (!hasDatabase) {
    return createMockPrisma();
  }
  
  try {
    return new PrismaClient();
  } catch (error) {
    console.warn('Failed to create Prisma client, using mock:', error);
    return createMockPrisma();
  }
};

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
