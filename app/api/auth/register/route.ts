import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
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
      status: "APPROVED",
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

  const token = signToken({
    id: user.id,
    role: user.role,
  });

  const response = NextResponse.json(
    {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
    { status: 201 },
  );

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
