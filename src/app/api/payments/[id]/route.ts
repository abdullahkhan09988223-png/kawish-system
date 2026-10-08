import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        fee: {
          include: {
            student: {
              include: {
                classRoom: { select: { name: true, room: true } },
              },
            },
            payments: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'رسید یافت نشد' }, { status: 404 });
    }

    // محاسبه مجموع پرداخت‌ها تا این لحظه
    let cumulative = 0;
    payment.fee.payments.forEach((p) => {
      cumulative += Number(p.amount || 0);
      if (p.id === payment.id) {
        (payment as any).cumulativeAtPayment = cumulative;
      }
    });

    return NextResponse.json({ data: payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}