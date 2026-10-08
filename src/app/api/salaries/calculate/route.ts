import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: { firstName: 'asc' },
      include: {
        classRooms: {
          include: {
            students: {
              include: {
                fees: { select: { total: true, paid: true } },
              },
            },
          },
        },
      },
    });

    const results = teachers.map((t) => {
      let totalFees = 0;
      let totalPaid = 0;

      const classRooms = t.classRooms.map((cr) => {
        const studentsCount = cr.students.length;
        cr.students.forEach((s) => {
          s.fees.forEach((f) => {
            totalFees += Number(f.total || 0);
            totalPaid += Number(f.paid || 0);
          });
        });
        return {
          id: cr.id,
          name: cr.name,
          studentsCount,
        };
      });

      const studentsCount = classRooms.reduce((sum, cr) => sum + cr.studentsCount, 0);
      const percent = Number(t.salaryPercent || 0);
      const calculatedSalary = Math.round((totalPaid * percent) / 100);

      return {
        id: t.id,
        employeeNumber: t.employeeNumber,
        firstName: t.firstName,
        lastName: t.lastName,
        specialization: t.specialization,
        phone: t.phone,
        salaryPercent: percent,
        classRooms,
        studentsCount,
        classRoomsCount: classRooms.length,
        totalFees,
        totalPaid,
        calculatedSalary,
      };
    });

    return NextResponse.json({ data: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}