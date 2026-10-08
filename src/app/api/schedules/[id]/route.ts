import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const updated = await prisma.schedule.update({
      where: { id: params.id },
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

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'تایم یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.schedule.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}