import { PrismaClient } from '@prisma/client';

// Check if we're in build/static generation phase
const isBuildPhase = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a mock Prisma client for build phase
const createMockPrisma = (): PrismaClient => {
  const mockHandler = {
    get: () => Promise.resolve([]),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    upsert: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
    groupBy: () => Promise.resolve([]),
  };

  return new Proxy({} as PrismaClient, {
    get: () => mockHandler,
  }) as PrismaClient;
};

// Create real Prisma client
const createPrisma = () => {
  if (isBuildPhase) {
    console.log('Using mock Prisma client for build phase');
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
