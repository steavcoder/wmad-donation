import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_PAYMENT_TYPES = [
  "CASH",
  "BANK_TRANSFER",
  "ABA",
  "ACLEDA",
  "WING",
  "OTHER",
] as const;

type RouteParams = { params: Promise<{ id: string }> };

async function requireAdmin(req: Request) {
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
  if (payload.role !== "ADMIN") {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {};
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const rawId = (await params).id;
  const donationId = Number(rawId);
  if (!Number.isFinite(donationId)) {
    return Response.json({ error: "Invalid donation id" }, { status: 400 });
  }

  const existing = await prisma.donation.findUnique({
    where: { id: donationId },
    select: { id: true },
  });
  if (!existing) {
    return Response.json({ error: "Donation not found" }, { status: 404 });
  }

  const body = await req.json();
  const { amount, note, paymentType, accountNumber, proofImageUrl, status } = body;

  if (
    typeof amount !== "number" ||
    typeof accountNumber !== "string" ||
    typeof paymentType !== "string"
  ) {
    return Response.json(
      {
        error: "amount, paymentType, and accountNumber are required with valid types",
      },
      { status: 400 },
    );
  }

  if (!ALLOWED_PAYMENT_TYPES.some((type) => type === paymentType)) {
    return Response.json({ error: "Invalid paymentType" }, { status: 400 });
  }
  const normalizedPaymentType = paymentType as (typeof ALLOWED_PAYMENT_TYPES)[number];

  let nextStatus: "PENDING" | "APPROVED" | undefined;
  if (status !== undefined) {
    if (status !== "PENDING" && status !== "APPROVED") {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    nextStatus = status;
  }

  const updated = await prisma.donation.update({
    where: { id: donationId },
    data: {
      amount,
      paymentType: normalizedPaymentType,
      accountNumber: accountNumber.trim(),
      proofImageUrl:
        typeof proofImageUrl === "string" && proofImageUrl.trim() ? proofImageUrl.trim() : null,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      ...(nextStatus ? { status: nextStatus } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const rawId = (await params).id;
  const donationId = Number(rawId);
  if (!Number.isFinite(donationId)) {
    return Response.json({ error: "Invalid donation id" }, { status: 400 });
  }

  const existing = await prisma.donation.findUnique({
    where: { id: donationId },
    select: { id: true },
  });
  if (!existing) {
    return Response.json({ error: "Donation not found" }, { status: 404 });
  }

  await prisma.donation.delete({ where: { id: donationId } });

  return Response.json({ success: true });
}
