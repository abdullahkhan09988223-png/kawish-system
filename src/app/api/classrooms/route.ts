import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const classRooms = await prisma.classRoom.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });
    return NextResponse.json({ data: classRooms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: 'نام صنف الزامی است' }, { status: 400 });
    }

    const classRoom = await prisma.classRoom.create({
      data: {
        name: body.name,
        grade: body.grade || null,
        section: body.section || null,
        capacity: Number(body.capacity) || 30,
        room: body.room || null,
        teacherId: body.teacherId || null,
      },
    });

    return NextResponse.json({ data: classRoom }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'این نام صنف قبلاً ثبت شده' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}