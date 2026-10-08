import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TYPE_CODES: Record<string, string> = {
  APPRECIATION: 'TQD',
  GRADUATION: 'TSD',
  COURSE: 'KRS',
  EMPLOYMENT: 'SHQ',
  INTRO: 'MRE',
  TESTIMONIAL: 'GWA',
};

async function generateSerial(type: string, year: string): Promise<string> {
  const code = TYPE_CODES[type] || 'CRT';
  const prefix = code + '-' + year + '-';
  const existing = await prisma.certificate.findMany({
    where: { serialNumber: { startsWith: prefix } },
    select: { serialNumber: true },
  });
  let maxNum = 0;
  existing.forEach((c) => {
    const num = parseInt(c.serialNumber.replace(prefix, ''), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  });
  return prefix + String(maxNum + 1).padStart(4, '0');
}

export async function GET() {
  try {
    const certificates = await prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, studentNumber: true, photo: true,
          },
        },
      },
    });
    return NextResponse.json({ data: certificates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.type || !body.title || !body.recipientName || !body.body) {
      return NextResponse.json(
        { error: 'نوع، عنوان، نام دریافت‌کننده و متن الزامی است' },
        { status: 400 }
      );
    }

    const year = body.issuedAt
      ? body.issuedAt.split('/')[0]
      : String(new Date().toLocaleDateString('fa-IR').split('/')[0]);

    let serialNumber = body.serialNumber;
    if (!serialNumber) {
      serialNumber = await generateSerial(body.type, year);
    }

    const certificate = await prisma.certificate.create({
      data: {
        serialNumber,
        type: body.type,
        title: body.title,
        recipientName: body.recipientName,
        fatherName: body.fatherName || null,
        studentId: body.studentId || null,
        className: body.className || null,
        courseName: body.courseName || null,
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        grade: body.grade || null,
        position: body.position || null,
        body: body.body,
        issuedBy: body.issuedBy || null,
        issuedAt: body.issuedAt || new Date().toLocaleDateString('fa-IR'),
        validUntil: body.validUntil || null,
        notes: body.notes || null,
        template: body.template || 'classic',
      },
    });

    return NextResponse.json({ data: certificate }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'سریال نمبر تکراری است' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}