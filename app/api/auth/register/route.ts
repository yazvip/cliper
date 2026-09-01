import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ status: false, message: parsed.error.errors[0].message }, { status: 400 });

    const { email, password, name } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ status: false, message: 'Email already registered' }, { status: 400 });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });
    const token = await createSessionToken(user.id);

    const res = NextResponse.json({ status: true, message: 'Registered', data: { user: { id: user.id, email: user.email, name: user.name } } });
    res.cookies.set('session', token, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite: 'lax', maxAge: 60*60*24*7, path: '/' });
    return res;
  } catch (e:any) {
    return NextResponse.json({ status: false, message: e.message }, { status: 500 });
  }
}
