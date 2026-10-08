import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [
      studentCount,
      teacherCount,
      employeeCount,
      subjectCount,
      classRoomCount,
      feeAggregate,
      salaryAggregate,
      empSalaryAggregate,
      expenseAggregate,
      attendanceToday,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.employee.count(),
      prisma.subject.count(),
      prisma.classRoom.count(),
      prisma.fee.aggregate({ _sum: { total: true, paid: true } }),
      prisma.salary.aggregate({ where: { isPaid: true }, _sum: { amount: true } }),
      prisma.empSalary.aggregate({ where: { isPaid: true }, _sum: { amount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.attendance.count({
        where: {
          date: new Date().toLocaleDateString('fa-IR'),
          status: 'PRESENT',
        },
      }),
    ]);

    const totalFees = Number(feeAggregate._sum.total || 0);
    const paidFees = Number(feeAggregate._sum.paid || 0);
    const remainingFees = totalFees - paidFees;
    const totalSalaries = Number(salaryAggregate._sum.amount || 0);
    const totalEmpSalaries = Number(empSalaryAggregate._sum.amount || 0);
    const totalExpenses = Number(expenseAggregate._sum.amount || 0);
    const allExpenses = totalSalaries + totalEmpSalaries + totalExpenses;

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthNum = d.getMonth() + 1;
      const year = d.getFullYear();
      const monthStart = new Date(year, monthNum - 1, 1);
      const monthEnd = new Date(year, monthNum, 1);

      const monthFees = await prisma.fee.aggregate({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
        _sum: { paid: true },
      });

      const monthExpenses = await prisma.expense.aggregate({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      });

      monthlyData.push({
        month: monthNum,
        year,
        income: Number(monthFees._sum.paid || 0),
        expense: Number(monthExpenses._sum.amount || 0),
      });
    }

    const studentsByClass = await prisma.student.groupBy({
      by: ['classRoomId'],
      _count: { id: true },
    });

    const classRooms = await prisma.classRoom.findMany({
      select: { id: true, name: true },
    });

    const classStats = studentsByClass.map((s) => {
      const room = classRooms.find((c) => c.id === s.classRoomId);
      return {
        name: room?.name || 'بدون صنف',
        count: s._count.id,
      };
    });

    const expensesByCategory = await prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
    });

    const recentStudents = await prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentNumber: true,
        createdAt: true,
      },
    });

    const teachersWithCounts = await prisma.teacher.findMany({
      include: {
        _count: { select: { classRooms: true, subjects: true } },
      },
      take: 5,
    });

    return NextResponse.json({
      counts: {
        students: studentCount,
        teachers: teacherCount,
        employees: employeeCount,
        subjects: subjectCount,
        classRooms: classRoomCount,
      },
      finance: {
        totalFees,
        paidFees,
        remainingFees,
        totalSalaries,
        totalEmpSalaries,
        totalExpenses,
        allExpenses,
        netProfit: paidFees - allExpenses,
      },
      attendance: {
        presentToday: attendanceToday,
      },
      monthlyData,
      classStats,
      expensesByCategory: expensesByCategory.map((e) => ({
        category: e.category || 'سایر',
        amount: Number(e._sum.amount || 0),
      })),
      recentStudents,
      topTeachers: teachersWithCounts.map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        specialization: t.specialization,
        classRooms: t._count.classRooms,
        subjects: t._count.subjects,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}