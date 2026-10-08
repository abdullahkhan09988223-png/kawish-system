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
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (activeOnly) where.isActive = true;

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        classRoom: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    return NextResponse.json({ data: students });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.firstName) {
      return NextResponse.json(
        { error: 'نام الزامی است' },
        { status: 400 }
      );
    }

    // شماره دانشجویی خودکار اگر نداده باشد
    let studentNumber = body.studentNumber;
    if (!studentNumber) {
      const existing = await prisma.student.findMany({
        select: { studentNumber: true },
      });
      let maxNum = 1000;
      existing.forEach((s) => {
        const match = s.studentNumber.match(/S-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      studentNumber = 'S-' + (maxNum + 1);
    }

    const totalFee = toNum(body.totalFee);
    const feeMonthly = toNum(body.feeMonthly);

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          studentNumber: String(studentNumber),
          firstName: String(body.firstName),
          lastName: body.lastName || null,
          fatherName: body.fatherName || null,
          classRoomId: body.classRoomId || null,
          timeFrom: body.timeFrom || null,
          timeTo: body.timeTo || null,
          phone: body.phone || null,
          parentPhone: body.parentPhone || null,
          parentName: body.parentName || null,
          parentRelation: body.parentRelation || null,
          address: body.address || null,
          enrollmentDate: body.enrollmentDate || null,
          serialNumber: body.serialNumber ? toNum(body.serialNumber) : null,
          birthDate: body.birthDate || null,
          gender: body.gender || null,
          tazkiraNumber: body.tazkiraNumber || null,
          tazkiraPhoto: body.tazkiraPhoto || null,
          totalFee: totalFee,
          feeType: body.feeType || 'داخله',
          feeMonthly: feeMonthly,
          photo: body.photo || null,
          isActive: true,
        },
      });

      // ساخت فیس خودکار
      if (totalFee > 0) {
        await tx.fee.create({
          data: {
            studentId: student.id,
            total: totalFee,
            paid: 0,
            status: 'PENDING',
          },
        });
      }

      return student;
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'شماره دانشجویی تکراری است' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}