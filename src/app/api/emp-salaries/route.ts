import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const year = searchParams.get('year') || undefined;
    const month = searchParams.get('month') || undefined;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (year) where.year = year;
    if (month) where.month = month;

    const salaries = await prisma.empSalary.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
          },
        },
      },
    });

    const totals = await prisma.empSalary.aggregate({
      where: { isPaid: true },
      _sum: { amount: true },
    });

    return NextResponse.json({
      data: salaries,
      totals: { totalPaid: Number(totals._sum.amount || 0) },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.employeeId) {
      return NextResponse.json({ error: 'کارمند الزامی است' }, { status: 400 });
    }

    const salary = await prisma.empSalary.create({
      data: {
        employeeId: body.employeeId,
        amount: Number(body.amount) || 0,
        day: body.day || null,
        month: body.month || null,
        year: body.year || null,
        isPaid: body.isPaid || false,
        paidDate: body.isPaid ? new Date().toLocaleDateString('fa-IR') : null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: salary }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}