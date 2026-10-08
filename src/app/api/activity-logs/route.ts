import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const tableName = searchParams.get('tableName') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const limit = parseInt(searchParams.get('limit') || '200', 10);

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (tableName) where.tableName = tableName;

    if (from || to) {
      where.createdAt = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) where.createdAt.lte = d;
      }
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 1000),
    });

    return NextResponse.json({ data: logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.action || !body.tableName) {
      return NextResponse.json(
        { error: 'action و tableName الزامی است' },
        { status: 400 }
      );
    }

    const log = await prisma.activityLog.create({
      data: {
        userId: body.userId || null,
        userName: body.userName || null,
        userRole: body.userRole || null,
        action: body.action,
        tableName: body.tableName,
        recordId: body.recordId || null,
        recordName: body.recordName || null,
        details: body.details || null,
      },
    });

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // پاک کردن لاگ‌های قدیمی‌تر از ۹۰ روز
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const result = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}