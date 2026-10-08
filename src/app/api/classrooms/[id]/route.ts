import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const classRoom = await prisma.classRoom.findUnique({
      where: { id: params.id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            phone: true,
            specialization: true,
          },
        },
        students: {
          orderBy: { firstName: 'asc' },
          include: {
            fees: { select: { total: true, paid: true } },
            attendances: { select: { status: true } },
            grades: { select: { totalScore: true } },
          },
        },
        schedules: {
          include: {
            subject: { select: { name: true, code: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!classRoom) {
      return NextResponse.json({ error: 'صنف یافت نشد' }, { status: 404 });
    }

    // محاسبه آمار
    let totalFee = 0;
    let totalPaid = 0;
    let totalStudents = classRoom.students.length;
    let activeStudents = 0;
    let inactiveStudents = 0;
    let totalAttendance = 0;
    let presentAttendance = 0;
    let totalGrades = 0;
    let gradeSum = 0;

    const studentsWithStats = classRoom.students.map((s) => {
      const sTotal = s.fees.reduce((sum, f) => sum + Number(f.total || 0), 0);
      const sPaid = s.fees.reduce((sum, f) => sum + Number(f.paid || 0), 0);
      const sRemaining = sTotal - sPaid;

      totalFee += sTotal;
      totalPaid += sPaid;

      if (s.isActive) activeStudents++;
      else inactiveStudents++;

      const sAtt = s.attendances.length;
      const sPresent = s.attendances.filter((a) => a.status === 'PRESENT').length;
      totalAttendance += sAtt;
      presentAttendance += sPresent;

      const sGrades = s.grades.length;
      const sAvg = sGrades > 0
        ? s.grades.reduce((sum, g) => sum + Number(g.totalScore || 0), 0) / sGrades
        : 0;
      totalGrades += sGrades;
      gradeSum += sAvg * sGrades;

      return {
        id: s.id,
        studentNumber: s.studentNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        fatherName: s.fatherName,
        phone: s.phone,
        photo: s.photo,
        gender: s.gender,
        isActive: s.isActive,
        totalFee: sTotal,
        paid: sPaid,
        remaining: sRemaining,
        attendanceRate: sAtt > 0 ? Math.round((sPresent / sAtt) * 100) : 0,
        avgGrade: Math.round(sAvg * 100) / 100,
      };
    });

    const remaining = totalFee - totalPaid;
    const attendanceRate = totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : 0;
    const avgGrade = totalGrades > 0
      ? Math.round((gradeSum / totalGrades) * 100) / 100
      : 0;

    return NextResponse.json({
      data: {
        id: classRoom.id,
        name: classRoom.name,
        grade: classRoom.grade,
        section: classRoom.section,
        capacity: classRoom.capacity,
        room: classRoom.room,
        teacher: classRoom.teacher,
        schedules: classRoom.schedules,
        students: studentsWithStats,
        stats: {
          totalStudents,
          activeStudents,
          inactiveStudents,
          totalFee,
          totalPaid,
          remaining,
          attendanceRate,
          avgGrade,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const updated = await prisma.classRoom.update({
      where: { id: params.id },
      data: {
        name: body.name,
        grade: body.grade || null,
        section: body.section || null,
        capacity: Number(body.capacity) || 30,
        room: body.room || null,
        teacherId: body.teacherId || null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'صنف یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.classRoom.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}