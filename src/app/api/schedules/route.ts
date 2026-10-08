import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classRoomId = searchParams.get('classRoomId') || undefined;
    const teacherId = searchParams.get('teacherId') || undefined;

    const schedules = await prisma.schedule.findMany({
      where: {
        AND: [
          classRoomId ? { classRoomId } : {},
          teacherId ? { teacherId } : {},
        ],
      },
      orderBy: [{ dayOfWeek: 'asc' }, { timeFrom: 'asc' }],
      include: {
        classRoom: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return NextResponse.json({ data: schedules });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.classRoomId || !body.subjectId || !body.dayOfWeek || !body.timeFrom || !body.timeTo) {
      return NextResponse.json(
        { error: 'تمام فیلدهای ضروری را پر کنید' },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        classRoomId: body.classRoomId,
        subjectId: body.subjectId,
        teacherId: body.teacherId || null,
        dayOfWeek: body.dayOfWeek,
        timeFrom: body.timeFrom,
        timeTo: body.timeTo,
        room: body.room || null,
      },
    });

    return NextResponse.json({ data: schedule }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}