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

async function requireMemberPendingDonation(donationId: number, memberId: number) {
  const donation = await prisma.donation.findFirst({
    where: { id: donationId, userId: memberId, status: "PENDING" },
  });
  return donation;
}

export async function PATCH(req: Request, { params }: RouteParams) {
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
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const member = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { status: true },
  });
  if (!member || member.status !== "APPROVED") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawId = (await params).id;
  const donationId = Number(rawId);
  if (!Number.isFinite(donationId)) {
    return Response.json({ error: "Invalid donation id" }, { status: 400 });
  }

  const existing = await requireMemberPendingDonation(donationId, payload.id);
  if (!existing) {
    return Response.json(
      { error: "Pending donation not found or you cannot edit it." },
      { status: 404 },
    );
  }

  const { amount, note, paymentType, accountNumber, proofImageUrl } = await req.json();

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

  const updated = await prisma.donation.update({
    where: { id: donationId },
    data: {
      amount,
      paymentType: normalizedPaymentType,
      accountNumber: accountNumber.trim(),
      proofImageUrl:
        typeof proofImageUrl === "string" && proofImageUrl.trim() ? proofImageUrl.trim() : null,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
    },
  });

  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const token = getTokenFromCookieHeader(_req.headers.get("cookie"));
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
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const member = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { status: true },
  });
  if (!member || member.status !== "APPROVED") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawId = (await params).id;
  const donationId = Number(rawId);
  if (!Number.isFinite(donationId)) {
    return Response.json({ error: "Invalid donation id" }, { status: 400 });
  }

  const existing = await requireMemberPendingDonation(donationId, payload.id);
  if (!existing) {
    return Response.json(
      { error: "Pending donation not found or you cannot delete it." },
      { status: 404 },
    );
  }

  await prisma.donation.delete({ where: { id: donationId } });

  return Response.json({ success: true });
}
