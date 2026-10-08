import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const execAsync = promisify(exec);

const PG_DUMP_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';
const PG_RESTORE_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

const DB_PASSWORD = 'abdullah';
const DB_NAME = 'kawish_db';
const DB_USER = 'postgres';

function makeSafetyFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `safety-before-restore-${year}${month}${day}-${hour}${minute}${second}.sql`;
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fileName = body.fileName;

    if (!fileName) {
      return NextResponse.json({ error: 'نام فایل بکاپ را انتخاب کنید' }, { status: 400 });
    }

    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json({ error: 'نام فایل نامعتبر' }, { status: 400 });
    }

    const filePath = path.join(BACKUP_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'فایل بکاپ یافت نشد' }, { status: 404 });
    }

    ensureBackupDir();

    // گام ۱: بکاپ اضطراری قبل از بازیابی
    const safetyFileName = makeSafetyFileName();
    const safetyFilePath = path.join(BACKUP_DIR, safetyFileName);

    const dumpCommand = `"${PG_DUMP_PATH}" -U ${DB_USER} -d ${DB_NAME} -f "${safetyFilePath}"`;

    await execAsync(dumpCommand, {
      env: { ...process.env, PGPASSWORD: DB_PASSWORD },
      windowsHide: true,
    });

    if (!fs.existsSync(safetyFilePath)) {
      return NextResponse.json(
        { error: 'ساخت بکاپ اضطراری ناموفق بود. بازیابی متوقف شد.' },
        { status: 500 }
      );
    }

    // گام ۲: پاک کردن جداول فعلی
    const dropCommand = `"${PG_RESTORE_PATH}" -U ${DB_USER} -d ${DB_NAME} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;

    await execAsync(dropCommand, {
      env: { ...process.env, PGPASSWORD: DB_PASSWORD },
      windowsHide: true,
    });

    // گام ۳: بازیابی از فایل بکاپ
    const restoreCommand = `"${PG_RESTORE_PATH}" -U ${DB_USER} -d ${DB_NAME} -f "${filePath}"`;

    await execAsync(restoreCommand, {
      env: { ...process.env, PGPASSWORD: DB_PASSWORD },
      windowsHide: true,
    });

    return NextResponse.json({
      success: true,
      restoredFrom: fileName,
      safetyBackup: safetyFileName,
      message: 'بازیابی با موفقیت انجام شد',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'خطا در بازیابی' },
      { status: 500 }
    );
  }
}