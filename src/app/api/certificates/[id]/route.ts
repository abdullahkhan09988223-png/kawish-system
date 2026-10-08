import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, studentNumber: true, photo: true,
            classRoom: { select: { name: true } },
          },
        },
      },
    });
    if (!cert) {
      return NextResponse.json({ error: 'سند یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ data: cert });
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
    const updated = await prisma.certificate.update({
      where: { id: params.id },
      data: {
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
        issuedAt: body.issuedAt || null,
        validUntil: body.validUntil || null,
        notes: body.notes || null,
        template: body.template || 'classic',
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'سند یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.certificate.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}