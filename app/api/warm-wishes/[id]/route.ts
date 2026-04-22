import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteWarmWishRecord,
  findMemberWarmWishById,
  updateWarmWishRecord,
} from "@/lib/warm-wishes-db";

const MAX_MESSAGE = 280;
const MIN_MESSAGE = 1;

type RouteParams = { params: Promise<{ id: string }> };

async function requireApprovedMember(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));
  if (!token) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (payload.role !== "MEMBER") {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const member = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { status: true },
  });
  if (!member || member.status !== "APPROVED") {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { memberId: payload.id };
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await requireApprovedMember(req);
  if ("error" in auth) return auth.error;

  const wishId = Number((await params).id);
  if (!Number.isFinite(wishId)) {
    return Response.json({ error: "Invalid warm wish id" }, { status: 400 });
  }

  const existing = await findMemberWarmWishById(wishId, auth.memberId);
  if (!existing) {
    return Response.json(
      { error: "Warm wish not found or you cannot edit it." },
      { status: 404 },
    );
  }

  const body = await req.json();
  const rawMessage = body?.message;
  if (typeof rawMessage !== "string") {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }
  const message = rawMessage.trim();
  if (message.length < MIN_MESSAGE) {
    return Response.json({ error: "Write something short and kind." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return Response.json(
      { error: `Keep it under ${MAX_MESSAGE} characters.` },
      { status: 400 },
    );
  }

  const updated = await updateWarmWishRecord(wishId, message);
  return Response.json({
    id: updated.id,
    message: updated.message,
    createdAt: updated.createdAt.toISOString(),
    user: {
      id: updated.user.id,
      name: updated.user.name,
      major: updated.user.major,
      profileImage: updated.user.profileImage,
    },
  });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const auth = await requireApprovedMember(req);
  if ("error" in auth) return auth.error;

  const wishId = Number((await params).id);
  if (!Number.isFinite(wishId)) {
    return Response.json({ error: "Invalid warm wish id" }, { status: 400 });
  }

  const existing = await findMemberWarmWishById(wishId, auth.memberId);
  if (!existing) {
    return Response.json(
      { error: "Warm wish not found or you cannot delete it." },
      { status: 404 },
    );
  }

  await deleteWarmWishRecord(wishId);
  return Response.json({ success: true });
}
