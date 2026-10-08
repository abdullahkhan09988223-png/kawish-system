import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const execAsync = promisify(exec);

// مسیر PostgreSQL - اگر نسخه دیگری داری، این را عوض کن
const PG_DUMP_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';
const PG_RESTORE_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

// پوشه ذخیره بکاپ‌ها
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// رمز دیتابیس
const DB_PASSWORD = 'abdullah';
const DB_NAME = 'kawish_db';
const DB_USER = 'postgres';

// اطمینان از وجود پوشه backups
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// GET — لیست بکاپ‌های موجود
export async function GET() {
  try {
    ensureBackupDir();

    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          name: f,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024),
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ data: files });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — ساخت بکاپ جدید
export async function POST() {
  try {
    ensureBackupDir();

    const now = new Date();
    const faDate = now.toLocaleDateString('fa-IR').replace(/\//g, '-');
    const time = now.toTimeString().slice(0, 5).replace(':', '-');
    const fileName = `backup-${faDate}-${time}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    // بررسی وجود pg_dump
    if (!fs.existsSync(PG_DUMP_PATH)) {
      return NextResponse.json(
        {
          error: 'pg_dump پیدا نشد. آیا PostgreSQL نصب است؟',
          path: PG_DUMP_PATH,
        },
        { status: 500 }
      );
    }

    // اجرای pg_dump
    const command = `"${PG_DUMP_PATH}" -U ${DB_USER} -d ${DB_NAME} -f "${filePath}"`;

    await execAsync(command, {
      env: { ...process.env, PGPASSWORD: DB_PASSWORD },
      windowsHide: true,
    });

    // بررسی فایل ساخته‌شده
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'فایل بکاپ ساخته نشد' }, { status: 500 });
    }

    const stats = fs.statSync(filePath);

    return NextResponse.json({
      data: {
        name: fileName,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024),
        createdAt: stats.birthtime.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'خطا در ساخت بکاپ' },
      { status: 500 }
    );
  }
}