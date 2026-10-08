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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined;
    const year = searchParams.get('year') || undefined;
    const category = searchParams.get('category') || undefined;

    const where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const totals = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    return NextResponse.json({
      data: expenses,
      totals: { totalAmount: Number(totals._sum.amount || 0) },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.amount) {
      return NextResponse.json(
        { error: 'عنوان و مبلغ الزامی است' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title: String(body.title),
        category: body.category || null,
        amount: toNum(body.amount),
        date: body.date || null,
        day: body.day || null,
        month: body.month || null,
        year: body.year || null,
        description: body.description || null,
        paidBy: body.paidBy || null,
      },
    });

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}