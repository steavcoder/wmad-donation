import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WarmWishWithUser = {
  id: number;
  message: string;
  createdAt: Date;
  user: {
    id: number;
    name: string;
    major: string | null;
    profileImage: string | null;
  };
};

type WarmWishDelegate = {
  findMany(opts: {
    take?: number;
    orderBy: { createdAt: "desc" | "asc" };
    include: {
      user: { select: { id: true; name: true; major: true; profileImage: true } };
    };
  }): Promise<WarmWishWithUser[]>;
  create(opts: {
    data: { userId: number; message: string };
    include: {
      user: { select: { id: true; name: true; major: true; profileImage: true } };
    };
  }): Promise<WarmWishWithUser>;
  findFirst(opts: {
    where: { id: number; userId: number };
    include: {
      user: { select: { id: true; name: true; major: true; profileImage: true } };
    };
  }): Promise<WarmWishWithUser | null>;
  update(opts: {
    where: { id: number };
    data: { message: string };
    include: {
      user: { select: { id: true; name: true; major: true; profileImage: true } };
    };
  }): Promise<WarmWishWithUser>;
  delete(opts: { where: { id: number } }): Promise<{ id: number }>;
};

function getWarmWishDelegate(): WarmWishDelegate {
  const delegate = (prisma as unknown as { warmWish?: WarmWishDelegate }).warmWish;
  if (!delegate?.findMany) {
    throw new Error(
      "Prisma client is missing WarmWish. Run `npx prisma generate`, apply migrations (`npx prisma migrate deploy`), then restart the dev server.",
    );
  }
  return delegate;
}

function isWarmWishTableMissing(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    error.message.includes("WarmWish")
  );
}

export async function findWarmWishesForFeed(take = 48): Promise<WarmWishWithUser[]> {
  try {
    return await getWarmWishDelegate().findMany({
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, major: true, profileImage: true },
        },
      },
    });
  } catch (error) {
    if (isWarmWishTableMissing(error)) {
      return [];
    }
    throw error;
  }
}

export async function createWarmWishRecord(
  userId: number,
  message: string,
): Promise<WarmWishWithUser> {
  try {
    return await getWarmWishDelegate().create({
      data: { userId, message },
      include: {
        user: {
          select: { id: true, name: true, major: true, profileImage: true },
        },
      },
    });
  } catch (error) {
    if (isWarmWishTableMissing(error)) {
      throw new Error(
        "Warm wishes is not ready yet. Please run migrations, then try posting again.",
      );
    }
    throw error;
  }
}

export async function findMemberWarmWishById(
  id: number,
  userId: number,
): Promise<WarmWishWithUser | null> {
  try {
    return await getWarmWishDelegate().findFirst({
      where: { id, userId },
      include: {
        user: {
          select: { id: true, name: true, major: true, profileImage: true },
        },
      },
    });
  } catch (error) {
    if (isWarmWishTableMissing(error)) {
      return null;
    }
    throw error;
  }
}

export async function updateWarmWishRecord(
  id: number,
  message: string,
): Promise<WarmWishWithUser> {
  return getWarmWishDelegate().update({
    where: { id },
    data: { message },
    include: {
      user: {
        select: { id: true, name: true, major: true, profileImage: true },
      },
    },
  });
}

export async function deleteWarmWishRecord(id: number): Promise<void> {
  await getWarmWishDelegate().delete({ where: { id } });
}
