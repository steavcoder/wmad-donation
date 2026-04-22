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

  const me = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { status: true },
  });
  if (!me || me.status !== "APPROVED") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const nameRaw = body?.name;
  const majorRaw = body?.major;
  const profileImageRaw = body?.profileImage;

  if (typeof nameRaw !== "string" || !nameRaw.trim()) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }
  const name = nameRaw.trim().slice(0, 120);

  const major =
    typeof majorRaw === "string" && majorRaw.trim() ? majorRaw.trim() : null;
  const profileImage =
    typeof profileImageRaw === "string" && profileImageRaw.trim()
      ? profileImageRaw.trim()
      : null;

  const user = await prisma.user.update({
    where: { id: payload.id },
    data: {
      name,
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
