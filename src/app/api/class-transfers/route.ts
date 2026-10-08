import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;

    const transfers = await prisma.classTransfer.findMany({
      where: studentId ? { studentId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ data: transfers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}