import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as {
  newsPrisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.newsPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.newsPrisma = prisma;

export * from "../generated/client";
