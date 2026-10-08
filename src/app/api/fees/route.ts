import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;
    const month = searchParams.get('month') || undefined;
    const year = searchParams.get('year') || undefined;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (month) where.month = month;
    if (year) where.year = year;

    const fees = await prisma.fee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
            isActive: true,
            classRoom: { select: { name: true } },
          },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json({ data: fees });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.studentId) {
      return NextResponse.json({ error: 'دانشجو الزامی است' }, { status: 400 });
    }

    const fee = await prisma.fee.create({
      data: {
        studentId: body.studentId,
        total: Number(body.total) || 0,
        paid: Number(body.paid) || 0,
        month: body.month || null,
        year: body.year || null,
        dueDate: body.dueDate || null,
        status: body.status || 'PENDING',
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: fee }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}