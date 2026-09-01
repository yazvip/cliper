import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ status: false, message: 'Invalid input' }, { status: 400 });
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ status: false, message: 'User not found' }, { status: 401 });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ status: false, message: 'Wrong password' }, { status: 401 });

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({ status: true, message: 'Login success', data: { user: { id: user.id, email: user.email, name: user.name } } });
    res.cookies.set('session', token, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'lax', maxAge: 60*60*24*7, path: '/' });
    return res;
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
