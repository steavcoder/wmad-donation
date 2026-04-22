import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let adminPayload;
  try {
    adminPayload = verifyToken(token);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (adminPayload.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (typeof userId !== "number") {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === adminPayload.id) {
    return Response.json({ error: "You cannot disable your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  if (!target || target.role !== "MEMBER") {
    return Response.json({ error: "Member not found." }, { status: 404 });
  }

  if (target.status === "DISABLED") {
    return Response.json({ error: "Account is already disabled." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "DISABLED" },
  });

  return Response.json({ success: true });
}
