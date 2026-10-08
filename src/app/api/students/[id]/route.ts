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

// GET — پروفایل کامل دانشجو
export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        classRoom: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        enrollments: {
          include: {
            subject: {
              include: {
                teacher: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        fees: {
          include: { payments: { orderBy: { createdAt: 'desc' } } },
          orderBy: { createdAt: 'desc' },
        },
        grades: {
          include: { subject: { select: { name: true, code: true } } },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 60,
        },
        transfers: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'دانشجو یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ data: student });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — ویرایش دانشجو
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // ═══ حالت ۱: انتقال به صنف دیگر ═══
    if (body.action === 'transfer') {
      const student = await prisma.student.findUnique({
        where: { id: params.id },
        include: { classRoom: { select: { id: true, name: true } } },
      });

      if (!student) {
        return NextResponse.json({ error: 'دانشجو یافت نشد' }, { status: 404 });
      }

      if (!body.toClassRoomId) {
        return NextResponse.json({ error: 'صنف جدید را انتخاب کنید' }, { status: 400 });
      }

      const newClass = await prisma.classRoom.findUnique({
        where: { id: body.toClassRoomId },
      });

      if (!newClass) {
        return NextResponse.json({ error: 'صنف جدید یافت نشد' }, { status: 404 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // ثبت در تاریخچه
        await tx.classTransfer.create({
          data: {
            studentId: params.id,
            fromClassRoomId: student.classRoomId,
            fromClassName: student.classRoom?.name || null,
            toClassRoomId: body.toClassRoomId,
            toClassName: newClass.name,
            transferDate: body.transferDate || new Date().toLocaleDateString('fa-IR'),
            reason: body.reason || null,
            notes: body.notes || null,
          },
        });

        // آپدیت دانشجو
        const updated = await tx.student.update({
          where: { id: params.id },
          data: { classRoomId: body.toClassRoomId },
        });

        return updated;
      });

      return NextResponse.json({ data: result });
    }

    // ═══ حالت ۲: غیرفعال کردن ═══
    if (body.action === 'deactivate') {
      const updated = await prisma.student.update({
        where: { id: params.id },
        data: {
          isActive: false,
          leftDate: body.leftDate || new Date().toLocaleDateString('fa-IR'),
          leftReason: body.leftReason || null,
        },
      });
      return NextResponse.json({ data: updated });
    }

    // ═══ حالت ۳: فعال کردن مجدد ═══
    if (body.action === 'activate') {
      const updated = await prisma.student.update({
        where: { id: params.id },
        data: {
          isActive: true,
          leftDate: null,
          leftReason: null,
        },
      });
      return NextResponse.json({ data: updated });
    }

    // ═══ حالت ۴: ویرایش کامل ═══
    const totalFee = toNum(body.totalFee);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.student.findUnique({ where: { id: params.id } });
      if (!existing) throw new Error('STUDENT_NOT_FOUND');

      const updated = await tx.student.update({
        where: { id: params.id },
        data: {
          studentNumber: String(body.studentNumber),
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
          feeMonthly: toNum(body.feeMonthly),
          photo: body.photo || null,
        },
      });

      return updated;
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    if (err.message === 'STUDENT_NOT_FOUND') {
      return NextResponse.json({ error: 'دانشجو یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — حذف دانشجو
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.student.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}