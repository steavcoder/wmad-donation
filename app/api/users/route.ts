import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyToken(token);
    if (payload.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return Response.json(users);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
