import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: body.username.trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور نادرست است' },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: 'نام کاربری یا رمز عبور نادرست است' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: {
        id: user.id,
        username: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}