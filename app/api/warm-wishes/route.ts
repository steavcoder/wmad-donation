import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWarmWishRecord, findWarmWishesForFeed } from "@/lib/warm-wishes-db";

const MAX_MESSAGE = 280;
const MIN_MESSAGE = 1;

export async function GET() {
  const wishes = await findWarmWishesForFeed(48);

  return Response.json(
    wishes.map((w) => ({
      id: w.id,
      message: w.message,
      createdAt: w.createdAt.toISOString(),
      user: {
        id: w.user.id,
        name: w.user.name,
        major: w.user.major,
        profileImage: w.user.profileImage,
      },
    })),
  );
}

export async function POST(req: Request) {
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

  if (payload.role !== "MEMBER") {
    return Response.json({ error: "Only members can post cheer notes." }, { status: 403 });
  }

  const member = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { status: true },
  });
  if (!member || member.status !== "APPROVED") {
    return Response.json({ error: "Your account must be approved to post." }, { status: 403 });
  }

  const body = await req.json();
  const raw = body?.message;
  if (typeof raw !== "string") {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const message = raw.trim();
  if (message.length < MIN_MESSAGE) {
    return Response.json({ error: "Write something short and kind (emoji welcome)." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return Response.json(
      { error: `Keep it under ${MAX_MESSAGE} characters so the wall stays easy to read.` },
      { status: 400 },
    );
  }

  let created;
  try {
    created = await createWarmWishRecord(payload.id, message);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not ready yet")) {
      return Response.json(
        { error: "Warm wishes is being set up. Please try again in a moment." },
        { status: 503 },
      );
    }
    throw error;
  }

  return Response.json({
    id: created.id,
    message: created.message,
    createdAt: created.createdAt.toISOString(),
    user: {
      id: created.user.id,
      name: created.user.name,
      major: created.user.major,
      profileImage: created.user.profileImage,
    },
  });
}
