import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;
    const subjectId = searchParams.get('subjectId') || undefined;
    const semester = searchParams.get('semester') || undefined;

    const grades = await prisma.grade.findMany({
      where: {
        AND: [
          studentId ? { studentId } : {},
          subjectId ? { subjectId } : {},
          semester ? { semester } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentNumber: true },
        },
        subject: {
          select: { id: true, name: true, code: true, credits: true },
        },
      },
    });
    return NextResponse.json({ data: grades });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ذخیره گروهی نمرات (چند دانشجو یکجا)
    if (Array.isArray(body.grades)) {
      const results = await prisma.$transaction(async (tx) => {
        const saved = [];
        for (const g of body.grades) {
          const midterm = Number(g.midtermScore) || 0;
          const final = Number(g.finalScore) || 0;
          const practical = Number(g.practicalScore) || 0;
          const total = midterm + final + practical;

          const existing = await tx.grade.findFirst({
            where: {
              studentId: g.studentId,
              subjectId: g.subjectId,
              semester: g.semester || null,
            },
          });

          if (existing) {
            const updated = await tx.grade.update({
              where: { id: existing.id },
              data: {
                midtermScore: midterm,
                finalScore: final,
                practicalScore: practical,
                totalScore: total,
                teacherId: g.teacherId || null,
                notes: g.notes || null,
              },
            });
            saved.push(updated);
          } else {
            const created = await tx.grade.create({
              data: {
                studentId: g.studentId,
                subjectId: g.subjectId,
                teacherId: g.teacherId || null,
                semester: g.semester || null,
                midtermScore: midterm,
                finalScore: final,
                practicalScore: practical,
                totalScore: total,
                notes: g.notes || null,
              },
            });
            saved.push(created);
          }
        }
        return saved;
      });
      return NextResponse.json({ data: results }, { status: 201 });
    }

    // ذخیره تک
    if (!body.studentId || !body.subjectId) {
      return NextResponse.json(
        { error: 'دانشجو و مضمون الزامی است' },
        { status: 400 }
      );
    }

    const midterm = Number(body.midtermScore) || 0;
    const final = Number(body.finalScore) || 0;
    const practical = Number(body.practicalScore) || 0;
    const total = midterm + final + practical;

    const grade = await prisma.grade.create({
      data: {
        studentId: body.studentId,
        subjectId: body.subjectId,
        teacherId: body.teacherId || null,
        semester: body.semester || null,
        midtermScore: midterm,
        finalScore: final,
        practicalScore: practical,
        totalScore: total,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: grade }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'این نمره قبلاً ثبت شده' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}