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

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      include: {
        classRooms: {
          select: {
            id: true, name: true, room: true, grade: true, section: true,
            _count: { select: { students: true } },
          },
        },
        subjects: {
          select: { id: true, name: true, code: true, credits: true },
        },
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { timeFrom: 'asc' }],
          include: {
            classRoom: { select: { name: true } },
            subject: { select: { name: true, code: true } },
          },
        },
        salaries: {
          orderBy: { createdAt: 'desc' },
          take: 24,
        },
        grades: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            student: {
              select: { firstName: true, lastName: true, studentNumber: true },
            },
            subject: { select: { name: true, code: true } },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'استاد یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ data: teacher });
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

    // اگر فقط فیصدی می‌خواهد تغییر کند
    if (body.salaryPercent !== undefined && !body.firstName) {
      const updated = await prisma.teacher.update({
        where: { id: params.id },
        data: {
          salaryPercent: toNum(body.salaryPercent),
        },
      });
      return NextResponse.json({ data: updated });
    }

    // ویرایش کامل
    const updated = await prisma.teacher.update({
      where: { id: params.id },
      data: {
        employeeNumber: String(body.employeeNumber),
        firstName: String(body.firstName),
        lastName: String(body.lastName),
        fatherName: body.fatherName || null,
        specialization: body.specialization || null,
        phone: body.phone || null,
        address: body.address || null,
        hireDate: body.hireDate || null,
        salary: toNum(body.salary),
        salaryPercent: toNum(body.salaryPercent),
        photo: body.photo || null,
        tazkiraNumber: body.tazkiraNumber || null,
        tazkiraPhoto: body.tazkiraPhoto || null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'شماره کارمندی تکراری است' }, { status: 409 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'استاد یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.teacher.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}