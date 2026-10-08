import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const midterm = Number(body.midtermScore) || 0;
    const final = Number(body.finalScore) || 0;
    const practical = Number(body.practicalScore) || 0;
    const total = midterm + final + practical;

    const updated = await prisma.grade.update({
      where: { id: params.id },
      data: {
        midtermScore: midterm,
        finalScore: final,
        practicalScore: practical,
        totalScore: total,
        semester: body.semester || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'نمره یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.grade.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}