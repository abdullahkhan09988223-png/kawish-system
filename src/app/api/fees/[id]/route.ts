import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const toEnglishDigits = (s: any): string => {
  if (s === null || s === undefined) return '';
  const str = String(s);
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  return str.split('').map((c) => {
    const pi = persian.indexOf(c);
    if (pi > -1) return String(pi);
    const ai = arabic.indexOf(c);
    if (ai > -1) return String(ai);
    return c;
  }).join('');
};

const toNum = (v: any): number => {
  if (v === null || v === undefined || v === '') return 0;
  const clean = toEnglishDigits(v).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
};

const computeStatus = (total: number, paid: number) => {
  if (paid >= total && total > 0) return 'PAID';
  if (paid > 0) return 'PARTIAL';
  return 'PENDING';
};

function getTodayFa(): string {
  try {
    return new Date().toLocaleDateString('fa-IR');
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function generateReceiptNumber(): Promise<string> {
  let year = '1404';
  try {
    const faDate = new Date().toLocaleDateString('fa-IR');
    const parts = faDate.split('/');
    if (parts[0]) {
      const y = parts[0].replace(/[^0-9]/g, '');
      if (y) year = y;
    }
  } catch {
    year = '1404';
  }
  const prefix = 'RCP-' + year + '-';
  const existing = await prisma.payment.findMany({
    where: { receiptNumber: { startsWith: prefix } },
    select: { receiptNumber: true },
  });
  let maxNum = 0;
  existing.forEach((p) => {
    const num = parseInt(p.receiptNumber.replace(prefix, ''), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  });
  return prefix + String(maxNum + 1).padStart(4, '0');
}

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fee = await prisma.fee.findUnique({
      where: { id: params.id },
      include: {
        student: {
          include: {
            classRoom: { select: { name: true, room: true } },
          },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!fee) {
      return NextResponse.json({ error: 'فیس یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ data: fee });
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

    // ═══ ثبت پرداخت جدید ═══
    if (body.addPayment) {
      const amt = Number(body.addPayment) || 0;
      if (amt <= 0) {
        return NextResponse.json({ error: 'مبلغ نامعتبر' }, { status: 400 });
      }

      const existing = await prisma.fee.findUnique({
        where: { id: params.id },
      });
      if (!existing) {
        return NextResponse.json({ error: 'فیس یافت نشد' }, { status: 404 });
      }

      const faDate = getTodayFa();
      const year = faDate.split('/')[0] || '1404';
      const prefix = 'RCP-' + year + '-';
      const count = await prisma.payment.count({
        where: { receiptNumber: { startsWith: prefix } },
      });
      const receiptNumber = prefix + String(count + 1).padStart(4, '0');

      const payment = await prisma.payment.create({
        data: {
          receiptNumber: receiptNumber,
          feeId: params.id,
          amount: amt,
          date: faDate,
          method: body.method || 'نقدی',
          notes: body.notes || null,
        },
      });

      const newPaid = Number(existing.paid) + amt;
      const status = computeStatus(Number(existing.total), newPaid);

      const fee = await prisma.fee.update({
        where: { id: params.id },
        data: { paid: newPaid, status: status },
      });

      return NextResponse.json({ data: { fee, payment } });
    }

    // ═══ ویرایش کامل ═══
    const total = Number(body.total) || 0;
    const paid = Number(body.paid) || 0;
    const status = computeStatus(total, paid);

    const updated = await prisma.fee.update({
      where: { id: params.id },
      data: {
        total,
        paid,
        month: body.month || null,
        year: body.year || null,
        dueDate: body.dueDate || null,
        status,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'فیس یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.fee.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}