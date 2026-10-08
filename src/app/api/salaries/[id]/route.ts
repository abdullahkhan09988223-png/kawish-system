import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // علامت‌گذاری پرداخت
    if (body.markPaid) {
      const updated = await prisma.salary.update({
        where: { id: params.id },
        data: {
          isPaid: true,
          paidDate: new Date().toLocaleDateString('fa-IR'),
        },
      });
      return NextResponse.json({ data: updated });
    }

    // ویرایش کامل
    const fixedAmount = Number(body.fixedAmount) || 0;
    const percent = Number(body.percent) || 0;
    const totalPaidFees = Number(body.totalPaidFees) || 0;
    const percentAmount = Math.round((totalPaidFees * percent) / 100);

    const amount = body.amount !== undefined && body.amount !== null && body.amount !== ''
      ? Number(body.amount) || 0
      : fixedAmount + percentAmount;

    const updated = await prisma.salary.update({
      where: { id: params.id },
      data: {
        fixedAmount,
        percent,
        amount,
        studentsCount: Number(body.studentsCount) || 0,
        totalPaidFees,
        day: body.day || null,
        month: body.month || null,
        year: body.year || null,
        isPaid: body.isPaid || false,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'معاش یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.salary.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}