import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classRoomId = searchParams.get('classRoomId') || undefined;

    const [students, classes] = await Promise.all([
      prisma.student.findMany({
        where: classRoomId ? { classRoomId } : {},
        include: {
          classRoom: { select: { id: true, name: true, room: true } },
          grades: { select: { totalScore: true } },
          attendances: { select: { status: true } },
        },
      }),
      prisma.classRoom.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, room: true },
      }),
    ]);

    // محاسبه امتیاز هر دانشجو
    const allRankings = students.map((s) => {
      const avgGrade =
        s.grades.length > 0
          ? s.grades.reduce((sum, g) => sum + Number(g.totalScore || 0), 0) / s.grades.length
          : 0;

      const total = s.attendances.length;
      const present = s.attendances.filter((a) => a.status === 'PRESENT').length;
      const attendanceRate = total > 0 ? (present / total) * 100 : 0;

      const finalScore = avgGrade * 0.6 + attendanceRate * 0.4;

      return {
        id: s.id,
        studentNumber: s.studentNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        fatherName: s.fatherName,
        photo: s.photo,
        gender: s.gender,
        classRoomId: s.classRoomId,
        classRoom: s.classRoom,
        avgGrade: Math.round(avgGrade * 100) / 100,
        attendanceRate: Math.round(attendanceRate),
        finalScore: Math.round(finalScore * 100) / 100,
        gradesCount: s.grades.length,
        attendanceTotal: total,
        attendancePresent: present,
        rank: 0,
      };
    });

    // گروه‌بندی بر اساس صنف + رتبه‌بندی داخل هر صنف
    const grouped: Record<string, {
      classRoom: { id: string; name: string; room: string | null };
      rankings: any[];
      top3: any[];
      stats: { total: number; avgGrade: number; avgAttendance: number; avgScore: number };
    }> = {};

    // ساخت گروه برای همه صنف‌ها (حتی خالی)
    classes.forEach((c) => {
      grouped[c.id] = {
        classRoom: { id: c.id, name: c.name, room: c.room },
        rankings: [],
        top3: [],
        stats: { total: 0, avgGrade: 0, avgAttendance: 0, avgScore: 0 },
      };
    });

    // دانشجوهای بدون صنف
    const unassigned: any[] = [];

    allRankings.forEach((r) => {
      if (r.classRoomId && grouped[r.classRoomId]) {
        grouped[r.classRoomId].rankings.push(r);
      } else {
        unassigned.push(r);
      }
    });

    // رتبه‌بندی داخل هر صنف
    Object.values(grouped).forEach((g) => {
      g.rankings.sort((a, b) => b.finalScore - a.finalScore);
      g.rankings.forEach((r, i) => { r.rank = i + 1; });
      g.top3 = g.rankings.slice(0, 3);

      const total = g.rankings.length;
      if (total > 0) {
        g.stats = {
          total,
          avgGrade: Math.round((g.rankings.reduce((s, r) => s + r.avgGrade, 0) / total) * 100) / 100,
          avgAttendance: Math.round(g.rankings.reduce((s, r) => s + r.attendanceRate, 0) / total),
          avgScore: Math.round((g.rankings.reduce((s, r) => s + r.finalScore, 0) / total) * 100) / 100,
        };
      }
    });

    // خروجی: صنف‌ها با رتبه‌بندی‌شان
    const result = Object.values(grouped)
      .filter((g) => g.rankings.length > 0)
      .sort((a, b) => a.classRoom.name.localeCompare(b.classRoom.name));

    return NextResponse.json({
      data: result,
      unassigned: unassigned.length > 0 ? unassigned : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}