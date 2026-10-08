import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MONTHS = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || '۱۴۰۴';

    // گرفتن همه پرداخت‌ها
    const payments = await prisma.payment.findMany({
      where: {
        date: { contains: year },
      },
      include: {
        fee: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    // گرفتن همه معاشات استاد
    const salaries = await prisma.salary.findMany({
      where: { year },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // گرفتن همه معاشات کارمند
    const empSalaries = await prisma.empSalary.findMany({
      where: { year },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // گرفتن همه مصارف
    const expenses = await prisma.expense.findMany({
      where: { year },
    });

    // گرفتن فیس‌های پرداخت‌نشده و باقی‌مانده
    const fees = await prisma.fee.findMany({
      where: { year },
    });

    // گروه‌بندی بر اساس ماه
    const monthsData = MONTHS.map((monthName) => {
      // عاید فیس (پرداخت‌ها)
      const monthPayments = payments.filter((p) => {
        if (!p.date) return false;
        return p.date.includes(monthName);
      });
      const feeIncome = monthPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

      // معاش استادان پرداخت‌شده
      const monthTeacherSalaries = salaries.filter((s) => s.month === monthName && s.isPaid);
      const teacherSalary = monthTeacherSalaries.reduce((s, x) => s + Number(x.amount || 0), 0);

      // معاش کارمندان پرداخت‌شده
      const monthEmpSalaries = empSalaries.filter((s) => s.month === monthName && s.isPaid);
      const empSalary = monthEmpSalaries.reduce((s, x) => s + Number(x.amount || 0), 0);

      // مصارف
      const monthExpenses = expenses.filter((e) => e.month === monthName);
      const expenseTotal = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      const totalExpense = teacherSalary + empSalary + expenseTotal;
      const netProfit = feeIncome - totalExpense;

      return {
        month: monthName,
        income: {
          feeIncome,
          paymentsCount: monthPayments.length,
        },
        expenses: {
          teacherSalary,
          empSalary,
          expenseTotal,
          total: totalExpense,
        },
        netProfit,
        profitMargin: feeIncome > 0 ? Math.round((netProfit / feeIncome) * 100) : 0,
      };
    });

    // خلاصه کل سال
    const yearlyTotal = {
      income: monthsData.reduce((s, m) => s + m.income.feeIncome, 0),
      expense: monthsData.reduce((s, m) => s + m.expenses.total, 0),
    };
    const netYearly = yearlyTotal.income - yearlyTotal.expense;

    return NextResponse.json({
      data: {
        year,
        months: monthsData,
        yearly: {
          income: yearlyTotal.income,
          expense: yearlyTotal.expense,
          netProfit: netYearly,
          profitMargin: yearlyTotal.income > 0 ? Math.round((netYearly / yearlyTotal.income) * 100) : 0,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}