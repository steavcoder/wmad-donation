import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const profileImage =
    typeof body?.profileImage === "string" && body.profileImage.trim()
      ? body.profileImage.trim()
      : null;
  const major =
    typeof body?.major === "string" && body.major.trim() ? body.major.trim() : null;

  if (!name || !email || !password) {
    return Response.json(
      { error: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already in use." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      profileImage,
      major,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      major: true,
      role: true,
      status: true,
    },
  });

  return Response.json(user, { status: 201 });
}
