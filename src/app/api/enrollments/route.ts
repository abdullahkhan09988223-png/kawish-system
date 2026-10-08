import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;
    const subjectId = searchParams.get('subjectId') || undefined;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        AND: [
          studentId ? { studentId } : {},
          subjectId ? { subjectId } : {},
        ],
      },
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true },
        },
        subject: {
          select: { id: true, name: true, code: true, credits: true },
        },
      },
    });
    return NextResponse.json({ data: enrollments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.studentId && Array.isArray(body.subjectIds)) {
      const created = await prisma.$transaction(async (tx) => {
        await tx.enrollment.deleteMany({
          where: { studentId: body.studentId },
        });
        return Promise.all(
          body.subjectIds.map((subjectId: string) =>
            tx.enrollment.create({
              data: { studentId: body.studentId, subjectId },
            })
          )
        );
      });
      return NextResponse.json({ data: created }, { status: 201 });
    }

    if (!body.studentId || !body.subjectId) {
      return NextResponse.json(
        { error: 'دانشجو و مضمون الزامی است' },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: body.studentId,
        subjectId: body.subjectId,
      },
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'این ثبت‌نام قبلاً وجود دارد' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}