import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-min-32-chars-please-change-it');
const SESSION_DAYS = 7;

export async function hashPassword(pw: string) { return bcrypt.hash(pw, 10); }
export async function verifyPassword(pw: string, hash: string) { return bcrypt.compare(pw, hash); }

export async function createSessionToken(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(JWT_SECRET);
  const expiresAt = new Date(Date.now() + SESSION_DAYS*24*60*60*1000);
  await prisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) return null;
    return session;
  } catch { return null; }
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;
    const session = await verifySession(token);
    return session?.user ?? null;
  } catch { return null; }
}
