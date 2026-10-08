import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// GET — دانلود فایل بکاپ
export async function GET(
  _: Request,
  { params }: { params: { name: string } }
) {
  try {
    const fileName = decodeURIComponent(params.name);

    // امنیت: جلوگیری از path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json({ error: 'نام فایل نامعتبر' }, { status: 400 });
    }

    const filePath = path.join(BACKUP_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — حذف بکاپ
export async function DELETE(
  _: Request,
  { params }: { params: { name: string } }
) {
  try {
    const fileName = decodeURIComponent(params.name);

    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json({ error: 'نام فایل نامعتبر' }, { status: 400 });
    }

    const filePath = path.join(BACKUP_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'فایل یافت نشد' }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}