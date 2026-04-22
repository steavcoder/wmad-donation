import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/** True when the cached client predates the current schema (e.g. after `prisma generate`). */
function isStalePrismaClient(client: PrismaClient | undefined): boolean {
  if (!client) return true;
  return !("warmWish" in client);
}

export const prisma: PrismaClient =
  !isStalePrismaClient(globalThis.prisma) && globalThis.prisma
    ? globalThis.prisma
    : new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
