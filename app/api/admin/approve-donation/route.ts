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

  const { donationId } = await req.json();
  if (typeof donationId !== "number") {
    return Response.json({ error: "donationId is required" }, { status: 400 });
  }

  await prisma.donation.update({
    where: { id: donationId },
    data: { status: "APPROVED" },
  });

  return Response.json({ success: true });
}
