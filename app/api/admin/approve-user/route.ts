import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyToken(token);

    if (payload.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();

  if (typeof userId !== "number") {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "APPROVED" },
  });

  return Response.json({ success: true });
}
