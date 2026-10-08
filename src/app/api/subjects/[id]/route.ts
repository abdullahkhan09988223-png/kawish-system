import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: params.id },
      include: {
        teacher: true,
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentNumber: true,
                photo: true,
              },
            },
          },
        },
        schedules: {
          include: {
            classRoom: { select: { name: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: 'مضمون یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ data: subject });
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

    const updated = await prisma.subject.update({
      where: { id: params.id },
      data: {
        code: String(body.code),
        name: String(body.name),
        hours: Number(body.hours) || 3,
        category: body.category || 'general',
        description: body.description || null,
        teacherId: body.teacherId || null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'مضمون یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.subject.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}