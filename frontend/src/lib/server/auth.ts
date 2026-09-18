import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { JWT_EXPIRE_HOURS, JWT_SECRET } from "@/lib/server/config";

const secret = new TextEncoder().encode(JWT_SECRET);

export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function createToken(adminId: number, username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(adminId))
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRE_HOURS}h`)
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export function getBearerToken(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function requireAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) return { error: "Unauthorized", status: 401 as const };
  try {
    const payload = await verifyToken(token);
    return { payload };
  } catch {
    return { error: "Invalid or expired token", status: 401 as const };
  }
}
