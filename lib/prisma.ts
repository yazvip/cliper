import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  // During Next.js build (collecting page data), DATABASE_URL may be dummy
  // We still need to create client without throwing
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (e) {
    console.warn('PrismaClient failed to init during build, returning mock');
    // Return a proxy that won't throw during build
    return new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (prop === 'then') return undefined;
        return () => {
          console.warn(`Prisma.${String(prop)} called during build - returning empty`);
          return Promise.resolve([]);
        };
      }
    }) as unknown as PrismaClient;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
