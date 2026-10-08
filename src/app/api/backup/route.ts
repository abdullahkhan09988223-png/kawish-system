import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const execAsync = promisify(exec);

const PG_DUMP_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

const DB_PASSWORD = 'abdullah';
const DB_NAME = 'kawish_db';
const DB_USER = 'postgres';

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// تبدیل اعداد فارسی به انگلیسی
function toEnglishDigits(str: string): string {
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  return str.split('').map((c) => {
    const pi = persian.indexOf(c);
    if (pi > -1) return String(pi);
    const ai = arabic.indexOf(c);
    if (ai > -1) return String(ai);
    return c;
  }).join('');
}

// نام فایل با اعداد انگلیسی
function makeFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `backup-${year}${month}${day}-${hour}${minute}${second}.sql`;
}

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

export async function POST() {
  try {
    ensureBackupDir();

    const fileName = makeFileName();
    const filePath = path.join(BACKUP_DIR, fileName);

    if (!fs.existsSync(PG_DUMP_PATH)) {
      return NextResponse.json(
        { error: 'pg_dump پیدا نشد. مسیر PostgreSQL را چک کنید.', path: PG_DUMP_PATH },
        { status: 500 }
      );
    }

    const command = `"${PG_DUMP_PATH}" -U ${DB_USER} -d ${DB_NAME} -f "${filePath}"`;

    await execAsync(command, {
      env: { ...process.env, PGPASSWORD: DB_PASSWORD },
      windowsHide: true,
    });

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
    return NextResponse.json({ error: err.message || 'خطا در ساخت بکاپ' }, { status: 500 });
  }
}