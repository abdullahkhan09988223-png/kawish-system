import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 شروع seed کامل...');

  // ۱. کاربران
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@kawish.edu' },
    update: {},
    create: {
      email: 'admin@kawish.edu',
      name: 'مدیر عمومی',
      password: adminHash,
      role: 'ADMIN',
    },
  });

  const financeHash = await bcrypt.hash('finance123', 10);
  await prisma.user.upsert({
    where: { email: 'finance@kawish.edu' },
    update: {},
    create: {
      email: 'finance@kawish.edu',
      name: 'مدیر مالی',
      password: financeHash,
      role: 'FINANCE',
    },
  });
  console.log('✅ کاربران ساخته شدند');

  // ۲. استادان
  const teachersData = [
    { employeeNumber: 'T-001', firstName: 'احمد', lastName: 'کریمی', fatherName: 'محمد', specialization: 'ریاضی', phone: '0700123456', salary: 25000 },
    { employeeNumber: 'T-002', firstName: 'فاطمه', lastName: 'رضایی', fatherName: 'علی', specialization: 'فزیک', phone: '0700234567', salary: 24000 },
    { employeeNumber: 'T-003', firstName: 'محمد', lastName: 'حسینی', fatherName: 'حسن', specialization: 'کیمیا', phone: '0700345678', salary: 23000 },
    { employeeNumber: 'T-004', firstName: 'زهرا', lastName: 'احمدی', fatherName: 'ناصر', specialization: 'بیولوژی', phone: '0700456789', salary: 22000 },
    { employeeNumber: 'T-005', firstName: 'حسن', lastName: 'مرادی', fatherName: 'کریم', specialization: 'دری', phone: '0700567890', salary: 21000 },
  ];

  const teachers = [];
  for (const t of teachersData) {
    const teacher = await prisma.teacher.upsert({
      where: { employeeNumber: t.employeeNumber },
      update: {},
      create: t,
    });
    teachers.push(teacher);
  }
  console.log(`✅ ${teachers.length} استاد ساخته شد`);

  // ۳. کارمندان
  const employeesData = [
    { employeeNumber: 'E-001', firstName: 'عبدالله', lastName: 'نوری', position: 'مدیر مالی', department: 'مالی', salary: 30000 },
    { employeeNumber: 'E-002', firstName: 'سمیرا', lastName: 'جوادی', position: 'حسابدار', department: 'مالی', salary: 20000 },
    { employeeNumber: 'E-003', firstName: 'نوید', lastName: 'صادقی', position: 'منشی', department: 'اداری', salary: 15000 },
  ];

  const employees = [];
  for (const e of employeesData) {
    const emp = await prisma.employee.upsert({
      where: { employeeNumber: e.employeeNumber },
      update: {},
      create: e,
    });
    employees.push(emp);
  }
  console.log(`✅ ${employees.length} کارمند ساخته شد`);

  // ۴. مضامین
  const subjectsData = [
    { code: 'MATH-10', name: 'ریاضی', credits: 4, teacherId: teachers[0].id },
    { code: 'PHYS-10', name: 'فزیک', credits: 3, teacherId: teachers[1].id },
    { code: 'CHEM-10', name: 'کیمیا', credits: 3, teacherId: teachers[2].id },
    { code: 'BIO-10', name: 'بیولوژی', credits: 2, teacherId: teachers[3].id },
    { code: 'DARI-10', name: 'دری', credits: 3, teacherId: teachers[4].id },
    { code: 'ENG-10', name: 'انگلیسی', credits: 3, teacherId: teachers[4].id },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    subjects.push(subject);
  }
  console.log(`✅ ${subjects.length} مضمون ساخته شد`);

  // ۵. صنف‌ها
  const classesData = [
    { name: 'صنف ۱۰ الف', grade: '۱۰', section: 'الف', capacity: 30, room: '۱۰۱', teacherId: teachers[0].id },
    { name: 'صنف ۱۰ ب', grade: '۱۰', section: 'ب', capacity: 30, room: '۱۰۲', teacherId: teachers[1].id },
    { name: 'صنف ۱۱ الف', grade: '۱۱', section: 'الف', capacity: 28, room: '۲۰۱', teacherId: teachers[2].id },
    { name: 'صنف ۱۲ الف', grade: '۱۲', section: 'الف', capacity: 25, room: '۳۰۱', teacherId: teachers[3].id },
  ];

  const classes = [];
  for (const c of classesData) {
    const cls = await prisma.classRoom.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    classes.push(cls);
  }
  console.log(`✅ ${classes.length} صنف ساخته شد`);

  // ۶. دانشجویان
  const studentsData = [
    { studentNumber: 'S-1001', firstName: 'علی', lastName: 'احمدی', fatherName: 'محمد', classRoomId: classes[0].id, phone: '0701111111', parentPhone: '0701111112', gender: 'MALE', totalFee: 12000 },
    { studentNumber: 'S-1002', firstName: 'مریم', lastName: 'کریمی', fatherName: 'حسن', classRoomId: classes[0].id, phone: '0702222222', parentPhone: '0702222223', gender: 'FEMALE', totalFee: 12000 },
    { studentNumber: 'S-1003', firstName: 'حسین', lastName: 'رضایی', fatherName: 'علی', classRoomId: classes[0].id, phone: '0703333333', parentPhone: '0703333334', gender: 'MALE', totalFee: 12000 },
    { studentNumber: 'S-1004', firstName: 'زهرا', lastName: 'حسینی', fatherName: 'کریم', classRoomId: classes[1].id, phone: '0704444444', parentPhone: '0704444445', gender: 'FEMALE', totalFee: 12000 },
    { studentNumber: 'S-1005', firstName: 'رضا', lastName: 'مرادی', fatherName: 'ناصر', classRoomId: classes[1].id, phone: '0705555555', parentPhone: '0705555556', gender: 'MALE', totalFee: 12000 },
    { studentNumber: 'S-1006', firstName: 'فاطمه', lastName: 'نوری', fatherName: 'عبدالله', classRoomId: classes[2].id, phone: '0706666666', parentPhone: '0706666667', gender: 'FEMALE', totalFee: 13000 },
    { studentNumber: 'S-1007', firstName: 'محمد', lastName: 'جوادی', fatherName: 'سمیر', classRoomId: classes[2].id, phone: '0707777777', parentPhone: '0707777778', gender: 'MALE', totalFee: 13000 },
    { studentNumber: 'S-1008', firstName: 'سارا', lastName: 'صادقی', fatherName: 'نوید', classRoomId: classes[3].id, phone: '0708888888', parentPhone: '0708888889', gender: 'FEMALE', totalFee: 14000 },
  ];

  const students = [];
  for (const s of studentsData) {
    const stu = await prisma.student.upsert({
      where: { studentNumber: s.studentNumber },
      update: {},
      create: s,
    });
    students.push(stu);
  }
  console.log(`✅ ${students.length} دانشجو ساخته شد`);

  // ۷. ثبت‌نام دانشجویان در مضامین
  const enrollmentsCount = await prisma.enrollment.count();
  if (enrollmentsCount === 0) {
    for (const student of students) {
      const subsToEnroll = subjects.slice(0, 4);
      for (const subject of subsToEnroll) {
        await prisma.enrollment.upsert({
          where: {
            studentId_subjectId: {
              studentId: student.id,
              subjectId: subject.id,
            },
          },
          update: {},
          create: {
            studentId: student.id,
            subjectId: subject.id,
          },
        });
      }
    }
    console.log('✅ ثبت‌نام‌ها ساخته شد');
  } else {
    console.log(`⏭️ ثبت‌نام‌ها قبلاً وجود دارد (${enrollmentsCount})`);
  }

  // ۸. جدول هفتگی
  const schedulesCount = await prisma.schedule.count();
  if (schedulesCount === 0) {
    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
    const times = [
      { from: '08:00', to: '09:30' },
      { from: '09:45', to: '11:15' },
      { from: '11:30', to: '13:00' },
    ];

    for (const cls of classes) {
      for (let i = 0; i < subjects.length && i < 5; i++) {
        const day = days[i % days.length];
        const time = times[i % times.length];
        await prisma.schedule.create({
          data: {
            classRoomId: cls.id,
            subjectId: subjects[i].id,
            teacherId: subjects[i].teacherId,
            dayOfWeek: day,
            timeFrom: time.from,
            timeTo: time.to,
            room: cls.room,
          },
        });
      }
    }
    console.log('✅ جدول هفتگی ساخته شد');
  }

  // ۹. فیس‌ها
  const feesCount = await prisma.fee.count();
  if (feesCount === 0) {
    for (const student of students) {
      await prisma.fee.create({
        data: {
          studentId: student.id,
          total: student.totalFee,
          paid: 0,
        
          status: 'PENDING',
        },
      });
    }
    console.log('✅ فیس‌ها ساخته شد');
  }

  // ۱۰. حاضری (۳ روز اخیر)
  const attendanceCount = await prisma.attendance.count();
  if (attendanceCount === 0) {
    const dates = ['1404/07/10', '1404/07/11', '1404/07/12'];
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE'];
    for (const date of dates) {
      for (const student of students) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            date,
            status,
          },
        });
      }
    }
    console.log('✅ حاضری ساخته شد');
  }

  // ۱۱. نمرات
  const gradesCount = await prisma.grade.count();
  if (gradesCount === 0) {
    for (const student of students) {
      const enrolled = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        take: 3,
      });
      for (const e of enrolled) {
        const midterm = Math.floor(Math.random() * 30) + 15;
        const final = Math.floor(Math.random() * 30) + 15;
        const practical = Math.floor(Math.random() * 10) + 5;
        const total = midterm + final + practical;

        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: e.subjectId,
            semester: 'چهارده یک',
            midtermScore: midterm,
            finalScore: final,
            practicalScore: practical,
            totalScore: total,
          },
        });
      }
    }
    console.log('✅ نمرات ساخته شد');
  }

  // ۱۲. معاش استادان
  const salariesCount = await prisma.salary.count();
  if (salariesCount === 0) {
    for (const teacher of teachers) {
      await prisma.salary.create({
        data: {
          teacherId: teacher.id,
          amount: teacher.salary,
          month: 'حمل',
          year: '۱۴۰۴',
          isPaid: true,
          paidDate: '1404/01/05',
        },
      });
      await prisma.salary.create({
        data: {
          teacherId: teacher.id,
          amount: teacher.salary,
          month: 'ثور',
          year: '۱۴۰۴',
          isPaid: false,
        },
      });
    }
    console.log('✅ معاش استادان ساخته شد');
  }

  // ۱۳. معاش کارمندان
  const empSalariesCount = await prisma.empSalary.count();
  if (empSalariesCount === 0) {
    for (const emp of employees) {
      await prisma.empSalary.create({
        data: {
          employeeId: emp.id,
          amount: emp.salary,
          month: 'حمل',
          year: '۱۴۰۴',
          isPaid: true,
          paidDate: '1404/01/05',
        },
      });
      await prisma.empSalary.create({
        data: {
          employeeId: emp.id,
          amount: emp.salary,
          month: 'ثور',
          year: '۱۴۰۴',
          isPaid: false,
        },
      });
    }
    console.log('✅ معاش کارمندان ساخته شد');
  }

  // ۱۴. مصارف
  const expensesCount = await prisma.expense.count();
  if (expensesCount === 0) {
    const expenses = [
      { title: 'برق', category: 'خدمات', amount: 5000, date: '1404/07/01', paidBy: 'دفتر' },
      { title: 'آب', category: 'خدمات', amount: 2000, date: '1404/07/01', paidBy: 'دفتر' },
      { title: 'قرطاسیه', category: 'لوازم', amount: 8000, date: '1404/07/05', paidBy: 'مدیر مالی' },
      { title: 'ترمیم صنف', category: 'ترمیمات', amount: 15000, date: '1404/07/08', paidBy: 'مدیر مالی' },
      { title: 'انترنت', category: 'خدمات', amount: 3000, date: '1404/07/01', paidBy: 'دفتر' },
    ];
    for (const e of expenses) {
      await prisma.expense.create({ data: e });
    }
    console.log('✅ مصارف ساخته شد');
  }

  console.log('');
  console.log('🎉 Seed کامل با موفقیت انجام شد!');
  console.log('');
  console.log('📊 خلاصه:');
  console.log('   - ۲ کاربر (admin + finance)');
  console.log(`   - ${teachers.length} استاد`);
  console.log(`   - ${employees.length} کارمند`);
  console.log(`   - ${subjects.length} مضمون`);
  console.log(`   - ${classes.length} صنف`);
  console.log(`   - ${students.length} دانشجو`);
  console.log('');
  console.log('🔑 ورود:');
  console.log('   admin@kawish.edu / admin123');
  console.log('   finance@kawish.edu / finance123');
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });