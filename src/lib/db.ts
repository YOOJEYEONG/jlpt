import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

/** DATABASE_URL이 없으면 서버 저장 없이 브라우저 저장만으로 동작합니다. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** 빌드 시점에 커넥션을 만들지 않도록 최초 호출 때 생성합니다. */
export function getDb(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  }
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
