import { PrismaClient } from "@prisma/client";

// Prevent multiple PrismaClient instances in dev (Next.js hot reload creates new module instances)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
