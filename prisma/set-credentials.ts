import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════');
  console.log('  🔑 تنظیم نام کاربری و رمز عبور');
  console.log('═══════════════════════════════════');
  console.log('');

  const username = await ask('نام کاربری جدید (مثلاً: admin یا ali): ');
  if (!username.trim()) {
    console.log('❌ نام کاربری خالی است');
    process.exit(1);
  }

  const password = await ask('رمز عبور جدید (حداقل ۴ حرف): ');
  if (!password || password.length < 4) {
    console.log('❌ رمز عبور باید حداقل ۴ حرف باشد');
    process.exit(1);
  }

  const name = await ask('نام نمایشی (مثلاً: مدیر عمومی): ');

  const roleInput = await ask('نقش (ADMIN یا FINANCE) [پیش‌فرض ADMIN]: ');
  const role = roleInput.toUpperCase() === 'FINANCE' ? 'FINANCE' : 'ADMIN';

  console.log('');
  console.log('📝 اطلاعات شما:');
  console.log('   نام کاربری: ' + username);
  console.log('   رمز: ' + password);
  console.log('   نام نمایشی: ' + name);
  console.log('   نقش: ' + role);
  console.log('');

  const confirm = await ask('تأیید می‌کنید؟ (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ لغو شد');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // اگر کاربر با این نام کاربری وجود دارد → آپدیت، وگرنه → ساخت
  const existing = await prisma.user.findFirst({
    where: { email: username },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashedPassword,
        name: name || existing.name,
        role,
      },
    });
    console.log('');
    console.log('✅ کاربر آپدیت شد');
  } else {
    await prisma.user.create({
      data: {
        email: username,
        name: name || username,
        password: hashedPassword,
        role,
      },
    });
    console.log('');
    console.log('✅ کاربر جدید ساخته شد');
  }

  console.log('');
  console.log('🎉 تمام! الان می‌توانی با این اطلاعات وارد شوی.');
  console.log('');

  rl.close();
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });