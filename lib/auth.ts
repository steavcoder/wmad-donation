import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export type AuthPayload = {
  id: number;
  role: "ADMIN" | "MEMBER";
};

function getSecret() {
  if (!SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return SECRET;
}

export function signToken(user: AuthPayload) {
  return jwt.sign(user, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getSecret()) as AuthPayload;
}

export function getTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const tokenPair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  if (!tokenPair) {
    return null;
  }

  return tokenPair.slice("token=".length);
}
