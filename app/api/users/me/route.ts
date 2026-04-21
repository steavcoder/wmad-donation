import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const majorRaw = body?.major;
  const profileImageRaw = body?.profileImage;

  const major =
    typeof majorRaw === "string" && majorRaw.trim() ? majorRaw.trim() : null;
  const profileImage =
    typeof profileImageRaw === "string" && profileImageRaw.trim()
      ? profileImageRaw.trim()
      : null;

  const user = await prisma.user.update({
    where: { id: payload.id },
    data: {
      major,
      profileImage,
    },
    select: {
      id: true,
      name: true,
      email: true,
      major: true,
      profileImage: true,
    },
  });

  return Response.json(user);
}
