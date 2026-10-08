import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;
    const date = searchParams.get('date') || undefined;
    const classRoomId = searchParams.get('classRoomId') || undefined;

    const where: any = { AND: [] };
    if (studentId) where.AND.push({ studentId });
    if (date) where.AND.push({ date });
    if (classRoomId) where.AND.push({ student: { classRoomId } });

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            classRoom: { select: { name: true } },
          },
        },
      },
    });
    return NextResponse.json({ data: attendances });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body.records)) {
      const results = await prisma.$transaction(async (tx) => {
        const saved = [];
        for (const r of body.records) {
          const existing = await tx.attendance.findFirst({
            where: { studentId: r.studentId, date: r.date },
          });
          if (existing) {
            const updated = await tx.attendance.update({
              where: { id: existing.id },
              data: { status: r.status, note: r.note || null },
            });
            saved.push(updated);
          } else {
            const created = await tx.attendance.create({
              data: {
                studentId: r.studentId,
                date: r.date,
                status: r.status,
                note: r.note || null,
              },
            });
            saved.push(created);
          }
        }
        return saved;
      });
      return NextResponse.json({ data: results }, { status: 201 });
    }

    if (!body.studentId || !body.date) {
      return NextResponse.json(
        { error: 'دانشجو و تاریخ الزامی است' },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId: body.studentId,
        date: body.date,
        status: body.status || 'PRESENT',
        note: body.note || null,
      },
    });

    return NextResponse.json({ data: attendance }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}