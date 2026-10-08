import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.studentId },
      include: {
        classRoom: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
        grades: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                category: true,
                hours: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        enrollments: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                category: true,
                hours: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'دانشجو یافت نشد' }, { status: 404 });
    }

    // جمع کردن نمرات بر اساس مضمون
    const gradeMap = new Map<string, any>();
    student.grades.forEach((g) => {
      const existing = gradeMap.get(g.subjectId);
      if (existing) {
        // اگر چند سمستر، بالاترین را نگه دار
        if (Number(g.totalScore) > existing.totalScore) {
          gradeMap.set(g.subjectId, {
            subjectId: g.subjectId,
            name: g.subject.name,
            code: g.subject.code,
            category: g.subject.category,
            hours: g.subject.hours,
            midtermScore: g.midtermScore,
            finalScore: g.finalScore,
            practicalScore: g.practicalScore,
            totalScore: g.totalScore,
          });
        }
      } else {
        gradeMap.set(g.subjectId, {
          subjectId: g.subjectId,
          name: g.subject.name,
          code: g.subject.code,
          category: g.subject.category,
          hours: g.subject.hours,
          midtermScore: g.midtermScore,
          finalScore: g.finalScore,
          practicalScore: g.practicalScore,
          totalScore: g.totalScore,
        });
      }
    });

    const allGrades = Array.from(gradeMap.values());

    // گروه‌بندی بر اساس category
    const math = allGrades.filter((g) => g.category === 'math');
    const computer = allGrades.filter((g) => g.category === 'computer');
    const english = allGrades.filter((g) => g.category === 'english');
    const general = allGrades.filter((g) => g.category === 'general');

    // محاسبه معدل
    const calcAvg = (arr: any[]) => {
      if (arr.length === 0) return 0;
      return Math.round((arr.reduce((s, g) => s + Number(g.totalScore || 0), 0) / arr.length) * 100) / 100;
    };

    const mathAvg = calcAvg(math);
    const computerAvg = calcAvg(computer);
    const englishAvg = calcAvg(english);
    const generalAvg = calcAvg(general);
    const overallAvg = calcAvg(allGrades);

    // مجموع ساعت
    const mathHours = math.reduce((s, g) => s + Number(g.hours || 0), 0);
    const computerHours = computer.reduce((s, g) => s + Number(g.hours || 0), 0);
    const englishHours = english.reduce((s, g) => s + Number(g.hours || 0), 0);
    const generalHours = general.reduce((s, g) => s + Number(g.hours || 0), 0);

    return NextResponse.json({
      data: {
        student: {
          id: student.id,
          studentNumber: student.studentNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          fatherName: student.fatherName,
          photo: student.photo,
          birthDate: student.birthDate,
          enrollmentDate: student.enrollmentDate,
          gender: student.gender,
          classRoom: student.classRoom
            ? {
                name: student.classRoom.name,
                grade: student.classRoom.grade,
                section: student.classRoom.section,
                teacher: student.classRoom.teacher,
              }
            : null,
        },
        sections: {
          math: { items: math, avg: mathAvg, hours: mathHours, count: math.length },
          computer: { items: computer, avg: computerAvg, hours: computerHours, count: computer.length },
          english: { items: english, avg: englishAvg, hours: englishHours, count: english.length },
          general: { items: general, avg: generalAvg, hours: generalHours, count: general.length },
        },
        summary: {
          overallAvg,
          totalSubjects: allGrades.length,
          totalHours: mathHours + computerHours + englishHours + generalHours,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}