import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { empSalaries: true } },
      },
    });
    return NextResponse.json({ data: employees });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.firstName || !body.lastName || !body.employeeNumber) {
      return NextResponse.json(
        { error: 'نام، تخلص و شماره کارمندی الزامی است' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeNumber: String(body.employeeNumber),
        firstName: String(body.firstName),
        lastName: String(body.lastName),
        fatherName: body.fatherName || null,
        position: body.position || null,
        department: body.department || null,
        phone: body.phone || null,
        address: body.address || null,
        hireDate: body.hireDate || null,
        salary: toNum(body.salary),
        photo: body.photo || null,
      },
    });

    return NextResponse.json({ data: employee }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'شماره کارمندی تکراری است' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}