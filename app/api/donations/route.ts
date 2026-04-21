import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyToken(token);

    const donations = await prisma.donation.findMany({
      where: payload.role === "ADMIN" ? {} : { userId: payload.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(donations);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
