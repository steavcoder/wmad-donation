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

  const { userId, amount, note, paymentType, accountNumber, proofImageUrl } =
    await req.json();

  if (
    typeof userId !== "number" ||
    typeof amount !== "number" ||
    typeof accountNumber !== "string" ||
    typeof paymentType !== "string"
  ) {
    return Response.json(
      {
        error:
          "userId, amount, paymentType, and accountNumber are required with valid types",
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
      userId,
      amount,
      status: "APPROVED",
      paymentType: normalizedPaymentType,
      accountNumber: accountNumber.trim(),
      proofImageUrl:
        typeof proofImageUrl === "string" && proofImageUrl.trim() ? proofImageUrl.trim() : null,
      note: typeof note === "string" ? note : null,
    },
  });

  return Response.json(donation);
}
