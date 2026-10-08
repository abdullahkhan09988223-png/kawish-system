import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: { serial: string } }
) {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { serialNumber: params.serial },
      select: {
        serialNumber: true,
        type: true,
        title: true,
        recipientName: true,
        fatherName: true,
        className: true,
        courseName: true,
        grade: true,
        issuedBy: true,
        issuedAt: true,
        validUntil: true,
        createdAt: true,
      },
    });
    if (!cert) {
      return NextResponse.json({ valid: false, error: 'سند یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ valid: true, data: cert });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}