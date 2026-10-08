import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE — حذف ثبت‌نام
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.enrollment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}