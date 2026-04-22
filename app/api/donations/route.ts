import { getTokenFromCookieHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyToken(token);

    if (payload.role === "MEMBER") {
      const member = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { status: true },
      });
      if (!member || member.status !== "APPROVED") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const donations = await prisma.donation.findMany({
      where: payload.role === "ADMIN" ? {} : { userId: payload.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(donations);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
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
    return Response.json({ error: "Only members can submit donation requests." }, { status: 403 });
  }

  const member = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { status: true },
  });
  if (!member || member.status !== "APPROVED") {
    return Response.json(
      { error: "Account is not active. Contact an administrator." },
      { status: 403 },
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

  const allowedPaymentTypes = [
    "CASH",
    "BANK_TRANSFER",
    "ABA",
    "ACLEDA",
    "WING",
    "OTHER",
  ] as const;

  if (!allowedPaymentTypes.some((type) => type === paymentType)) {
    return Response.json({ error: "Invalid paymentType" }, { status: 400 });
  }
  const normalizedPaymentType = paymentType as (typeof allowedPaymentTypes)[number];

  const donation = await prisma.donation.create({
    data: {
      userId: payload.id,
      amount,
      status: "PENDING",
      paymentType: normalizedPaymentType,
      accountNumber: accountNumber.trim(),
      proofImageUrl:
        typeof proofImageUrl === "string" && proofImageUrl.trim() ? proofImageUrl.trim() : null,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
    },
  });

  return Response.json(donation, { status: 201 });
}
