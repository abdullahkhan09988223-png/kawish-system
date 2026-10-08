import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId') || undefined;
    const year = searchParams.get('year') || undefined;
    const month = searchParams.get('month') || undefined;

    const where: any = {};
    if (teacherId) where.teacherId = teacherId;
    if (year) where.year = year;
    if (month) where.month = month;

    const salaries = await prisma.salary.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
    });

    const totals = await prisma.salary.aggregate({
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

    if (!body.teacherId) {
      return NextResponse.json(
        { error: 'استاد الزامی است' },
        { status: 400 }
      );
    }

    const fixedAmount = Number(body.fixedAmount) || 0;
    const percent = Number(body.percent) || 0;
    const totalPaidFees = Number(body.totalPaidFees) || 0;
    const percentAmount = Math.round((totalPaidFees * percent) / 100);

    // مبلغ نهایی = معاش ثابت + فیصدی
    const amount = body.amount !== undefined && body.amount !== null && body.amount !== ''
      ? Number(body.amount) || 0
      : fixedAmount + percentAmount;

    const salary = await prisma.salary.create({
      data: {
        teacherId: body.teacherId,
        fixedAmount,
        percent,
        amount,
        studentsCount: Number(body.studentsCount) || 0,
        totalPaidFees,
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