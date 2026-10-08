import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { enrollments: true, schedules: true } },
      },
    });
    return NextResponse.json({ data: subjects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: 'نام و کد مضمون الزامی است' },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        code: String(body.code),
        name: String(body.name),
        hours: Number(body.hours) || 3,
        category: body.category || 'general',
        description: body.description || null,
        teacherId: body.teacherId || null,
      },
    });

    return NextResponse.json({ data: subject }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'کد مضمون تکراری است' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}