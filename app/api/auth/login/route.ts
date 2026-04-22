import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: String(email ?? "").toLowerCase() },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.status === "DISABLED") {
    return NextResponse.json(
      { error: "This account has been disabled. Contact an administrator." },
      { status: 403 },
    );
  }

  if (user.status !== "APPROVED") {
    return NextResponse.json({ error: "Not approved yet" }, { status: 403 });
  }

  const valid = await bcrypt.compare(String(password ?? ""), user.password);

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = signToken({
    id: user.id,
    role: user.role,
  });

  const response = NextResponse.json({
    token,
    user: { id: user.id, name: user.name, role: user.role },
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set("role", user.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
